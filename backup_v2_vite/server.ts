import express from "express";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { AppDataSource } from "./src/server/infrastructure/database/DataSource";
import { Product as ProductEntity } from "./src/server/core/entities/Product";
import { AuditLog as AuditLogEntity } from "./src/server/core/entities/AuditLog";
import { User as UserEntity } from "./src/server/core/entities/User";
import { ChatMessage as ChatMessageEntity } from "./src/server/core/entities/ChatMessage";
import { Notification as NotificationEntity } from "./src/server/core/entities/Notification";
import { Transaction as TransactionEntity, TransactionStatus } from "./src/server/core/entities/Transaction";
import { UserRepository } from "./src/server/infrastructure/repositories/UserRepository";
import { PaymentService } from "./src/server/infrastructure/security/PaymentService";
import { z } from "zod";

// Zod Schemas for Validation
const ProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.coerce.number().min(0),
  hpp: z.coerce.number().min(0).optional().default(0),
  originalPrice: z.coerce.number().min(0).optional().nullable(),
  discountTag: z.string().optional().nullable(),
  taxAmount: z.coerce.number().min(0).optional().default(0),
  feeAmount: z.coerce.number().min(0).optional().default(0),
  netMargin: z.coerce.number().optional().default(0),
  category: z.string().optional().default("General"),
  stock: z.coerce.number().int().min(0).optional().default(0),
  description: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  perspective1: z.string().optional().nullable(),
  perspective2: z.string().optional().nullable(),
  perspective3: z.string().optional().nullable(),
  perspective4: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  status: z.enum(["active", "draft", "archived"]).optional().default("active"),
  featured: z.boolean().optional().default(false),
  isPKP: z.boolean().optional().default(false),
  bg: z.string().optional().default("#F5F5F5"),
  sizes: z.array(z.string()).optional().default([]),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Start listening immediately to release the AI Studio 'Please wait' screen
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Initialize Database in background after port is claimed
    console.log("[Database] Starting persistence layer initialization...");
    AppDataSource.initialize()
      .then(async () => {
        console.log("[Database] Persistence layer initialized successfully.");
        
        // Auto-seed if empty
        try {
          const productRepo = AppDataSource.getRepository(ProductEntity);
          const count = await productRepo.count();
          if (count === 0) {
            console.log("[Database] No products found. Running initial seed...");
            const initialProduct = productRepo.create({
              name: "NINOC SIGNATURE KEBAYA",
              price: 1550000,
              hpp: 550000,
              originalPrice: 1850000,
              discountTag: "NEW ARRIVAL",
              category: "wastra",
              stock: 12,
              description: "Eksklusif Niwa Kebaya dengan sentuhan wastra pilihan.",
              sku: "PRD-001",
              status: "active",
              featured: true,
              bg: "#F5F5F5",
              sizes: ["S", "M", "L", "XL"]
            });
            await productRepo.save(initialProduct);
            console.log("[Database] Initial seed complete.");
          }
        } catch (seedErr) {
          console.error("[Database] Auto-seed failed:", seedErr);
        }
      })
      .catch((err: any) => {
        console.error("[Database] CRITICAL_FAILURE: Initialization failed.");
        console.error(`Error details: ${err.message || 'No message'}`);
      });
  });

  try {
    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ limit: '100mb', extended: true }));
    
    app.use(cors({
      origin: true,
      credentials: true,
    }));

    const JWT_SECRET = process.env.ENCRYPTION_SECRET || "super_secret_for_ninoc_2025";
    const userRepo = new UserRepository();

    // Middleware: Auth Token
    const authenticateToken = (req: any, res: any, next: any) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) return res.status(401).json({ error: "Unauthorized" });

      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: "Forbidden" });
        req.user = user;
        next();
      });
    };

    // Basic logging middleware
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });

    // ─── API ERROR HANDLER (EARLY) ───────────────────────────
    // This catches errors like malformed JSON in requests
    app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (err) {
        console.error(`[API Early Error] ${req.method} ${req.path}:`, err);
        return res.status(err.status || 400).json({
          success: false,
          message: "Format permintaan tidak valid atau terjadi kesalahan server.",
          detail: process.env.NODE_ENV !== 'production' ? err.message : undefined
        });
      }
      next();
    });

    // DB Availability Middleware (Hanya untuk API)
    app.use("/api", (req, res, next) => {
      const cleanPath = req.path.replace(/\/$/, "");
      const fullPath = req.originalUrl.split('?')[0].replace(/\/$/, "");
      
      if (fullPath.endsWith("/events") || fullPath.endsWith("/health") || fullPath === "/api") {
        return next();
      }

      if (!AppDataSource.isInitialized) {
        console.warn(`[API Hold] DB Belum Siap: ${req.method} ${req.originalUrl}`);
        return res.status(503).json({ 
          success: false, 
          message: "Sistem database sedang disiapkan. Silakan tunggu sebentar dan segarkan halaman." 
        });
      }
      next();
    });

  // ─── AUDIT HELPER ─────────────────────────────────────────
  const logAction = async (req: express.Request, action: string, metadata: any) => {
    try {
      const logRepo = AppDataSource.getRepository(AuditLogEntity);
      const log = new AuditLogEntity();
      log.action = action;
      log.metadata = metadata;
      log.ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      await logRepo.save(log);
    } catch (e) {
      console.error("Audit log failed:", e);
    }
  };

  // ─── SSE: REAL-TIME BROADCAST ──────────────────────────────
  const sseClients = new Set<express.Response>();

  const broadcast = (eventData: any) => {
    const message = `data: ${JSON.stringify(eventData)}\n\n`;
    sseClients.forEach(client => {
      try {
        client.write(message);
      } catch (e) {
        sseClients.delete(client);
      }
    });
    console.log(`📡 BROADCAST → ${sseClients.size} client(s):`, eventData.type);
  };

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);
    console.log(`🔌 SSE client connected. Total: ${sseClients.size}`);

    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

    req.on('close', () => {
      sseClients.delete(res);
      clearInterval(heartbeat);
      console.log(`🔌 SSE client disconnected. Total: ${sseClients.size}`);
    });
  });

    // ─── API ROUTES ───────────────────────────────────────────
    
    // Health (Quick check for readiness)
    app.get("/api/health", (req, res) => {
      res.json({ 
        status: AppDataSource.isInitialized ? "sistem_siap" : "inisialisasi_database",
        dbReady: AppDataSource.isInitialized,
        timestamp: new Date().toISOString() 
      });
    });

  // Metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const productRepo = AppDataSource.getRepository(ProductEntity);
      const all = await productRepo.find();
      
      const totalInventoryValue = all.reduce((acc, p) => acc + (p.status === 'active' ? (Number(p.price) * p.stock) : 0), 0);
      const totalHPPValue = all.reduce((acc, p) => acc + (p.status === 'active' ? (Number(p.hpp || 0) * p.stock) : 0), 0);
      const totalTaxValue = all.reduce((acc, p) => acc + (p.status === 'active' ? (Number(p.taxAmount || 0) * p.stock) : 0), 0);
      const totalFeeValue = all.reduce((acc, p) => acc + (p.status === 'active' ? (Number(p.feeAmount || 0) * p.stock) : 0), 0);

      const metrics = {
        totalProducts: all.length,
        lowStock: all.filter(p => p.stock <= 5 && p.status === 'active').length,
        totalRevenue: 84200000, // Based on dashboard blueprint dummy data
        unitsSold: 1240,
        totalInventoryValue,
        potentialProfit: totalInventoryValue - totalHPPValue - totalTaxValue - totalFeeValue,
        activeInventoryTotal: all.filter(p => p.status === 'active').length,
        draftInventoryTotal: all.filter(p => p.status === 'draft').length,
        archivedInventoryTotal: all.filter(p => p.status === 'archived').length,
        stockDistribution: {
          ok: all.filter(p => p.stock > 5 && p.status === 'active').length,
          low: all.filter(p => p.stock <= 5 && p.stock > 0 && p.status === 'active').length,
          out: all.filter(p => p.stock === 0 && p.status === 'active').length,
        }
      };
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Metrics retrieval failed" });
    }
  });

  // Products CRUD
  app.get("/api/products", async (req, res) => {
    try {
      if (!AppDataSource.isInitialized) {
        console.error("[API ERROR] AppDataSource belum diinisialisasi");
        return res.status(503).json({ error: "Database belum siap" });
      }
      const productRepo = AppDataSource.getRepository(ProductEntity);
      const products = await productRepo.find({ order: { updatedAt: "DESC" } });
      res.json(products);
    } catch (error: any) {
      console.error("[SERVER ERROR] Gagal mengambil produk:", error);
      res.status(500).json({ error: "Gagal mengambil produk", detail: error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validated = ProductSchema.parse(req.body);
      const productRepo = AppDataSource.getRepository(ProductEntity);
      
      const product = productRepo.create(validated);
      // Explicitly map perspective fields
      product.perspective1 = validated.perspective1;
      product.perspective2 = validated.perspective2;
      product.perspective3 = validated.perspective3;
      product.perspective4 = validated.perspective4;

      if (!product.sku) {
        // Auto-generate SKU as per blueprint
        const count = await productRepo.count();
        product.sku = `PRD-${String(count + 1).padStart(3, '0')}`;
      }
      
      const saved = await productRepo.save(product);
      await logAction(req, "PRODUCT_CREATE", { id: saved.id, sku: saved.sku });
      
      broadcast({ type: 'PRODUCT_CREATED', payload: saved });

      res.status(201).json({ success: true, data: saved, message: "Produk berhasil ditambahkan" });
    } catch (error: any) {
      console.error("[POST /api/products] CRITICAL_ERROR:", error);
      if (error instanceof z.ZodError) {
        console.error("[POST /api/products] Validation Errors:", error.flatten().fieldErrors);
        return res.status(400).json({ success: false, errors: error.flatten().fieldErrors, message: "Validasi data gagal" });
      }
      res.status(500).json({ 
        success: false, 
        message: `Koneksi Database/Payload Gagal: ${error.message || 'Unknown Error'}.`,
        debug: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validated = ProductSchema.partial().parse(req.body);
      const productRepo = AppDataSource.getRepository(ProductEntity);
      
      const existing = await productRepo.findOneBy({ id });
      if (!existing) return res.status(404).json({ success: false, message: "Not found" });
      
      const updated = await productRepo.save({ 
        ...existing, 
        ...validated,
        perspective1: validated.perspective1 ?? existing.perspective1,
        perspective2: validated.perspective2 ?? existing.perspective2,
        perspective3: validated.perspective3 ?? existing.perspective3,
        perspective4: validated.perspective4 ?? existing.perspective4,
      });
      await logAction(req, "PRODUCT_UPDATE", { id, changes: validated });
      
      broadcast({ type: 'PRODUCT_UPDATED', payload: updated });

      res.json({ success: true, data: updated, message: "Produk berhasil diperbarui" });
    } catch (error: any) {
      console.error("[PUT /api/products/:id] CRITICAL_ERROR:", error);
      if (error instanceof z.ZodError) {
        console.error("[PUT /api/products/:id] Validation Errors:", error.flatten().fieldErrors);
        return res.status(400).json({ success: false, errors: error.flatten().fieldErrors, message: "Validasi data gagal" });
      }
      res.status(500).json({ 
        success: false, 
        message: `Update Gagal: ${error.message || 'Unknown Error'}`,
        debug: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const productRepo = AppDataSource.getRepository(ProductEntity);
      const existing = await productRepo.findOneBy({ id });
      
      if (!existing) return res.status(404).json({ success: false, message: "Not found" });
      
      const permanent = req.query.permanent === 'true';

      if (permanent) {
        await productRepo.remove(existing);
        await logAction(req, "DELETE_PERMANENT", { id, sku: existing.sku });
        broadcast({ type: 'PRODUCT_DELETED', payload: { id, permanent: true } });
        res.json({ success: true, message: "Produk dihapus permanen" });
      } else {
        existing.status = 'backlog';
        await productRepo.save(existing);
        await logAction(req, "PRODUCT_QUARANTINE", { id, sku: existing.sku });
        broadcast({ type: 'PRODUCT_QUARANTINED', payload: { id, sku: existing.sku } });
        res.json({ success: true, message: "Produk dipindahkan ke backlog" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Delete failed" });
    }
  });

  app.get("/api/logs", async (req, res) => {
    try {
      const logRepo = AppDataSource.getRepository(AuditLogEntity);
      const logs = await logRepo.find({ order: { timestamp: "DESC" }, take: 50 });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil log audit" });
    }
  });

  // ─── AUTH & USER ROUTES ───────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      const existing = await userRepo.findByUsername(username || email);
      if (existing) return res.status(400).json({ error: "Username/Email sudah terdaftar" });

      const user = await userRepo.create({
        username: username || email,
        password,
        email,
        role: "USER"
      });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ success: true, user: user.toMasked(), token });
    } catch (error: any) {
      res.status(500).json({ error: "Registrasi gagal", detail: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      const user = await userRepo.authenticate(username || email, password);
      
      if (!user) return res.status(401).json({ error: "Email atau password salah" });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ success: true, user: user.toMasked(), token });
    } catch (error: any) {
      res.status(500).json({ error: "Login gagal", detail: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await userRepo.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user: user.toMasked() });
    } catch (error) {
      res.status(500).json({ error: "Auth check failed" });
    }
  });

  app.post("/api/users/profile", authenticateToken, async (req: any, res) => {
    try {
      const { fullName, phone, gender, birthDate, address } = req.body;
      const user = await userRepo.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.displayName = fullName;
      user.phoneNumber = phone;
      user.gender = gender;
      user.birthDate = birthDate;
      user.address = address;

      const updated = await AppDataSource.getRepository(UserEntity).save(user);
      res.json({ success: true, user: updated.toMasked() });
    } catch (error: any) {
      res.status(500).json({ error: "Gagal memperbarui profil", detail: error.message });
    }
  });

  // ─── CHAT ROUTES ──────────────────────────────────────────
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const chatRepo = AppDataSource.getRepository(ChatMessageEntity);
      const messages = await chatRepo.find({ 
        order: { createdAt: "ASC" }, 
        take: 100,
        relations: ["user"]
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil pesan" });
    }
  });

  app.post("/api/chat/messages", authenticateToken, async (req: any, res) => {
    try {
      const { text } = req.body;
      const user = await userRepo.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const chatRepo = AppDataSource.getRepository(ChatMessageEntity);
      const message = chatRepo.create({
        text,
        userId: user.id,
        userName: user.displayName || user.username,
        user: user
      });

      const saved = await chatRepo.save(message);
      broadcast({ type: 'CHAT_MESSAGE_RECEIVED', payload: saved });
      res.status(201).json(saved);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengirim pesan" });
    }
  });

  // ─── NOTIFICATION ROUTES ──────────────────────────────────
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifyRepo = AppDataSource.getRepository(NotificationEntity);
      const notifications = await notifyRepo.find({ order: { createdAt: "DESC" }, take: 20 });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil notifikasi" });
    }
  });

  // ─── PAYMENT ROUTES ───────────────────────────────────────
  app.post("/api/payments/create", authenticateToken, async (req: any, res) => {
    try {
      const { amount, customer } = req.body;
      const orderId = `NINOC-${Date.now()}`;
      
      const transactionRepo = AppDataSource.getRepository(TransactionEntity);
      const transaction = transactionRepo.create({
        orderId,
        amount,
        customerEmail: customer.email,
        userId: req.user.id,
        status: TransactionStatus.PENDING
      });
      await transactionRepo.save(transaction);

      const midtransResponse = await PaymentService.createTransaction(orderId, amount, customer);
      
      res.json(midtransResponse);
    } catch (error: any) {
      console.error("Payment creation error:", error);
      res.status(500).json({ error: "Gagal membuat transaksi pembayaran", detail: error.message });
    }
  });

  app.post("/api/checkout", authenticateToken, async (req: any, res) => {
    try {
      const { items, total, shippingInfo } = req.body;
      const productRepo = AppDataSource.getRepository(ProductEntity);
      
      // Update stock for each item
      for (const item of items) {
        const product = await productRepo.findOneBy({ id: item.id });
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantity);
          await productRepo.save(product);
          broadcast({ type: 'PRODUCT_UPDATED', payload: product });
        }
      }

      await logAction(req, "CHECKOUT_COMPLETE", { total, itemCount: items.length, shippingInfo });
      
      res.json({ success: true, orderId: `ORD-${Date.now()}` });
    } catch (error: any) {
      console.error("Checkout processing error:", error);
      res.status(500).json({ error: "Checkout failed", detail: error.message });
    }
  });

  // ─── API 404 HANDLER ──────────────────────────────────────
  app.all("/api/*", (req, res) => {
    res.status(404).json({ 
      success: false, 
      message: `Endpoint API tidak ditemukan: ${req.method} ${req.originalUrl}` 
    });
  });

  // ─── GLOBAL ERROR HANDLER ─────────────────────────────────
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Global Error] ${req.method} ${req.path}:`, err);
    
    const status = err.status || err.statusCode || 500;
    const isApi = req.path.startsWith('/api') || req.originalUrl.startsWith('/api');

    if (isApi) {
      return res.status(status).json({
        success: false,
        message: "Terjadi kesalahan pada server.",
        detail: process.env.NODE_ENV !== 'production' ? err.message : undefined
      });
    }
    
    next(err);
  });


  // ─── VITE MIDDLEWARE ──────────────────────────────────────
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

  } catch (globalError: any) {
    console.error("[Fatal Server Error]:", globalError);
  }
}

startServer();
