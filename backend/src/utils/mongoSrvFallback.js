const GOOGLE_DNS_RESOLVE_URL = "https://dns.google/resolve";

function ensureFetch(fetchImpl) {
    if (typeof fetchImpl !== "function") {
        throw new Error("A fetch implementation is required for MongoDB SRV fallback.");
    }

    return fetchImpl;
}

function parseSrvRecordData(record) {
    const value = String(record?.data ?? record ?? "").trim();
    const parts = value.split(/\s+/);

    if (parts.length < 4) {
        throw new Error(`Invalid MongoDB SRV record: ${value || "<empty>"}`);
    }

    return {
        port: parts[2],
        host: parts.slice(3).join(" ").replace(/\.$/, ""),
    };
}

export function isMongoSrvUri(uri) {
    return String(uri || "").startsWith("mongodb+srv://");
}

export function isSrvResolutionFailure(error) {
    const message = String(error?.message || "");
    return /querysrv|resolvesrv/i.test(message);
}

export function parseTxtRecordData(record) {
    const value = String(record?.data ?? record ?? "").trim();

    if (!value) {
        return "";
    }

    const quotedSegments = [...value.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
    if (quotedSegments.length > 0) {
        return quotedSegments.join("");
    }

    return value.replace(/^"|"$/g, "");
}

async function fetchDnsAnswers(name, type, { fetchImpl = globalThis.fetch } = {}) {
    const response = await ensureFetch(fetchImpl)(
        `${GOOGLE_DNS_RESOLVE_URL}?name=${encodeURIComponent(name)}&type=${type}`,
        {
            headers: {
                accept: "application/dns-json, application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`DNS lookup failed for ${name} (${type}): HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (payload?.Status && payload.Status !== 0) {
        throw new Error(`DNS lookup failed for ${name} (${type}): status ${payload.Status}`);
    }

    return Array.isArray(payload?.Answer) ? payload.Answer : [];
}

export function buildDirectMongoUri(mongoUri, srvAnswers, txtAnswers = []) {
    const parsedUri = new URL(mongoUri);

    if (parsedUri.protocol !== "mongodb+srv:") {
        throw new Error("MongoDB SRV fallback only supports mongodb+srv:// URIs.");
    }

    const username = parsedUri.username ? decodeURIComponent(parsedUri.username) : "";
    const password = parsedUri.password ? decodeURIComponent(parsedUri.password) : "";
    const authPrefix = username
        ? `${encodeURIComponent(username)}${password ? `:${encodeURIComponent(password)}` : ""}@`
        : "";

    const hosts = srvAnswers.map((answer) => {
        const { host, port } = parseSrvRecordData(answer);
        return `${host}:${port}`;
    });

    if (hosts.length === 0) {
        throw new Error("MongoDB SRV fallback could not resolve any hosts.");
    }

    const searchParams = new URLSearchParams(parsedUri.search);

    for (const answer of txtAnswers) {
        const recordData = parseTxtRecordData(answer);
        if (!recordData) {
            continue;
        }

        for (const [key, value] of new URLSearchParams(recordData).entries()) {
            if (!searchParams.has(key)) {
                searchParams.set(key, value);
            }
        }
    }

    if (!searchParams.has("tls") && !searchParams.has("ssl")) {
        searchParams.set("tls", "true");
    }

    const pathname = parsedUri.pathname === "/" ? "" : parsedUri.pathname;
    const queryString = searchParams.toString();

    return `mongodb://${authPrefix}${hosts.join(",")}${pathname}${queryString ? `?${queryString}` : ""}`;
}

export async function expandMongoSrvUri(mongoUri, { fetchImpl = globalThis.fetch } = {}) {
    const parsedUri = new URL(mongoUri);

    if (parsedUri.protocol !== "mongodb+srv:") {
        return mongoUri;
    }

    const srvName = `_mongodb._tcp.${parsedUri.host}`;
    const [srvAnswers, txtAnswers] = await Promise.all([
        fetchDnsAnswers(srvName, "SRV", { fetchImpl }),
        fetchDnsAnswers(parsedUri.host, "TXT", { fetchImpl }),
    ]);

    return buildDirectMongoUri(mongoUri, srvAnswers, txtAnswers);
}

export async function connectMongoWithSrvFallback({
    mongoUri,
    connect,
    connectOptions,
    fetchImpl = globalThis.fetch,
}) {
    try {
        await connect(mongoUri, connectOptions);
        return {
            connectionUri: mongoUri,
            usedSrvFallback: false,
        };
    } catch (error) {
        if (!isMongoSrvUri(mongoUri) || !isSrvResolutionFailure(error)) {
            throw error;
        }

        const directUri = await expandMongoSrvUri(mongoUri, { fetchImpl });
        await connect(directUri, connectOptions);

        return {
            connectionUri: directUri,
            usedSrvFallback: true,
        };
    }
}
