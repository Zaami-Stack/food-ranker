"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiFailure, ApiSuccess, PlaceWithStats, Review } from "@/lib/types";

type ReviewCreatePayload = {
  review: Review;
};

type AddReviewFormProps = {
  places: PlaceWithStats[];
  selectedPlaceId: string | null;
  onCreated: (review: Review) => void | Promise<void>;
};

type ReviewDraft = {
  placeId: string;
  foodName: string;
  rating: number;
  comment: string;
  reviewerName: string;
};

function getErrorMessage(payload: ApiFailure | undefined, fallback: string) {
  if (!payload) {
    return fallback;
  }

  if (Array.isArray(payload.error.details) && payload.error.details.length > 0) {
    const first = payload.error.details[0] as { message?: string };
    if (typeof first?.message === "string") {
      return first.message;
    }
  }

  return payload.error.message || fallback;
}

export function AddReviewForm({ places, selectedPlaceId, onCreated }: AddReviewFormProps) {
  const [draft, setDraft] = useState<ReviewDraft>({
    placeId: "",
    foodName: "",
    rating: 4,
    comment: "",
    reviewerName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasPlaces = places.length > 0;
  const placeIds = useMemo(() => new Set(places.map((place) => place.id)), [places]);

  useEffect(() => {
    if (!hasPlaces) {
      setDraft((prev) => ({ ...prev, placeId: "" }));
      return;
    }

    if (selectedPlaceId && placeIds.has(selectedPlaceId)) {
      setDraft((prev) => ({ ...prev, placeId: selectedPlaceId }));
      return;
    }

    if (!draft.placeId || !placeIds.has(draft.placeId)) {
      setDraft((prev) => ({ ...prev, placeId: places[0].id }));
    }
  }, [draft.placeId, hasPlaces, placeIds, places, selectedPlaceId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasPlaces) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json()) as ApiSuccess<ReviewCreatePayload> | ApiFailure;
      if (!response.ok || !payload.success) {
        const message = getErrorMessage(payload.success ? undefined : payload, "Could not submit review.");
        throw new Error(message);
      }

      await onCreated(payload.data.review);
      setDraft((prev) => ({
        ...prev,
        placeId: payload.data.review.placeId,
        foodName: "",
        rating: 4,
        comment: "",
      }));
      setSuccessMessage("Review added to ranking.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel fade-up rounded-2xl p-5 shadow-soft">
      <h2 className="text-lg font-bold text-stone-900">Add Food Review</h2>
      <p className="mt-1 text-sm text-stone-600">Rate a dish and leave a comment so your ranking stays up to date.</p>

      {!hasPlaces ? (
        <div className="mt-4 rounded-lg border border-dashed border-[rgb(var(--brand-border))] bg-amber-50/50 px-3 py-4 text-sm text-stone-700">
          Add at least one place first before posting reviews.
        </div>
      ) : null}

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-stone-800" htmlFor="review-place">
          Place
        </label>
        <select
          id="review-place"
          value={draft.placeId}
          onChange={(event) => setDraft((prev) => ({ ...prev, placeId: event.target.value }))}
          className="w-full rounded-lg border border-[rgb(var(--brand-border))] bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-orange-100"
          required
          disabled={!hasPlaces}
        >
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium text-stone-800" htmlFor="review-food-name">
          Food Name
        </label>
        <input
          id="review-food-name"
          value={draft.foodName}
          onChange={(event) => setDraft((prev) => ({ ...prev, foodName: event.target.value }))}
          className="w-full rounded-lg border border-[rgb(var(--brand-border))] bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-orange-100"
          placeholder="Chicken Shawarma"
          maxLength={80}
          required
          disabled={!hasPlaces}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-stone-800" htmlFor="review-rating">
              Rating (1-5)
            </label>
            <select
              id="review-rating"
              value={draft.rating}
              onChange={(event) => setDraft((prev) => ({ ...prev, rating: Number(event.target.value) }))}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--brand-border))] bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-orange-100"
              disabled={!hasPlaces}
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-800" htmlFor="reviewer-name">
              Your Name
            </label>
            <input
              id="reviewer-name"
              value={draft.reviewerName}
              onChange={(event) => setDraft((prev) => ({ ...prev, reviewerName: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--brand-border))] bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-orange-100"
              placeholder="Friend name"
              maxLength={40}
              required
              disabled={!hasPlaces}
            />
          </div>
        </div>

        <label className="block text-sm font-medium text-stone-800" htmlFor="review-comment">
          Comment (Optional)
        </label>
        <textarea
          id="review-comment"
          value={draft.comment}
          onChange={(event) => setDraft((prev) => ({ ...prev, comment: event.target.value }))}
          className="h-24 w-full resize-y rounded-lg border border-[rgb(var(--brand-border))] bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-orange-100"
          placeholder="Crispy fries, very good sauce."
          maxLength={280}
          disabled={!hasPlaces}
        />

        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {successMessage ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={!hasPlaces || isSubmitting}
          className="w-full rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Add Review"}
        </button>
      </form>
    </section>
  );
}
