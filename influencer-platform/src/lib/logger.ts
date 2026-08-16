type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN = LEVELS[(process.env.LOG_LEVEL as Level) ?? "info"] ?? 20;

/** Keys whose values must never reach the logs. */
const REDACT = /token|secret|password|authorization|apikey|api_key|client_secret/i;

function scrub(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(scrub);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) =>
      REDACT.test(k) ? [k, "[redacted]"] : [k, scrub(v)]
    )
  );
}

function emit(level: Level, scope: string, msg: string, meta?: unknown) {
  if (LEVELS[level] < MIN) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    scope,
    msg,
    ...(meta ? { meta: scrub(meta) } : {}),
  };
  const out = level === "error" || level === "warn" ? console.error : console.log;
  out(JSON.stringify(line));
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, meta?: unknown) => emit("debug", scope, msg, meta),
    info: (msg: string, meta?: unknown) => emit("info", scope, msg, meta),
    warn: (msg: string, meta?: unknown) => emit("warn", scope, msg, meta),
    error: (msg: string, meta?: unknown) => emit("error", scope, msg, meta),
  };
}

export const logger = createLogger("app");
