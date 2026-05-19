import "dotenv/config";
import mongoose from "mongoose";
import { ComponentEmbedding } from "../models/appModels.js";
import { generateEmbedding } from "../services/embeddingProvider.js";
import { upsertPgVectorEmbedding } from "../services/pgVectorSearchService.js";
import { closeSqlPool } from "../sql/db.js";
import { connectMongoWithSrvFallback } from "../utils/mongoSrvFallback.js";

const SAMPLE_EMBEDDINGS = [
  { componentId: "cmp-001", componentName: "Gradient Button", category: "Buttons", text: "animated login button with gradient hover" },
  { componentId: "cmp-002", componentName: "Primary CTA Button", category: "Buttons", text: "primary call to action submit button" },
  { componentId: "cmp-003", componentName: "Neon Input", category: "Forms", text: "glowing email input with validation" },
  { componentId: "cmp-004", componentName: "Validated Input", category: "Forms", text: "form input with error and helper text" },
  { componentId: "cmp-005", componentName: "Toast Notification", category: "Feedback", text: "success and error toast alerts" },
  { componentId: "cmp-006", componentName: "Profile Card", category: "Cards", text: "user profile card with avatar and stats" },
  { componentId: "cmp-007", componentName: "Animated Navbar", category: "Navigation", text: "responsive animated navigation bar" },
  { componentId: "cmp-008", componentName: "Data Table", category: "Data Display", text: "sortable table for records and filters" },
  { componentId: "cmp-009", componentName: "Modal Dialog", category: "Overlays", text: "confirmation modal dialog component" },
  { componentId: "cmp-010", componentName: "Skeleton Loader", category: "Feedback", text: "loading skeleton placeholders for async pages" },
];

async function connectMongo() {
  const uri = String(process.env.MONGODB_URI || "").trim();
  if (!uri) {
    throw new Error("MONGODB_URI is required.");
  }

  await connectMongoWithSrvFallback({
    mongoUri: uri,
    connect: mongoose.connect.bind(mongoose),
    connectOptions: {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
    },
  });
}

async function seedEmbeddings() {
  await connectMongo();

  for (const item of SAMPLE_EMBEDDINGS) {
    const generated = await generateEmbedding({
      text: item.text,
      dimensions: 128,
      metadata: { componentId: item.componentId, componentName: item.componentName, category: item.category },
    });

    await ComponentEmbedding.findOneAndUpdate(
      { componentId: item.componentId },
      {
        $set: {
          componentId: item.componentId,
          componentName: item.componentName,
          category: item.category,
          text: item.text,
          model: generated.model,
          provider: generated.provider,
          embeddingHash: generated.embeddingHash,
          embedding: generated.embedding,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );

    await upsertPgVectorEmbedding({
      componentId: item.componentId,
      componentName: item.componentName,
      category: item.category,
      text: item.text,
      model: generated.model,
      provider: generated.provider,
      embeddingHash: generated.embeddingHash,
      embedding: generated.embedding,
      metadata: { seed: true },
    });
  }

  console.log(`[seed-embeddings] Upserted ${SAMPLE_EMBEDDINGS.length} component embeddings.`);
}

seedEmbeddings()
  .catch((error) => {
    console.error("[seed-embeddings] Failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
    await closeSqlPool().catch(() => {});
  });
