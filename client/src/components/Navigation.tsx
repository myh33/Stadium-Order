import { Link, useLocation } from "wouter";
import { ShoppingBag, Utensils, LayoutDashboard, User } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function Navigation() {
  const [location] = useLocation();
  const cartCount = useCart(state => state.totalItems());
  const { user } = useAuth();

  const isAdmin = user?.email?.includes("admin") || false; // Simple check, real app would verify claims

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 backdrop-blur-lg safe-area-bottom md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo - Hidden on mobile, shown on md */}
        <Link href="/" className="hidden md:flex items-center gap-2 font-display text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
          <span className="text-3xl">🏟️</span> STADIUM<span className="text-white">EATS</span>
        </Link>

        {/* Mobile & Desktop Menu Items */}
        <div className="w-full md:w-auto flex items-center justify-around md:justify-end md:gap-8">
          
          <Link href="/" className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
            location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}>
            <Utensils className="w-6 h-6" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Menu</span>
          </Link>

          <Link href="/cart" className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative",
            location === "/cart" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}>
            <div className="relative">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider">Order</span>
          </Link>

          {isAdmin && (
            <Link href="/admin" className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
              location.startsWith("/admin") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              <LayoutDashboard className="w-6 h-6" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Admin</span>
            </Link>
          )}

           {/* Auth Link - Shows Login or Profile */}
           <a href={user ? "/profile" : "/api/login"} className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
            location === "/profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}>
            {user ? (
               // If logged in, show avatar or icon
               user.profileImageUrl ? (
                 <img src={user.profileImageUrl} alt="Me" className="w-6 h-6 rounded-full border border-primary/50" />
               ) : (
                 <User className="w-6 h-6" />
               )
            ) : (
               <User className="w-6 h-6" />
            )}
            <span className="text-[10px] font-medium uppercase tracking-wider">{user ? "Me" : "Login"}</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
