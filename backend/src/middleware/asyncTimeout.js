export async function withTimeout(promiseFactory, timeoutMs, message = "Operation timed out.") {
    const duration = Math.max(1, Number(timeoutMs) || 0);
    if (duration <= 0) {
        return promiseFactory();
    }

    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), duration);
        timeoutId.unref?.();
    });

    try {
        return await Promise.race([promiseFactory(), timeoutPromise]);
    } finally {
        clearTimeout(timeoutId);
    }
}
