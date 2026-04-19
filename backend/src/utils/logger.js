import winston from "winston";

const level = String(process.env.LOG_LEVEL || "info").toLowerCase();

const logger = winston.createLogger({
    level,
    defaultMeta: {
        service: "backend",
        env: process.env.NODE_ENV || "development",
    },
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()],
});

export function withRequestContext(req) {
    return {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl || req.url,
    };
}

export default logger;
