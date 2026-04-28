export function createValidatedBodyMiddleware(validator, { status = 400, code = "VALIDATION_ERROR" } = {}) {
    return (req, res, next) => {
        const validation = validator(req.body || {});
        if (!validation.ok) {
            return res.status(status).json({
                code,
                message: validation.message,
                ...(validation.details ? { details: validation.details } : {}),
            });
        }

        req.validatedBody = validation.data;
        return next();
    };
}
