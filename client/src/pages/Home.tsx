import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "food", label: "Food" },
  { id: "drink", label: "Drinks" },
  { id: "snack", label: "Snacks" },
];

export default function Home() {
  const { data: products, isLoading, error } = useProducts();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        Error loading menu. Please try again.
      </div>
    );
  }

  const filteredProducts = products?.filter((product) => {
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-24 pt-4 md:pt-8 min-h-screen bg-background">
      {/* Hero Header */}
      <div className="px-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          GAME DAY<br />GRUB
        </h1>
        <p className="text-muted-foreground max-w-md">
          Skip the line. Order from your seat. Don't miss a minute of the match.
        </p>
      </div>

      {/* Sticky Filters */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5 py-4 space-y-4 px-4 shadow-2xl">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search burgers, beers, fries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200
                ${activeCategory === cat.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                  : "bg-card text-muted-foreground hover:bg-card/80 border border-white/5"}
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <p className="text-lg">No items found matching your search.</p>
          </div>
        ) : (
          filteredProducts?.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
