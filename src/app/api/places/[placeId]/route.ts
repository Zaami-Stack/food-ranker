import { fail, fromZodError, ok } from "@/lib/http";
import { getPlaceDetails, RepositoryError } from "@/lib/repository";
import { placeIdParamsSchema } from "@/lib/schemas";

type RouteContext = {
  params: {
    placeId: string;
  };
};

export async function GET(_: Request, context: RouteContext) {
  const parsedParams = placeIdParamsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return fromZodError(parsedParams.error);
  }

  try {
    const place = await getPlaceDetails(parsedParams.data.placeId);
    if (!place) {
      return fail("NOT_FOUND", "Place not found.", 404);
    }

    return ok({ place });
  } catch (error) {
    if (error instanceof RepositoryError) {
      if (error.code === "PLACE_NOT_FOUND") {
        return fail("NOT_FOUND", error.message, error.status);
      }

      return fail("INTERNAL_ERROR", error.message, error.status);
    }

    return fail("INTERNAL_ERROR", "Could not load this place right now.", 500);
  }
}
