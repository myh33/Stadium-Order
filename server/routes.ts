import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { products, sections } from "@shared/schema";
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === API ROUTES ===

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // Sections
  app.get(api.sections.list.path, async (req, res) => {
    const sections = await storage.getSections();
    res.json(sections);
  });

  app.patch(api.sections.update.path, async (req, res) => {
    const section = await storage.updateSection(Number(req.params.id), req.body);
    res.json(section);
  });

  // Orders
  app.post(api.orders.create.path, async (req, res) => {
    try {
      const order = await storage.createOrder(req.body);
      res.status(201).json(order);
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.get(api.orders.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const orders = await storage.getOrders(status);
    res.json(orders);
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    try {
      const order = await storage.updateOrderStatus(Number(req.params.id), req.body.status);
      res.json(order);
    } catch (e) {
      res.status(404).json({ message: "Order not found" });
    }
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    console.log("Seeding database...");
    
    // Seed Products
    await db.insert(products).values([
      { name: "Stadium Burger", description: "Classic beef burger with cheese and lettuce", price: "8.50", category: "food", imageUrl: "https://placehold.co/600x400/orange/white?text=Burger", isAvailable: true },
      { name: "Hot Dog", description: "Grilled jumbo hot dog with mustard and onions", price: "6.00", category: "food", imageUrl: "https://placehold.co/600x400/red/white?text=Hot+Dog", isAvailable: true },
      { name: "Fries", description: "Crispy salted fries", price: "4.50", category: "snack", imageUrl: "https://placehold.co/600x400/yellow/black?text=Fries", isAvailable: true },
      { name: "Soda (Large)", description: "Cola, Diet, or Lemon-Lime", price: "5.00", category: "drink", imageUrl: "https://placehold.co/600x400/black/white?text=Soda", isAvailable: true },
      { name: "Beer", description: "Premium lager 500ml", price: "7.50", category: "drink", imageUrl: "https://placehold.co/600x400/brown/white?text=Beer", isAvailable: true },
      { name: "Nachos", description: "Tortilla chips with cheese sauce and jalapeños", price: "6.50", category: "snack", imageUrl: "https://placehold.co/600x400/orange/black?text=Nachos", isAvailable: true },
    ]);

    // Seed Sections
    await db.insert(sections).values([
      { name: "Section A (Home)", isDeliveryAvailable: true },
      { name: "Section B (Away)", isDeliveryAvailable: true },
      { name: "Section C (VIP)", isDeliveryAvailable: true },
      { name: "Section D (Family)", isDeliveryAvailable: false }, // High traffic test
    ]);
    
    console.log("Database seeded successfully.");
  }
}
