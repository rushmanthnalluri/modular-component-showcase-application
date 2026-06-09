/**
 * Standardized API response helpers for the backend.
 * Contract: { success: boolean, data?: any, error?: { code, message, details? } }
 *
 * The helpers also tolerate legacy call sites that pass only a payload into
 * successPayload/errorPayload and then call res.json(...) themselves.
 */

function isExpressResponse(value) {
    return value && typeof value.status === "function" && typeof value.json === "function";
}

function spreadable(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function plain(value) {
    if (value && typeof value.toObject === "function") {
        return value.toObject();
    }
    return value;
}

export function buildSuccess(data = {}) {
    data = plain(data);
    if (data && typeof data === "object" && data.success === true && "data" in data) {
        return data;
    }

    return {
        success: true,
        data,
    };
}

export function buildError(code = "INTERNAL_ERROR", message = "Server error.", details = undefined) {
    if (code && typeof code === "object" && code.success === false && code.error) {
        return code;
    }

    if (message === undefined || message === null || message === "Server error.") {
        const text = String(code || "Server error.");
        const lower = text.toLowerCase();
        code =
            lower.includes("not found") ? "NOT_FOUND" :
                lower.includes("unauthorized") || lower.includes("authentication") ? "UNAUTHORIZED" :
                    lower.includes("required") || lower.includes("invalid") || lower.includes("must ") ? "VALIDATION_ERROR" :
                        "INTERNAL_ERROR";
        message = text;
    }

    const normalizedCode = String(code || "INTERNAL_ERROR");
    const normalizedMessage = String(message || "Server error.");
    return {
        success: false,
        error: {
            code: normalizedCode,
            message: normalizedMessage,
            ...(details !== undefined && details !== null ? { details } : {}),
        },
    };
}

export const sendSuccess = (res, data = {}, status = 200) => {
    if (!isExpressResponse(res)) {
        return buildSuccess(res);
    }

    return res.status(status).json(buildSuccess(data));
};

export const sendError = (res, code = "INTERNAL_ERROR", message = "Server error.", status = 500, details = undefined) => {
    if (!isExpressResponse(res)) {
        return buildError(res || "Server error.");
    }

    return res.status(status).json(buildError(code, message, details));
};
