import "dotenv/config";
import mongoose from "mongoose";
import pg from "pg";

async function run() {
  console.log("==========================================");
  console.log("Database Hard Reset Initiated");
  console.log("==========================================");

  // 1. Reset MongoDB
  const mongoUri = String(process.env.MONGODB_URI || "").trim();
  if (!mongoUri) {
    console.error("MONGODB_URI missing.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    
    console.log("Fetching MongoDB collections...");
    const collections = await db.listCollections().toArray();
    
    for (const coll of collections) {
      console.log(`Dropping MongoDB collection: ${coll.name}...`);
      await db.dropCollection(coll.name);
    }
    console.log("✅ MongoDB successfully cleared.");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Failed to clear MongoDB:", err.message);
  }

  // 2. Reset NeonDB
  const sqlUri = String(process.env.DATABASE_URL || "").trim();
  if (!sqlUri) {
    console.error("DATABASE_URL missing.");
    process.exit(1);
  }

  try {
    console.log("Connecting to NeonDB...");
    const client = new pg.Client({
      connectionString: sqlUri,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    console.log("Dropping and recreating public schema...");
    await client.query("DROP SCHEMA public CASCADE;");
    await client.query("CREATE SCHEMA public;");
    console.log("✅ NeonDB successfully cleared.");
    await client.end();
  } catch (err) {
    console.error("❌ Failed to clear NeonDB:", err.message);
  }

  console.log("==========================================");
  console.log("Hard Reset Complete! You can now seed data.");
  process.exit(0);
}

run();
