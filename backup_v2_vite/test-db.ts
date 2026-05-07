import { AppDataSource } from "./src/server/infrastructure/database/DataSource";

async function test() {
  try {
    console.log("Attempting to initialize AppDataSource...");
    await AppDataSource.initialize();
    console.log("AppDataSource initialized successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to initialize AppDataSource:");
    console.error(err);
    process.exit(1);
  }
}

test();
