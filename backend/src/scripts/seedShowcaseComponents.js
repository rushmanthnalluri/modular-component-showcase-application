import "dotenv/config";
import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import { User, Component } from "../mongodb/schema.js";
import { initializeSqlSchema } from "../sql/initSchema.js";
import { closeSqlPool, hasSqlConnectionConfig, sqlQuery } from "../sql/db.js";
import { connectMongoWithSrvFallback, isMongoSrvUri } from "../utils/mongoSrvFallback.js";
import {
  SHOWCASE_COMPONENT_SEED_USER,
  showcaseComponentsSeedData,
} from "../seeds/showcaseComponentsSeedData.js";

function nowIso() {
  return new Date().toISOString();
}

async function ensureMongoConnection() {
  const uri = String(process.env.MONGODB_URI || "").trim();
  if (!uri) {
    throw new Error("MONGODB_URI is required to run showcase seeding.");
  }

  const connectOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 1,
  };

  const { usedSrvFallback } = await connectMongoWithSrvFallback({
    mongoUri: uri,
    connect: mongoose.connect.bind(mongoose),
    connectOptions,
  });

  if (usedSrvFallback && isMongoSrvUri(uri)) {
    console.warn("[seed-showcase] SRV DNS lookup failed; connected using DNS-over-HTTPS fallback URI.");
  }
}

async function ensureMongoSeedUser() {
  const fullName = SHOWCASE_COMPONENT_SEED_USER.fullName;
  const email = SHOWCASE_COMPONENT_SEED_USER.email;
  const role = SHOWCASE_COMPONENT_SEED_USER.role;

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        fullName,
        role,
        isVerifiedDeveloper: true,
      },
      $setOnInsert: {
        email,
        phone: "",
        passwordHash: "showcase-seed-no-login",
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  return user;
}

async function seedMongoComponents(seedUser) {
  const startedAt = nowIso();

  for (const item of showcaseComponentsSeedData) {
    const setPayload = {
      id: item.id,
      name: item.name,
      description: item.description,
      descriptionMarkdown: item.description,
      category: item.category,
      tags: item.tags,
      code: {
        jsx: item.code.jsx,
        css: item.code.css,
      },
      thumbnail: "",
      screenshot: "",
      version: "1.0.0",
      isPublished: true,
      isFeatured: false,
      useCase: item.useCase,
      accessibilityNotes: item.accessibilityNotes,
      responsiveNotes: item.responsiveNotes,
      difficulty: item.difficulty,
      demoAvailable: Boolean(item.demoAvailable),
      previewMetadata: item.previewMetadata || {},
      importStatements: {
        standard: "",
        typescript: "",
        npm: "",
      },
      updatedAt: startedAt,
    };

    await Component.findOneAndUpdate(
      { id: item.id },
      {
        $set: setPayload,
        $setOnInsert: {
          createdBy: seedUser._id,
          createdAt: startedAt,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }
}

async function ensureSqlSeedUser(seedUser) {
  const { rows } = await sqlQuery(
    `INSERT INTO users (mongo_user_id, name, full_name, email, phone, role, is_verified_developer)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE
     SET mongo_user_id = EXCLUDED.mongo_user_id,
         name = EXCLUDED.name,
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         is_verified_developer = EXCLUDED.is_verified_developer,
         updated_at = NOW()
     RETURNING user_id`,
    [
      String(seedUser._id),
      SHOWCASE_COMPONENT_SEED_USER.fullName,
      SHOWCASE_COMPONENT_SEED_USER.fullName,
      SHOWCASE_COMPONENT_SEED_USER.email,
      "",
      SHOWCASE_COMPONENT_SEED_USER.role,
      true,
    ]
  );

  return rows[0]?.user_id;
}

async function ensureSqlCategoryId(categoryName) {
  const normalized = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  const { rows } = await sqlQuery(
    `INSERT INTO categories (category_name)
     VALUES ($1)
     ON CONFLICT (category_name) DO UPDATE SET category_name = EXCLUDED.category_name
     RETURNING category_id`,
    [normalized]
  );

  return rows[0]?.category_id;
}

async function seedSqlComponents(seedUserId) {
  for (const item of showcaseComponentsSeedData) {
    const categoryId = await ensureSqlCategoryId(item.category);

    const existing = await sqlQuery(
      `SELECT component_id
       FROM components
       WHERE lower(name) = lower($1)
       LIMIT 1`,
      [item.name]
    );

    if (existing.rows[0]?.component_id) {
      await sqlQuery(
        `UPDATE components
         SET description = $2,
             category_id = $3,
             user_id = $4,
             updated_at = NOW()
         WHERE component_id = $1`,
        [existing.rows[0].component_id, item.description, categoryId, seedUserId]
      );
    } else {
      await sqlQuery(
        `INSERT INTO components (name, description, category_id, user_id)
         VALUES ($1, $2, $3, $4)`,
        [item.name, item.description, categoryId, seedUserId]
      );
    }
  }
}

export async function seedShowcaseComponents() {
  const startedAt = Date.now();
  let sqlSeeded = false;

  try {
    await ensureMongoConnection();
    const seedUser = await ensureMongoSeedUser();
    await seedMongoComponents(seedUser);

    if (hasSqlConnectionConfig()) {
      await initializeSqlSchema();
      const sqlUserId = await ensureSqlSeedUser(seedUser);
      if (sqlUserId) {
        await seedSqlComponents(sqlUserId);
        sqlSeeded = true;
      }
    }

    const durationMs = Date.now() - startedAt;
    console.log(
      `[seed-showcase] Seeded ${showcaseComponentsSeedData.length} components to Mongo${sqlSeeded ? " and PostgreSQL" : ""} in ${durationMs}ms.`
    );
  } finally {
    await mongoose.connection.close().catch(() => {});
    await closeSqlPool().catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedShowcaseComponents().catch((error) => {
    console.error("[seed-showcase] Failed:", error.message);
    process.exitCode = 1;
  });
}
