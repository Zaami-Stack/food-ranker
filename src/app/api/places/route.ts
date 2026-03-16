import { type NextRequest } from "next/server";
import { JsonBodyParseError, fail, fromZodError, ok, parseJsonBody } from "@/lib/http";
import { applyRateLimit, getClientIp } from "@/lib/rate-limit";
import { RepositoryError, createPlace, listPlacesWithStats } from "@/lib/repository";
import { placeInputSchema } from "@/lib/schemas";

const WRITE_LIMIT = 25;
const WINDOW_MS = 60_000;

function mapRepositoryError(error: RepositoryError) {
  if (error.code === "PLACE_EXISTS") {
    return fail("CONFLICT", error.message, error.status);
  }

  if (error.code === "PLACE_NOT_FOUND") {
    return fail("NOT_FOUND", error.message, error.status);
  }

  return fail("INTERNAL_ERROR", error.message, error.status);
}

export async function GET() {
  try {
    const places = await listPlacesWithStats();
    return ok({ places });
  } catch {
    return fail("INTERNAL_ERROR", "Could not load places right now.", 500);
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rate = applyRateLimit(`places:create:${clientIp}`, WRITE_LIMIT, WINDOW_MS);
  if (!rate.allowed) {
    return fail("RATE_LIMITED", "Too many place submissions. Try again in a minute.", 429, {
      resetAt: rate.resetAt,
    });
  }

  try {
    const payload = await parseJsonBody(request);
    const parsed = placeInputSchema.safeParse(payload);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }

    const place = await createPlace(parsed.data);
    return ok({ place }, 201);
  } catch (error) {
    if (error instanceof JsonBodyParseError) {
      return fail("BAD_REQUEST", error.message, 400);
    }

    if (error instanceof RepositoryError) {
      return mapRepositoryError(error);
    }

    return fail("INTERNAL_ERROR", "Could not create place right now.", 500);
  }
}
