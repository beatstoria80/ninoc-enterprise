import { AppDataSource } from "./src/server/infrastructure/database/DataSource";
import { Product } from "./src/server/core/entities/Product";

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Product);
  
  const count = await repo.count();
  if (count === 0) {
    console.log("Seeding initial products...");
    const p1 = repo.create({
      name: "NIWA KEBAYA - ONYX",
      price: 1250000,
      hpp: 450000,
      originalPrice: 1550000,
      discountTag: "SAVE 20%",
      category: "wastra",
      stock: 12,
      description: "Modern niwa kebaya with onyx accents.",
      sku: "PRD-001",
      status: "active",
      featured: true,
      bg: "#F5F5F5",
      sizes: ["S", "M", "L", "XL"]
    });
    await repo.save(p1);
    console.log("Seed complete.");
  } else {
    console.log("Database already has data.");
  }
  process.exit(0);
}

seed();
