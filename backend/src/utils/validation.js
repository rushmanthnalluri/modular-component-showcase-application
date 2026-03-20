const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REGEX = /^\d{10,15}$/;
const IMAGE_DATA_URL_REGEX = /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/;

const ALLOWED_COMPONENT_CATEGORIES = new Set([
    "buttons",
    "cards",
    "forms",
    "navigation",
    "feedback",
    "data",
]);

const ALLOWED_SUPPORT_CATEGORIES = new Set([
    "bug report",
    "feature request",
    "account access",
    "billing",
    "general support",
]);

const LIMITS = {
    fullName: 120,
    email: 254,
    password: 128,
    name: 120,
    description: 1200,
    jsxCode: 30000,
    cssCode: 30000,
    ticketTitle: 120,
    ticketCategory: 60,
    ticketDescription: 2000,
    imageDataUrl: 2_500_000,
};

function text(value) {
    return String(value ?? "").trim();
}

function hasMaxLength(value, maxLength) {
    return value.length <= maxLength;
}

function isValidImageDataUrl(value) {
    if (!value) {
        return true;
    }

    if (!hasMaxLength(value, LIMITS.imageDataUrl)) {
        return false;
    }

    return IMAGE_DATA_URL_REGEX.test(value);
}

export function normalizePhone(phone) {
    return text(phone).replace(/\D/g, "");
}

function isValidPhone(phone) {
    return PHONE_DIGITS_REGEX.test(String(phone || ""));
}

function isValidEmail(value) {
    return EMAIL_REGEX.test(String(value || ""));
}

function createSlug(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export function createComponentId(name) {
    const base = createSlug(name) || "custom-component";
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
}

export function validateRegistrationPayload(payload = {}) {
    const fullName = text(payload.fullName);
    const email = text(payload.email).toLowerCase();
    const phone = normalizePhone(payload.phone);
    const password = String(payload.password || "");
    const role = payload.role === "developer" ? "developer" : "user";

    if (!fullName || !email || !password) {
        return { ok: false, message: "Full name, email and password are required." };
    }

    if (!hasMaxLength(fullName, LIMITS.fullName)) {
        return { ok: false, message: "Full name is too long." };
    }

    if (!hasMaxLength(email, LIMITS.email) || !isValidEmail(email)) {
        return { ok: false, message: "A valid email address is required." };
    }

    if (!isValidPhone(phone)) {
        return { ok: false, message: "Phone number must be 10 to 15 digits." };
    }

    if (password.length < 6 || password.length > LIMITS.password) {
        return { ok: false, message: "Password must be between 6 and 128 characters." };
    }

    return {
        ok: true,
        data: {
            fullName,
            email,
            phone,
            password,
            role,
        },
    };
}

export function validateLoginPayload(payload = {}) {
    const email = text(payload.email).toLowerCase();
    const password = String(payload.password || "");

    if (!email || !password) {
        return { ok: false, message: "Email and password are required." };
    }

    if (!hasMaxLength(email, LIMITS.email) || !isValidEmail(email)) {
        return { ok: false, message: "A valid email address is required." };
    }

    if (!hasMaxLength(password, LIMITS.password)) {
        return { ok: false, message: "Password is too long." };
    }

    return {
        ok: true,
        data: {
            email,
            password,
        },
    };
}

export function validateForgotPasswordPayload(payload = {}) {
    const email = text(payload.email).toLowerCase();
    const phone = normalizePhone(payload.phone);
    const newPassword = String(payload.newPassword || "");

    if (!email || !phone || !newPassword) {
        return { ok: false, message: "Email, phone and new password are required." };
    }

    if (!hasMaxLength(email, LIMITS.email) || !isValidEmail(email)) {
        return { ok: false, message: "A valid email address is required." };
    }

    if (!isValidPhone(phone)) {
        return { ok: false, message: "Phone number must be 10 to 15 digits." };
    }

    if (newPassword.length < 6 || newPassword.length > LIMITS.password) {
        return { ok: false, message: "Password must be between 6 and 128 characters." };
    }

    return {
        ok: true,
        data: {
            email,
            phone,
            newPassword,
        },
    };
}

export function validateSupportTicketPayload(payload = {}) {
    const honeypot = text(payload.website);
    if (honeypot) {
        return { ok: false, message: "Unable to create support ticket." };
    }

    const name = text(payload.name);
    const title = text(payload.title);
    const category = text(payload.category);
    const description = text(payload.description);
    const normalizedCategory = category.toLowerCase();

    if (!name || !title || !category || !description) {
        return {
            ok: false,
            message: "title, category, description and name are required",
        };
    }

    if (!hasMaxLength(name, LIMITS.fullName)) {
        return { ok: false, message: "Name is too long." };
    }

    if (!hasMaxLength(title, LIMITS.ticketTitle)) {
        return { ok: false, message: "Ticket title is too long." };
    }

    if (!hasMaxLength(category, LIMITS.ticketCategory)) {
        return { ok: false, message: "Ticket category is too long." };
    }

    if (!ALLOWED_SUPPORT_CATEGORIES.has(normalizedCategory)) {
        return { ok: false, message: "Unsupported support ticket category." };
    }

    if (!hasMaxLength(description, LIMITS.ticketDescription)) {
        return { ok: false, message: "Ticket description is too long." };
    }

    return {
        ok: true,
        data: {
            name,
            title,
            category,
            description,
        },
    };
}

export function validateComponentPayload(payload = {}) {
    const name = text(payload.name);
    const description = text(payload.description);
    const category = text(payload.category).toLowerCase();
    const jsxCode = text(payload.jsxCode);
    const cssCode = text(payload.cssCode);
    const thumbnail = text(payload.thumbnail);
    const screenshot = text(payload.screenshot);

    if (!name || !description || !category || !jsxCode) {
        return {
            ok: false,
            message: "Name, description, category and JSX code are required.",
        };
    }

    if (!ALLOWED_COMPONENT_CATEGORIES.has(category)) {
        return {
            ok: false,
            message: "Unsupported category. Allowed: buttons, cards, forms, navigation, feedback, data.",
        };
    }

    if (!hasMaxLength(name, LIMITS.name)) {
        return { ok: false, message: "Component name is too long." };
    }

    if (!hasMaxLength(description, LIMITS.description)) {
        return { ok: false, message: "Component description is too long." };
    }

    if (!hasMaxLength(jsxCode, LIMITS.jsxCode)) {
        return { ok: false, message: "JSX code is too long." };
    }

    if (cssCode && !hasMaxLength(cssCode, LIMITS.cssCode)) {
        return { ok: false, message: "CSS code is too long." };
    }

    if (!isValidImageDataUrl(thumbnail)) {
        return { ok: false, message: "Thumbnail must be a valid base64 image payload." };
    }

    if (!isValidImageDataUrl(screenshot)) {
        return { ok: false, message: "Screenshot must be a valid base64 image payload." };
    }

    return {
        ok: true,
        data: {
            name,
            description,
            category,
            jsxCode,
            cssCode,
            thumbnail,
            screenshot,
        },
    };
}
