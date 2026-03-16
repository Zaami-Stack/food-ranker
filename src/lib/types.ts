export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export type Place = {
  id: string;
  name: string;
  location: string;
  cuisine: string | null;
  addedBy: string;
  createdAt: string;
};

export type Review = {
  id: string;
  placeId: string;
  foodName: string;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  reviewerName: string;
  createdAt: string;
};

export type PlaceWithStats = Place & {
  averageRating: number | null;
  reviewCount: number;
  latestReviews: Review[];
};

export type PlaceDetails = PlaceWithStats & {
  reviews: Review[];
};

export type FoodEntry = {
  id: string;
  foodName: string;
  sourcePlace: string;
  imageUrl: string | null;
  saadRating: number;
  anasRating: number;
  averageRating: number;
  createdAt: string;
};
