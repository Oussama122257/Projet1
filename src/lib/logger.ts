import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: process.env.SERVICE_NAME ?? "contentloop" },
  redact: {
    paths: [
      "*.token",
      "*.userToken",
      "*.apiKey",
      "*.password",
      "*.passwordHash",
      "*.authorization",
      "headers.authorization",
      "headers['x-mc-auth']",
    ],
    censor: "[redacted]",
  },
});

export function scoped(scope: string) {
  return logger.child({ scope });
}
