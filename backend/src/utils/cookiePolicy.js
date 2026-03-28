function readHeader(req, name) {
    if (typeof req?.get === "function") {
        const value = req.get(name);
        if (value) {
            return String(value);
        }
    }

    const headerValue = req?.headers?.[String(name || "").toLowerCase()];
    return headerValue ? String(headerValue) : "";
}

function firstForwardedValue(value) {
    return String(value || "")
        .split(",")[0]
        .trim();
}

function getRequestHost(req) {
    return (
        firstForwardedValue(readHeader(req, "x-forwarded-host")) ||
        firstForwardedValue(readHeader(req, "host"))
    );
}

function getRequestProtocol(req) {
    return (
        firstForwardedValue(readHeader(req, "x-forwarded-proto")) ||
        String(req?.protocol || "").trim() ||
        (req?.secure ? "https" : "")
    );
}

export function shouldUseCrossSiteCookies(req, isProduction) {
    if (isProduction) {
        return true;
    }

    const origin = readHeader(req, "origin").trim();
    if (!origin) {
        return false;
    }

    try {
        const originUrl = new URL(origin);
        const requestHost = getRequestHost(req);
        const requestProtocol = getRequestProtocol(req);
        const isCrossHostRequest = Boolean(requestHost) && originUrl.host !== requestHost;
        const isHttpsRequest = originUrl.protocol === "https:" || requestProtocol === "https";

        return isCrossHostRequest && isHttpsRequest;
    } catch {
        return false;
    }
}

export function createCookieOptions(req, { isProduction, httpOnly, maxAge }) {
    const useCrossSiteCookies = shouldUseCrossSiteCookies(req, isProduction);

    return {
        httpOnly,
        secure: useCrossSiteCookies,
        sameSite: useCrossSiteCookies ? "none" : "lax",
        path: "/",
        ...(typeof maxAge === "number" ? { maxAge } : {}),
    };
}
