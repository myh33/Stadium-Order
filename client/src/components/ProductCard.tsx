import { Plus, Minus } from "lucide-react";
import { type Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.id === product.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-lg shadow-black/20">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="px-3 py-1 bg-destructive/90 text-white text-xs font-bold uppercase rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display font-bold text-lg leading-tight">{product.name}</h3>
          <span className="font-mono font-bold text-primary">€{Number(product.price).toFixed(2)}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
          {product.description}
        </p>

        {product.isAvailable ? (
          quantity > 0 ? (
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-1">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-background text-foreground hover:text-destructive transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => addItem(product)}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => addItem(product)}
              className="w-full py-2.5 rounded-lg font-semibold bg-white/5 border border-white/10 hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all duration-200"
            >
              Add to Order
            </motion.button>
          )
        ) : (
          <button disabled className="w-full py-2.5 rounded-lg font-semibold bg-muted text-muted-foreground cursor-not-allowed opacity-50">
            Unavailable
          </button>
        )}
      </div>
    </div>
  );
}
