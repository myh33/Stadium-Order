import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useSections, useUpdateSection } from "@/hooks/use-sections";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Bike, Store, CheckCircle, Clock, XCircle, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useOrders(); // Gets all orders
  const { data: sections } = useSections();
  const { mutate: updateStatus } = useUpdateOrderStatus();
  const { mutate: updateSection } = useUpdateSection();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  if (authLoading || ordersLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  // Simple protection - in real app, backend handles 403
  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  const activeOrders = orders?.filter(o => !["completed", "cancelled"].includes(o.status)) || [];
  const historyOrders = orders?.filter(o => ["completed", "cancelled"].includes(o.status)) || [];

  const displayOrders = activeTab === "active" ? activeOrders : historyOrders;

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <LayoutDashboard className="text-primary" /> 
            Kitchen Display
          </h1>
          <p className="text-muted-foreground">Manage incoming orders and delivery zones</p>
        </div>
        
        {/* Section Toggles */}
        <div className="bg-card p-4 rounded-xl border border-border/50">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Delivery Zones</h3>
          <div className="flex flex-wrap gap-2">
            {sections?.map(section => (
              <button
                key={section.id}
                onClick={() => updateSection({ id: section.id, isDeliveryAvailable: !section.isDeliveryAvailable })}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold border transition-all",
                  section.isDeliveryAvailable 
                    ? "bg-primary/20 border-primary text-primary hover:bg-primary/30" 
                    : "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
                )}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/50 mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={cn(
            "pb-3 px-2 font-bold transition-colors relative",
            activeTab === "active" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Active Orders ({activeOrders.length})
          {activeTab === "active" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "pb-3 px-2 font-bold transition-colors relative",
            activeTab === "history" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          History
          {activeTab === "history" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
        </button>
      </div>

      {/* Order Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {displayOrders.map((order) => (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "bg-card rounded-xl border-2 p-4 flex flex-col gap-3 shadow-lg",
                order.status === 'preparing' ? "border-accent/50" : 
                order.status === 'ready' ? "border-primary/50" : "border-border"
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">#{order.orderNumber}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    {order.type === 'delivery' ? <Bike className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                    <span className="uppercase">{order.type}</span>
                    {order.type === 'delivery' && (
                      <span className="ml-1 bg-white/10 px-1 rounded">S{order.section?.name?.split(' ')[1]} / R{order.row} / St{order.seat}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm">
                    {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-muted/20 p-2 rounded-lg text-sm space-y-1">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span><span className="font-bold text-primary mr-2">{item.quantity}x</span> {item.product.name}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                {order.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateStatus({ id: order.id, status: 'cancelled' })}
                      className="bg-destructive/10 text-destructive hover:bg-destructive/20 py-2 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => updateStatus({ id: order.id, status: 'preparing' })}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 py-2 rounded-lg text-xs font-bold"
                    >
                      Start Prep
                    </button>
                  </>
                )}
                {order.status === 'preparing' && (
                  <button 
                    onClick={() => updateStatus({ id: order.id, status: order.type === 'delivery' ? 'delivering' : 'ready' })}
                    className="col-span-2 bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-lg text-sm font-bold animate-pulse"
                  >
                    Mark Ready
                  </button>
                )}
                {(order.status === 'ready' || order.status === 'delivering') && (
                  <button 
                    onClick={() => updateStatus({ id: order.id, status: 'completed' })}
                    className="col-span-2 bg-white/10 text-white hover:bg-white/20 py-2 rounded-lg text-sm font-bold border border-white/20"
                  >
                    Complete Order
                  </button>
                )}
                {order.status === 'completed' && (
                  <div className="col-span-2 text-center text-xs font-bold text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Completed
                  </div>
                )}
                {order.status === 'cancelled' && (
                  <div className="col-span-2 text-center text-xs font-bold text-destructive flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3" /> Cancelled
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
