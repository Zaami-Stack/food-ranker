import { getAverageRating, sortPlacesForRanking } from "@/lib/ranking";
import type { PlaceInput, ReviewInput } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Place, PlaceDetails, PlaceWithStats, Review } from "@/lib/types";

type DbError = {
  code?: string;
  message: string;
};

type PlaceRow = {
  id: string;
  name: string;
  location: string;
  cuisine: string | null;
  added_by: string;
  created_at: string;
};

type ReviewRow = {
  id: string;
  place_id: string;
  food_name: string;
  rating: number;
  comment: string | null;
  image_url: string | null;
  reviewer_name: string;
  created_at: string;
};

type ReviewRowLegacy = {
  id: string;
  place_id: string;
  food_name: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
};

const PLACE_COLUMNS = "id, name, location, cuisine, added_by, created_at";
const REVIEW_COLUMNS = "id, place_id, food_name, rating, comment, image_url, reviewer_name, created_at";
const REVIEW_COLUMNS_LEGACY = "id, place_id, food_name, rating, comment, reviewer_name, created_at";

export class RepositoryError extends Error {
  constructor(
    message: string,
    public code: "PLACE_EXISTS" | "PLACE_NOT_FOUND" | "DB_READ_FAILED" | "DB_WRITE_FAILED",
    public status: number,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

function toPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    cuisine: row.cuisine,
    addedBy: row.added_by,
    createdAt: row.created_at,
  };
}

function toReview(row: ReviewRow | ReviewRowLegacy): Review {
  return {
    id: row.id,
    placeId: row.place_id,
    foodName: row.food_name,
    rating: row.rating,
    comment: row.comment,
    imageUrl: "image_url" in row ? row.image_url : null,
    reviewerName: row.reviewer_name,
    createdAt: row.created_at,
  };
}

function isImageUrlColumnMissing(error: DbError) {
  return error.code === "42703" && error.message.toLowerCase().includes("image_url");
}

function toRepositoryError(error: DbError, action: "read" | "write"): RepositoryError {
  if (error.code === "23505") {
    return new RepositoryError("This place already exists.", "PLACE_EXISTS", 409);
  }

  if (error.code === "23503") {
    return new RepositoryError("The selected place was not found.", "PLACE_NOT_FOUND", 404);
  }

  if (action === "read") {
    return new RepositoryError("Failed to read data from the database.", "DB_READ_FAILED", 500);
  }

  return new RepositoryError("Failed to save data to the database.", "DB_WRITE_FAILED", 500);
}

function buildPlaceWithStats(places: Place[], reviews: Review[]): PlaceWithStats[] {
  const reviewsByPlace = new Map<string, Review[]>();

  for (const review of reviews) {
    const current = reviewsByPlace.get(review.placeId) ?? [];
    current.push(review);
    reviewsByPlace.set(review.placeId, current);
  }

  const withStats = places.map((place) => {
    const placeReviews = reviewsByPlace.get(place.id) ?? [];
    return {
      ...place,
      averageRating: getAverageRating(placeReviews),
      reviewCount: placeReviews.length,
      latestReviews: placeReviews.slice(0, 3),
    };
  });

  return sortPlacesForRanking(withStats);
}

export async function listPlacesWithStats() {
  const supabase = getSupabaseAdminClient();
  const { data: placeRows, error: placeError } = await supabase
    .from("places")
    .select(PLACE_COLUMNS)
    .order("created_at", { ascending: false });

  if (placeError) {
    throw toRepositoryError(placeError as DbError, "read");
  }

  const places = (placeRows as PlaceRow[] | null)?.map(toPlace) ?? [];
  if (places.length === 0) {
    return [];
  }

  const placeIds = places.map((place) => place.id);
  const { data: reviewRows, error: reviewError } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .in("place_id", placeIds)
    .order("created_at", { ascending: false });

  if (reviewError && isImageUrlColumnMissing(reviewError as DbError)) {
    const { data: legacyReviewRows, error: legacyReviewError } = await supabase
      .from("reviews")
      .select(REVIEW_COLUMNS_LEGACY)
      .in("place_id", placeIds)
      .order("created_at", { ascending: false });

    if (legacyReviewError) {
      throw toRepositoryError(legacyReviewError as DbError, "read");
    }

    const reviews = (legacyReviewRows as ReviewRowLegacy[] | null)?.map(toReview) ?? [];
    return buildPlaceWithStats(places, reviews);
  }

  if (reviewError) {
    throw toRepositoryError(reviewError as DbError, "read");
  }

  const reviews = (reviewRows as ReviewRow[] | null)?.map(toReview) ?? [];
  return buildPlaceWithStats(places, reviews);
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const supabase = getSupabaseAdminClient();
  const { data: placeRow, error: placeError } = await supabase
    .from("places")
    .select(PLACE_COLUMNS)
    .eq("id", placeId)
    .maybeSingle();

  if (placeError) {
    throw toRepositoryError(placeError as DbError, "read");
  }

  if (!placeRow) {
    return null;
  }

  const { data: reviewRows, error: reviewError } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });

  if (reviewError && isImageUrlColumnMissing(reviewError as DbError)) {
    const { data: legacyReviewRows, error: legacyReviewError } = await supabase
      .from("reviews")
      .select(REVIEW_COLUMNS_LEGACY)
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    if (legacyReviewError) {
      throw toRepositoryError(legacyReviewError as DbError, "read");
    }

    const place = toPlace(placeRow as PlaceRow);
    const reviews = (legacyReviewRows as ReviewRowLegacy[] | null)?.map(toReview) ?? [];
    return {
      ...place,
      averageRating: getAverageRating(reviews),
      reviewCount: reviews.length,
      latestReviews: reviews.slice(0, 3),
      reviews,
    };
  }

  if (reviewError) {
    throw toRepositoryError(reviewError as DbError, "read");
  }

  const place = toPlace(placeRow as PlaceRow);
  const reviews = (reviewRows as ReviewRow[] | null)?.map(toReview) ?? [];

  return {
    ...place,
    averageRating: getAverageRating(reviews),
    reviewCount: reviews.length,
    latestReviews: reviews.slice(0, 3),
    reviews,
  };
}

export async function createPlace(input: PlaceInput): Promise<PlaceWithStats> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("places")
    .insert({
      name: input.name,
      location: input.location,
      cuisine: input.cuisine ?? null,
      added_by: input.addedBy,
    })
    .select(PLACE_COLUMNS)
    .single();

  if (error) {
    throw toRepositoryError(error as DbError, "write");
  }

  const place = toPlace(data as PlaceRow);

  return {
    ...place,
    averageRating: null,
    reviewCount: 0,
    latestReviews: [],
  };
}

export async function createReview(input: ReviewInput): Promise<Review> {
  const supabase = getSupabaseAdminClient();
  const insertPayload = {
    place_id: input.placeId,
    food_name: input.foodName,
    rating: input.rating,
    comment: input.comment ?? null,
    image_url: input.imageUrl ?? null,
    reviewer_name: input.reviewerName,
  };

  const { data, error } = await supabase
    .from("reviews")
    .insert(insertPayload)
    .select(REVIEW_COLUMNS)
    .single();

  if (error && isImageUrlColumnMissing(error as DbError)) {
    if (input.imageUrl) {
      throw new RepositoryError(
        "Photo uploads need the latest database migration. Run migration 202603160002_add_review_images.sql first.",
        "DB_WRITE_FAILED",
        500,
      );
    }

    const { data: legacyData, error: legacyError } = await supabase
      .from("reviews")
      .insert({
        place_id: input.placeId,
        food_name: input.foodName,
        rating: input.rating,
        comment: input.comment ?? null,
        reviewer_name: input.reviewerName,
      })
      .select(REVIEW_COLUMNS_LEGACY)
      .single();

    if (legacyError) {
      throw toRepositoryError(legacyError as DbError, "write");
    }

    return toReview(legacyData as ReviewRowLegacy);
  }

  if (error) {
    throw toRepositoryError(error as DbError, "write");
  }

  return toReview(data as ReviewRow);
}
