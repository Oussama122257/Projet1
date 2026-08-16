import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { AuthError } from "./session";
import { createLogger } from "./logger";

const log = createLogger("api");

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json(
    { error: { message, ...(extra ? { details: extra } : {}) } },
    { status }
  );
}

/**
 * Wraps a route handler so every thrown error becomes a shaped JSON response.
 *
 * Unexpected errors are logged in full but reported generically — internal
 * messages (SQL text, Stripe internals) must never reach a client.
 */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof AuthError) {
        return fail(err.message, err.status);
      }
      if (err instanceof ZodError) {
        return fail("Validation failed", 422, err.flatten().fieldErrors);
      }
      const message = err instanceof Error ? err.message : String(err);
      log.error("unhandled route error", { message });
      return fail("Something went wrong on our end", 500);
    }
  };
}

export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ZodError([
      {
        code: "custom",
        path: ["body"],
        message: "Request body must be valid JSON",
      },
    ]);
  }
  return schema.parse(json);
}

export function parseQuery<T>(req: Request, schema: ZodSchema<T>): T {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(params);
}
