import { useCart } from "@/hooks/use-cart";
import { useSections } from "@/hooks/use-sections";
import { useCreateOrder } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Minus, Plus, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";

// Schema for guest/seat details
const checkoutSchema = z.object({
  guestName: z.string().optional(),
  type: z.enum(["pickup", "delivery"]),
  sectionId: z.string().optional(), // Using string for select, coerce later
  row: z.string().optional(),
  seat: z.string().optional(),
}).refine((data) => {
  if (data.type === "delivery") {
    return !!data.sectionId && !!data.row && !!data.seat;
  }
  return true;
}, {
  message: "Section, row, and seat are required for delivery",
  path: ["sectionId"], 
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const { data: sections } = useSections();
  const { user } = useAuth();
  const { mutateAsync: createOrder, isPending } = useCreateOrder();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      type: "pickup",
      guestName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    },
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    if (items.length === 0) return;

    try {
      const order = await createOrder({
        items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
        type: deliveryType,
        guestName: data.guestName || "Guest",
        sectionId: data.sectionId ? parseInt(data.sectionId) : undefined,
        row: data.row,
        seat: data.seat,
      });

      clearCart();
      toast({
        title: "Order Placed!",
        description: `Order #${order.orderNumber} has been received.`,
      });
      setLocation(`/orders/${order.id}`);
    } catch (error: any) {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-6 border border-white/5">
          <Trash2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold font-display mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">Get some snacks before kickoff!</p>
        <button 
          onClick={() => setLocation("/")}
          className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const cartSubtotal = subtotal();
  const deliveryFee = deliveryType === "delivery" ? 2.50 : 0;
  const total = cartSubtotal + deliveryFee;

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 max-w-lg mx-auto">
      <h1 className="text-3xl font-display font-bold mb-6">Your Order</h1>

      {/* Cart Items */}
      <div className="space-y-4 mb-8">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex gap-4 bg-card p-4 rounded-xl border border-border shadow-sm"
            >
              <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-lg bg-muted" />
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h3 className="font-bold line-clamp-1">{item.name}</h3>
                  <span className="font-mono text-primary">€{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{item.category}</p>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 hover:text-destructive transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="flex-1" />
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-muted-foreground hover:text-destructive underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delivery Toggle */}
      <div className="bg-card p-1 rounded-xl border border-white/5 flex mb-6">
        <button
          onClick={() => { setDeliveryType("pickup"); form.setValue("type", "pickup"); }}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            deliveryType === "pickup" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pickup (Free)
        </button>
        <button
          onClick={() => { setDeliveryType("delivery"); form.setValue("type", "delivery"); }}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            deliveryType === "delivery" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Seat Delivery (+€2.50)
        </button>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-8">
        {!user && (
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Your Name</label>
            <input
              {...form.register("guestName")}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
              placeholder="Enter your name"
            />
          </div>
        )}

        <AnimatePresence>
          {deliveryType === "delivery" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Section</label>
                <select
                  {...form.register("sectionId")}
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary appearance-none"
                >
                  <option value="">Select Section</option>
                  {sections?.filter(s => s.isDeliveryAvailable).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {form.formState.errors.sectionId && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.sectionId.message}</p>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Row</label>
                  <input
                    {...form.register("row")}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                    placeholder="Row"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Seat</label>
                  <input
                    {...form.register("seat")}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                    placeholder="Seat"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Total Summary */}
        <div className="border-t border-border/50 pt-4 mt-6 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>€{cartSubtotal.toFixed(2)}</span>
          </div>
          {deliveryType === "delivery" && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery Fee</span>
              <span>€{deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold font-mono pt-2 text-foreground">
            <span>Total</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Pay €{total.toFixed(2)} <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
