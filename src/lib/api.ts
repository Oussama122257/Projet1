import { NextResponse } from "next/server";
import type { z } from "zod";
import { getSession, type SessionPayload } from "@/lib/auth/session";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Resolve the authenticated session or throw a 401 ApiError. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "unauthenticated", "Sign in required");
  return session;
}

/** Parse and validate a JSON body against a zod schema (400 on failure). */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join("; ");
    throw new ApiError(400, "validation_error", detail);
  }
  return parsed.data;
}

/** Wrap a route handler with uniform error handling. */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) return jsonError(err.status, err.code, err.message);
      console.error("Unhandled API error:", err);
      return jsonError(500, "internal_error", "Something went wrong");
    }
  };
}
