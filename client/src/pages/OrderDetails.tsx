import { useOrder } from "@/hooks/use-orders";
import { useRoute } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, CheckCircle2, Clock, MapPin, ChefHat, Bike } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const STATUS_STEPS = {
  pending: { step: 1, label: "Order Received", icon: Clock },
  preparing: { step: 2, label: "Preparing Food", icon: ChefHat },
  ready: { step: 3, label: "Ready for Pickup", icon: CheckCircle2 },
  delivering: { step: 3, label: "On the Way", icon: Bike },
  completed: { step: 4, label: "Completed", icon: CheckCircle2 },
  cancelled: { step: 0, label: "Cancelled", icon: Clock },
};

export default function OrderDetails() {
  const [, params] = useRoute("/orders/:id");
  const orderId = parseInt(params?.id || "0");
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground">This order doesn't exist.</p>
        </div>
      </div>
    );
  }

  const currentStatus = order.status as keyof typeof STATUS_STEPS;
  const statusInfo = STATUS_STEPS[currentStatus] || STATUS_STEPS.pending;
  const isPickup = order.type === "pickup";
  const isReady = order.status === "ready" || order.status === "delivering" || order.status === "completed";

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Order #{order.orderNumber}</h1>
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase",
          order.status === "completed" ? "bg-primary/20 text-primary" : 
          order.status === "cancelled" ? "bg-destructive/20 text-destructive" :
          "bg-accent/20 text-accent"
        )}>
          <statusInfo.icon className="w-4 h-4" />
          {statusInfo.label}
        </div>
      </div>

      {/* QR Code Card - Only show for Pickup when ready or completed */}
      {isPickup && order.status !== "cancelled" && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl shadow-black/20 flex flex-col items-center justify-center mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-secondary" />
          
          <QRCodeSVG value={`ORDER-${order.id}`} size={200} level="H" />
          
          <p className="text-black font-bold mt-6 text-lg text-center">
            {isReady ? "Show this at the counter" : "Wait for 'Ready' status"}
          </p>
          <p className="text-gray-500 text-sm mt-1">Order #{order.orderNumber}</p>
        </motion.div>
      )}

      {/* Status Timeline */}
      <div className="bg-card border border-border/50 rounded-xl p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">Tracking</h3>
        <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
          
          {/* Step 1: Received */}
          <div className="relative flex gap-4 items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center z-10 border-2",
              statusInfo.step >= 1 ? "bg-primary border-primary text-black" : "bg-card border-muted text-muted-foreground"
            )}>
              <Clock className="w-4 h-4" />
            </div>
            <div className={statusInfo.step >= 1 ? "opacity-100" : "opacity-50"}>
              <p className="font-bold">Order Received</p>
              <p className="text-xs text-muted-foreground">We've got your order</p>
            </div>
          </div>

          {/* Step 2: Preparing */}
          <div className="relative flex gap-4 items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center z-10 border-2",
              statusInfo.step >= 2 ? "bg-primary border-primary text-black" : "bg-card border-muted text-muted-foreground"
            )}>
              <ChefHat className="w-4 h-4" />
            </div>
            <div className={statusInfo.step >= 2 ? "opacity-100" : "opacity-50"}>
              <p className="font-bold">Preparing</p>
              <p className="text-xs text-muted-foreground">Kitchen is cooking</p>
            </div>
          </div>

          {/* Step 3: Ready/Delivering */}
          <div className="relative flex gap-4 items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center z-10 border-2",
              statusInfo.step >= 3 ? "bg-primary border-primary text-black" : "bg-card border-muted text-muted-foreground"
            )}>
              {order.type === 'delivery' ? <Bike className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            </div>
            <div className={statusInfo.step >= 3 ? "opacity-100" : "opacity-50"}>
              <p className="font-bold">{order.type === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}</p>
              <p className="text-xs text-muted-foreground">
                {order.type === 'delivery' ? 'Heading to your seat' : 'Come to the counter'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-card border border-border/50 rounded-xl p-6">
        <h3 className="font-bold text-lg mb-4 border-b border-border/50 pb-2">Order Summary</h3>
        <div className="space-y-3 mb-4">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div>
                <span className="font-bold text-primary mr-2">{item.quantity}x</span>
                <span className="text-muted-foreground">{item.product.name}</span>
              </div>
              <span className="font-mono">€{(Number(item.priceAtTime) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 pt-2 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="font-mono">€{Number(order.totalAmount).toFixed(2)}</span>
        </div>
        
        {order.type === 'delivery' && (
          <div className="mt-4 bg-muted/30 p-3 rounded-lg text-sm">
            <p className="font-bold mb-1">Delivering to:</p>
            <p className="text-muted-foreground">Section {order.section?.name}, Row {order.row}, Seat {order.seat}</p>
          </div>
        )}
      </div>
    </div>
  );
}
