import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../mongodb/schema.js";
import { connectMongoWithSrvFallback, isMongoSrvUri } from "../utils/mongoSrvFallback.js";
import { closeSqlPool, hasSqlConnectionConfig, sqlQuery } from "../sql/db.js";

async function ensureMongoConnection() {
    const uri = String(process.env.MONGODB_URI || "").trim();
    if (!uri) {
        throw new Error("MONGODB_URI is required to remove avatar images from MongoDB users.");
    }

    const connectOptions = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 1,
    };

    const { usedSrvFallback } = await connectMongoWithSrvFallback({
        mongoUri: uri,
        connect: mongoose.connect.bind(mongoose),
        connectOptions,
    });

    if (usedSrvFallback && isMongoSrvUri(uri)) {
        console.warn("[remove-avatar-url] SRV DNS lookup failed; connected using DNS-over-HTTPS fallback URI.");
    }
}

async function removeMongoAvatarUrls() {
    const result = await User.updateMany({}, { $unset: { avatarUrl: "" } });
    return {
        matchedCount: result.matchedCount ?? 0,
        modifiedCount: result.modifiedCount ?? 0,
    };
}

async function removeSqlAvatarUrlColumn() {
    if (!hasSqlConnectionConfig()) {
        return { skipped: true };
    }

    await sqlQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_image TEXT NOT NULL DEFAULT ''");
    await sqlQuery("UPDATE users SET avatar_image = COALESCE(avatar_image, '')");
    return { skipped: false };
}

async function main() {
    try {
        let mongoResult = { skipped: true };
        let sqlResult = { skipped: true };

        try {
            await ensureMongoConnection();
            mongoResult = await removeMongoAvatarUrls();
        } catch (error) {
            mongoResult = { skipped: true, error: error.message };
            console.warn(`[remove-avatar-url] Mongo cleanup skipped: ${error.message}`);
        }

        try {
            sqlResult = await removeSqlAvatarUrlColumn();
        } catch (error) {
            sqlResult = { skipped: true, error: error.message };
            console.warn(`[remove-avatar-url] SQL cleanup skipped: ${error.message}`);
        }

        console.log(
            JSON.stringify(
                {
                    mongoResult,
                    sqlResult,
                },
                null,
                2
            )
        );
    } catch (error) {
        console.error(`[remove-avatar-url] ${error.message}`);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close().catch(() => {});
        await closeSqlPool().catch(() => {});
    }
}

await main();