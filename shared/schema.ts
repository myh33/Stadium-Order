import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import Auth Models
export * from "./models/auth";

// === PRODUCTS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // stored as string in JS, coerce to number
  category: text("category").notNull(), // 'food', 'drink', 'snack'
  imageUrl: text("image_url").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// === DELIVERY ZONES / SECTIONS ===
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Section A", "North Stand"
  isDeliveryAvailable: boolean("is_delivery_available").default(true).notNull(),
});

export const insertSectionSchema = createInsertSchema(sections).omit({ id: true });
export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

// === ORDERS ===
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // Optional: link to auth user if logged in
  guestName: text("guest_name"), // If not logged in
  status: text("status").notNull().default("pending"), // pending, preparing, ready, delivering, completed, cancelled
  type: text("type").notNull(), // 'pickup', 'delivery'
  sectionId: integer("section_id").references(() => sections.id),
  row: text("row"),
  seat: text("seat"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  orderNumber: text("order_number").notNull(), // Human readable unique code
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, status: true, orderNumber: true });
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// === ORDER ITEMS ===
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  priceAtTime: decimal("price_at_time", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// === RELATIONS ===
export const orderRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  section: one(sections, {
    fields: [orders.sectionId],
    references: [sections.id],
  }),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// === API TYPES ===
export type CreateOrderRequest = {
  items: { productId: number; quantity: number }[];
  type: 'pickup' | 'delivery';
  sectionId?: number;
  row?: string;
  seat?: string;
  guestName?: string;
};

export type OrderStatusUpdate = {
  status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled';
};

export type SectionUpdate = {
  isDeliveryAvailable: boolean;
};

export type OrderWithDetails = Order & {
  items: (OrderItem & { product: Product })[];
  section?: Section | null;
};
