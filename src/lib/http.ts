import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiErrorCode, ApiFailure, ApiSuccess } from "@/lib/types";

export class JsonBodyParseError extends Error {
  constructor(message = "Request body must be valid JSON.") {
    super(message);
    this.name = "JsonBodyParseError";
  }
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new JsonBodyParseError();
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>(
    {
      success: true,
      data,
    },
    { status },
  );
}

export function fail(code: ApiErrorCode, message: string, status: number, details?: unknown) {
  return NextResponse.json<ApiFailure>(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}

export function fromZodError(error: ZodError) {
  const details = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return fail("VALIDATION_ERROR", "Request validation failed.", 422, details);
}
