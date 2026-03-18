import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { Component } from "../src/model/appModels.js";

const scriptArgs = new Set(process.argv.slice(2));
const isDryRun = scriptArgs.has("--dry-run");
const showHelp = scriptArgs.has("--help") || scriptArgs.has("-h");

if (showHelp) {
  console.log("Usage: npm --prefix backend run cleanup:verifier -- [--dry-run]");
  console.log("Options:");
  console.log("  --dry-run   Count matching verifier components without deleting.");
  process.exit(0);
}

loadEnv({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});

const VERIFIER_NAME_PREFIX = process.env.VERIFIER_NAME_PREFIX || "Verifier Component";
const VERIFIER_DESCRIPTION_MARKER =
  process.env.VERIFIER_DESCRIPTION_MARKER || "Created by verify-connection script";

const mongoUri = String(process.env.MONGODB_URI || "").trim();

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shouldRetryWithWindowsSrvFallback(error) {
  const message = String(error?.message || "");
  return (
    message.includes("querySrv") ||
    message.includes("_mongodb._tcp") ||
    message.includes("ENOTFOUND")
  );
}

function runPowerShell(command) {
  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", command],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim();
    throw new Error(stderr || "PowerShell command failed.");
  }

  return String(result.stdout || "").trim();
}

function resolveSrvHostsWithPowerShell(hostname) {
  const command = [
    `$records = Resolve-DnsName -Name '${hostname}' -Type SRV`,
    "$records | Where-Object { $_.NameTarget } | ForEach-Object { $_.NameTarget.TrimEnd('.') }",
  ].join("; ");
  const output = runPowerShell(command);
  const hosts = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (hosts.length === 0) {
    throw new Error(`No SRV hosts resolved for ${hostname}.`);
  }

  return hosts;
}

function resolveTxtParamsWithPowerShell(hostname) {
  const command = [
    `$records = Resolve-DnsName -Name '${hostname}' -Type TXT`,
    "$first = $records | Select-Object -First 1",
    "if ($first) { ($first.Strings -join '') }",
  ].join("; ");

  return runPowerShell(command);
}

function buildMongoSeedUriFromSrvUri(srvUri) {
  const parsed = new URL(srvUri);
  const hostname = parsed.hostname;
  const databasePath = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/admin";
  const username = parsed.username ? encodeURIComponent(decodeURIComponent(parsed.username)) : "";
  const password = parsed.password ? encodeURIComponent(decodeURIComponent(parsed.password)) : "";
  const credentials = username ? `${username}:${password}@` : "";
  const hosts = resolveSrvHostsWithPowerShell(hostname);
  const txtParams = new URLSearchParams(resolveTxtParamsWithPowerShell(hostname));
  const mergedParams = new URLSearchParams(txtParams.toString());
  const baseParams = new URLSearchParams(parsed.searchParams.toString());

  for (const [key, value] of baseParams.entries()) {
    mergedParams.set(key, value);
  }

  if (!mergedParams.has("authSource")) {
    mergedParams.set("authSource", "admin");
  }

  if (!mergedParams.has("tls") && !mergedParams.has("ssl")) {
    mergedParams.set("tls", "true");
  }

  const query = mergedParams.toString();
  const hostList = hosts.join(",");
  return {
    uri: `mongodb://${credentials}${hostList}${databasePath}${query ? `?${query}` : ""}`,
    hostCount: hosts.length,
  };
}

async function connectMongoWithFallback() {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 5,
    });
    return;
  } catch (primaryError) {
    const canRetry =
      process.platform === "win32" &&
      mongoUri.startsWith("mongodb+srv://") &&
      shouldRetryWithWindowsSrvFallback(primaryError);

    if (!canRetry) {
      throw primaryError;
    }

    const fallback = buildMongoSeedUriFromSrvUri(mongoUri);
    console.warn(
      `SRV lookup failed in Node resolver. Retrying MongoDB connect with ${fallback.hostCount} resolved seed hosts...`
    );

    await mongoose.connect(fallback.uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 5,
    });
  }
}

async function run() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required. Set it in backend/.env or environment variables.");
  }

  const nameRegex = new RegExp(`^${escapeRegExp(VERIFIER_NAME_PREFIX)}`);
  const descriptionRegex = new RegExp(escapeRegExp(VERIFIER_DESCRIPTION_MARKER), "i");

  const query = {
    $or: [{ name: { $regex: nameRegex } }, { description: { $regex: descriptionRegex } }],
  };

  await connectMongoWithFallback();

  const matchCount = await Component.countDocuments(query);
  console.log(`Verifier component matches: ${matchCount}`);

  if (matchCount === 0 || isDryRun) {
    if (isDryRun) {
      console.log("Dry run enabled. No records deleted.");
    }
    return;
  }

  const result = await Component.deleteMany(query);
  console.log(`Deleted verifier components: ${result.deletedCount || 0}`);
}

run()
  .then(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  })
  .catch(async (error) => {
    console.error(`cleanup:verifier failed: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  });
