export function resolveRequestOrigin(req) {
    const configuredBaseUrl = String(process.env.PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "");
    if (configuredBaseUrl) {
        try {
            return new URL(configuredBaseUrl).origin;
        } catch {
            return configuredBaseUrl;
        }
    }

    const host = String(req?.get?.("x-forwarded-host") || req?.get?.("host") || "").trim();
    if (!host) {
        return "";
    }

    const protocol = String(req?.get?.("x-forwarded-proto") || req?.protocol || "http").split(",")[0].trim() || "http";
    try {
        return new URL(`${protocol}://${host}`).origin;
    } catch {
        return `${protocol}://${host}`.replace(/\/+$/, "");
    }
}

export function resolvePublicUrl(pathname, baseUrl) {
    const normalizedPath = `/${String(pathname || "").replace(/^\/+/, "")}`;
    try {
        return new URL(normalizedPath, `${String(baseUrl || "").replace(/\/+$/, "")}/`).toString().replace(/\/+$/, "");
    } catch {
        return `${String(baseUrl || "").replace(/\/+$/, "")}${normalizedPath}`;
    }
}
