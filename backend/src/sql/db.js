import { Pool } from "pg";

let pool;

function resolveConnectionString() {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    const host = process.env.PGHOST;
    const user = process.env.PGUSER;
    const password = process.env.PGPASSWORD;
    const database = process.env.PGDATABASE;
    const port = process.env.PGPORT || "5432";

    if (!host || !user || !password || !database) {
        return "";
    }

    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

function shouldUseSsl(connectionString) {
    const explicitPgSsl = String(process.env.PGSSL || "").trim().toLowerCase();
    if (explicitPgSsl === "true") {
        return true;
    }

    if (explicitPgSsl === "false") {
        return false;
    }

    try {
        const url = new URL(connectionString);
        const sslMode = String(url.searchParams.get("sslmode") || "").trim().toLowerCase();
        const sslEnabled = String(url.searchParams.get("ssl") || "").trim().toLowerCase();
        return ["require", "verify-ca", "verify-full"].includes(sslMode) || sslEnabled === "true";
    } catch {
        return false;
    }
}

export function hasSqlConnectionConfig() {
    return Boolean(resolveConnectionString());
}

export function getSqlPool() {
    if (pool) {
        return pool;
    }

    const connectionString = resolveConnectionString();
    if (!connectionString) {
        return null;
    }

    pool = new Pool({
        connectionString,
        max: Number.parseInt(process.env.PG_POOL_MAX || "10", 10),
        idleTimeoutMillis: Number.parseInt(process.env.PG_IDLE_TIMEOUT_MS || "30000", 10),
        connectionTimeoutMillis: Number.parseInt(process.env.PG_CONNECT_TIMEOUT_MS || "5000", 10),
        ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
    });

    pool.on("error", (error) => {
        console.error("PostgreSQL pool error:", error.message);
    });

    return pool;
}

export async function pingSql() {
    const currentPool = getSqlPool();
    if (!currentPool) {
        return false;
    }

    try {
        await currentPool.query("SELECT 1");
        return true;
    } catch {
        return false;
    }
}

export async function closeSqlPool() {
    if (!pool) {
        return;
    }

    await pool.end();
    pool = null;
}

export async function query(text, values = []) {
    const currentPool = getSqlPool();
    if (!currentPool) {
        const unavailableError = new Error("PostgreSQL is not configured.");
        unavailableError.code = "SQL_NOT_CONFIGURED";
        throw unavailableError;
    }

    return currentPool.query(text, values);
}

export const sqlQuery = query;
