import { type NextRequest } from "next/server";
import { JsonBodyParseError, fail, fromZodError, ok, parseJsonBody } from "@/lib/http";
import { applyRateLimit, getClientIp } from "@/lib/rate-limit";
import { RepositoryError, updateFoodEntryRatings } from "@/lib/repository";
import { foodEntryIdParamsSchema, foodEntryRatingsUpdateSchema } from "@/lib/schemas";

type RouteContext = {
  params: {
    entryId: string;
  };
};

const WRITE_LIMIT = 90;
const WINDOW_MS = 60_000;

function mapRepositoryError(error: RepositoryError) {
  if (error.code === "FOOD_ENTRY_NOT_FOUND" || error.code === "PLACE_NOT_FOUND") {
    return fail("NOT_FOUND", error.message, error.status);
  }

  if (error.code === "PLACE_EXISTS") {
    return fail("CONFLICT", error.message, error.status);
  }

  return fail("INTERNAL_ERROR", error.message, error.status);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const parsedParams = foodEntryIdParamsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return fromZodError(parsedParams.error);
  }

  const clientIp = getClientIp(request);
  const rate = applyRateLimit(`food-entries:update:${clientIp}`, WRITE_LIMIT, WINDOW_MS);
  if (!rate.allowed) {
    return fail("RATE_LIMITED", "Too many rating updates. Try again in a minute.", 429, {
      resetAt: rate.resetAt,
    });
  }

  try {
    const payload = await parseJsonBody(request);
    const parsed = foodEntryRatingsUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }

    const entry = await updateFoodEntryRatings(parsedParams.data.entryId, parsed.data);
    return ok({ entry });
  } catch (error) {
    if (error instanceof JsonBodyParseError) {
      return fail("BAD_REQUEST", error.message, 400);
    }

    if (error instanceof RepositoryError) {
      return mapRepositoryError(error);
    }

    return fail("INTERNAL_ERROR", "Could not update ratings right now.", 500);
  }
}
