import { db } from "./db";
import {
  products,
  sections,
  orders,
  orderItems,
  type Product,
  type Section,
  type Order,
  type OrderItem,
  type CreateOrderRequest,
  type OrderStatusUpdate,
  type SectionUpdate,
  type OrderWithDetails,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;

  // Sections
  getSections(): Promise<Section[]>;
  updateSection(id: number, update: SectionUpdate): Promise<Section>;

  // Orders
  createOrder(orderData: CreateOrderRequest): Promise<OrderWithDetails>;
  getOrder(id: number): Promise<OrderWithDetails | undefined>;
  getOrders(status?: string): Promise<OrderWithDetails[]>;
  updateOrderStatus(id: number, status: string): Promise<OrderWithDetails>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getSections(): Promise<Section[]> {
    return await db.select().from(sections);
  }

  async updateSection(id: number, update: SectionUpdate): Promise<Section> {
    const [section] = await db
      .update(sections)
      .set(update)
      .where(eq(sections.id, id))
      .returning();
    return section;
  }

  async createOrder(orderData: CreateOrderRequest): Promise<OrderWithDetails> {
    // Calculate total
    let total = 0;
    const deliveryFee = orderData.type === 'delivery' ? 2.50 : 0;
    
    // Fetch prices (in a real app, optimize this)
    const itemsWithPrice = [];
    for (const item of orderData.items) {
      const product = await this.getProduct(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const price = Number(product.price);
      total += price * item.quantity;
      itemsWithPrice.push({ ...item, priceAtTime: price });
    }
    
    total += deliveryFee;

    // Create Order
    const [newOrder] = await db.insert(orders).values({
      type: orderData.type,
      status: "pending",
      totalAmount: total.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      sectionId: orderData.sectionId,
      row: orderData.row,
      seat: orderData.seat,
      guestName: orderData.guestName,
      orderNumber: nanoid(6).toUpperCase(),
    }).returning();

    // Create Order Items
    for (const item of itemsWithPrice) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime.toFixed(2),
      });
    }

    return this.getOrder(newOrder.id) as Promise<OrderWithDetails>;
  }

  async getOrder(id: number): Promise<OrderWithDetails | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, id),
      with: {
        product: true
      }
    });

    const [section] = order.sectionId ? await db.select().from(sections).where(eq(sections.id, order.sectionId)) : [undefined];

    return { ...order, items, section };
  }

  async getOrders(status?: string): Promise<OrderWithDetails[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    // Filter in memory or add where clause if needed, keeping it simple for now
    const filteredOrders = status ? allOrders.filter(o => o.status === status) : allOrders;

    const results: OrderWithDetails[] = [];
    for (const order of filteredOrders) {
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, order.id),
        with: {
          product: true
        }
      });
      const [section] = order.sectionId ? await db.select().from(sections).where(eq(sections.id, order.sectionId)) : [undefined];
      results.push({ ...order, items, section });
    }
    return results;
  }

  async updateOrderStatus(id: number, status: string): Promise<OrderWithDetails> {
    await db.update(orders).set({ status }).where(eq(orders.id, id));
    return this.getOrder(id) as Promise<OrderWithDetails>;
  }
}

export const storage = new DatabaseStorage();
