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
    descriptionMarkdown: 5000,
    jsxCode: 30000,
    cssCode: 30000,
    ticketTitle: 120,
    ticketCategory: 60,
    ticketDescription: 2000,
    tag: 24,
    tagsTotal: 200,
    imageDataUrl: 2_500_000,
    listEntry: 240,
    propType: 80,
    propDefault: 160,
    propDescription: 320,
    usageExampleTitle: 120,
    usageExampleDescription: 500,
    usageExampleCode: 5000,
    importStatement: 500,
    propsCount: 20,
    practicesCount: 8,
    pitfallsCount: 8,
    usageExamplesCount: 5,
    dependencyCount: 12,
    relatedCount: 12,
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

function normalizeStringList(input, maxItems) {
    if (!Array.isArray(input)) {
        return [];
    }

    return input
        .map((entry) => text(entry))
        .filter(Boolean)
        .slice(0, maxItems);
}

function normalizePropsList(input) {
    if (!Array.isArray(input)) {
        return [];
    }

    return input
        .map((entry) => ({
            name: text(entry?.name),
            type: text(entry?.type),
            default: text(entry?.default),
            description: text(entry?.description),
            required: entry?.required === true,
        }))
        .filter((entry) => entry.name)
        .slice(0, LIMITS.propsCount);
}

function normalizeUsageExamples(input) {
    if (!Array.isArray(input)) {
        return [];
    }

    return input
        .map((entry) => ({
            title: text(entry?.title),
            description: text(entry?.description),
            code: text(entry?.code),
        }))
        .filter((entry) => entry.title || entry.description || entry.code)
        .slice(0, LIMITS.usageExamplesCount);
}

function normalizeImportStatements(input) {
    if (!input || typeof input !== "object") {
        return {};
    }

    const standard = text(input.standard);
    const typescript = text(input.typescript);
    const npm = text(input.npm);

    return {
        ...(standard ? { standard } : {}),
        ...(typescript ? { typescript } : {}),
        ...(npm ? { npm } : {}),
    };
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

function isValidUrl(value) {
    if (!value) {
        return true;
    }

    try {
        const parsed = new URL(String(value));
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function isValidAvatarReference(value) {
    if (!value) {
        return true;
    }

    return isValidImageDataUrl(value);
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
    const bio = text(payload.bio).slice(0, 500);
    const avatarUrl = text(payload.avatarUrl);
    const socialLinksInput = payload.socialLinks && typeof payload.socialLinks === "object" ? payload.socialLinks : {};
    const socialLinks = {
        github: text(socialLinksInput.github),
        twitter: text(socialLinksInput.twitter),
        portfolio: text(socialLinksInput.portfolio),
    };
    const emailPreferencesInput =
        payload.emailPreferences && typeof payload.emailPreferences === "object" ? payload.emailPreferences : {};
    const emailPreferences = {
        newComponents:
            emailPreferencesInput.newComponents === undefined
                ? true
                : Boolean(emailPreferencesInput.newComponents),
        reviewComments:
            emailPreferencesInput.reviewComments === undefined
                ? true
                : Boolean(emailPreferencesInput.reviewComments),
        newsletters: Boolean(emailPreferencesInput.newsletters),
    };

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

    if (!isValidAvatarReference(avatarUrl)) {
        return { ok: false, message: "Avatar must be an uploaded image." };
    }

    if (!isValidUrl(socialLinks.github) || !isValidUrl(socialLinks.twitter) || !isValidUrl(socialLinks.portfolio)) {
        return { ok: false, message: "Social links must be valid http/https URLs." };
    }

    return {
        ok: true,
        data: {
            fullName,
            email,
            phone,
            password,
            role,
            bio,
            avatarUrl,
            socialLinks,
            emailPreferences,
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
    const descriptionMarkdown = text(payload.descriptionMarkdown);
    const category = text(payload.category).toLowerCase();
    const tagsRaw = payload.tags;
    const jsxCode = text(payload.jsxCode);
    const cssCode = text(payload.cssCode);
    const thumbnail = text(payload.thumbnail);
    const screenshot = text(payload.screenshot);
    const props = normalizePropsList(payload.props);
    const usageExamples = normalizeUsageExamples(payload.usageExamples);
    const bestPractices = normalizeStringList(payload.bestPractices, LIMITS.practicesCount);
    const commonPitfalls = normalizeStringList(payload.commonPitfalls, LIMITS.pitfallsCount);
    const dependencies = normalizeStringList(payload.dependencies, LIMITS.dependencyCount);
    const relatedComponents = normalizeStringList(payload.relatedComponents, LIMITS.relatedCount);
    const importStatements = normalizeImportStatements(payload.importStatements);

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

    if (descriptionMarkdown && !hasMaxLength(descriptionMarkdown, LIMITS.descriptionMarkdown)) {
        return { ok: false, message: "Extended component notes are too long." };
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

    let tags = [];
    if (Array.isArray(tagsRaw)) {
        tags = tagsRaw.map((t) => text(t)).filter(Boolean);
    } else if (typeof tagsRaw === "string") {
        tags = tagsRaw
            .split(",")
            .map((t) => text(t))
            .filter(Boolean);
    }

    tags = Array.from(new Set(tags.map((t) => t.toLowerCase()))).slice(0, 12);
    if (tags.some((t) => t.length > LIMITS.tag)) {
        return { ok: false, message: "Each tag must be 24 characters or fewer." };
    }
    const tagsJoined = tags.join(",");
    if (tagsJoined.length > LIMITS.tagsTotal) {
        return { ok: false, message: "Tags are too long." };
    }

    if (
        props.some(
            (entry) =>
                !hasMaxLength(entry.name, LIMITS.name) ||
                !hasMaxLength(entry.type, LIMITS.propType) ||
                !hasMaxLength(entry.default, LIMITS.propDefault) ||
                !hasMaxLength(entry.description, LIMITS.propDescription)
        )
    ) {
        return { ok: false, message: "Props reference entries are too long." };
    }

    if (bestPractices.some((entry) => !hasMaxLength(entry, LIMITS.listEntry))) {
        return { ok: false, message: "Best practices entries are too long." };
    }

    if (commonPitfalls.some((entry) => !hasMaxLength(entry, LIMITS.listEntry))) {
        return { ok: false, message: "Common pitfalls entries are too long." };
    }

    if (dependencies.some((entry) => !hasMaxLength(entry, LIMITS.listEntry))) {
        return { ok: false, message: "Dependency entries are too long." };
    }

    if (relatedComponents.some((entry) => !hasMaxLength(entry, LIMITS.listEntry))) {
        return { ok: false, message: "Related component entries are too long." };
    }

    if (
        usageExamples.some(
            (entry) =>
                !hasMaxLength(entry.title, LIMITS.usageExampleTitle) ||
                !hasMaxLength(entry.description, LIMITS.usageExampleDescription) ||
                !hasMaxLength(entry.code, LIMITS.usageExampleCode)
        )
    ) {
        return { ok: false, message: "Usage example entries are too long." };
    }

    if (
        Object.values(importStatements).some(
            (entry) => !hasMaxLength(String(entry || ""), LIMITS.importStatement)
        )
    ) {
        return { ok: false, message: "Import guidance is too long." };
    }

    return {
        ok: true,
        data: {
            name,
            description,
            descriptionMarkdown,
            category,
            tags,
            jsxCode,
            cssCode,
            thumbnail,
            screenshot,
            props,
            usageExamples,
            bestPractices,
            commonPitfalls,
            dependencies,
            relatedComponents,
            importStatements,
        },
    };
}
