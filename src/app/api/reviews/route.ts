import { type NextRequest } from "next/server";
import { JsonBodyParseError, fail, fromZodError, ok, parseJsonBody } from "@/lib/http";
import { applyRateLimit, getClientIp } from "@/lib/rate-limit";
import { ReviewPhotoError, uploadReviewPhoto } from "@/lib/review-photo";
import { RepositoryError, createReview } from "@/lib/repository";
import { reviewInputSchema } from "@/lib/schemas";

const WRITE_LIMIT = 45;
const WINDOW_MS = 60_000;

function mapRepositoryError(error: RepositoryError) {
  if (error.code === "PLACE_NOT_FOUND") {
    return fail("NOT_FOUND", error.message, error.status);
  }

  if (error.code === "PLACE_EXISTS") {
    return fail("CONFLICT", error.message, error.status);
  }

  return fail("INTERNAL_ERROR", error.message, error.status);
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function readOptionalPhoto(formData: FormData) {
  const value = formData.get("photo");
  if (!(value instanceof File)) {
    return null;
  }

  if (value.size <= 0) {
    return null;
  }

  return value;
}

async function parseReviewPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const photo = readOptionalPhoto(formData);
    const imageUrl = photo ? await uploadReviewPhoto(photo) : undefined;

    return {
      placeId: readFormString(formData, "placeId"),
      foodName: readFormString(formData, "foodName"),
      rating: readFormString(formData, "rating"),
      comment: readFormString(formData, "comment"),
      imageUrl,
      reviewerName: readFormString(formData, "reviewerName"),
    };
  }

  return parseJsonBody(request);
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rate = applyRateLimit(`reviews:create:${clientIp}`, WRITE_LIMIT, WINDOW_MS);
  if (!rate.allowed) {
    return fail("RATE_LIMITED", "Too many reviews submitted. Try again in a minute.", 429, {
      resetAt: rate.resetAt,
    });
  }

  try {
    const payload = await parseReviewPayload(request);
    const parsed = reviewInputSchema.safeParse(payload);
    if (!parsed.success) {
      return fromZodError(parsed.error);
    }

    const review = await createReview(parsed.data);
    return ok({ review }, 201);
  } catch (error) {
    if (error instanceof JsonBodyParseError) {
      return fail("BAD_REQUEST", error.message, 400);
    }

    if (error instanceof ReviewPhotoError) {
      if (error.status >= 500) {
        return fail("INTERNAL_ERROR", error.message, error.status);
      }

      return fail("VALIDATION_ERROR", error.message, error.status);
    }

    if (error instanceof RepositoryError) {
      return mapRepositoryError(error);
    }

    return fail("INTERNAL_ERROR", "Could not create review right now.", 500);
  }
}
