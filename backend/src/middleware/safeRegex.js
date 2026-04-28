const DEFAULT_MAX_LENGTH = 120;

function escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createSafeRegex(value, { flags = "i", maxLength = DEFAULT_MAX_LENGTH } = {}) {
    const normalized = String(value || "").trim();
    if (!normalized || normalized.length > maxLength) {
        return null;
    }

    return new RegExp(escapeRegex(normalized), flags);
}
