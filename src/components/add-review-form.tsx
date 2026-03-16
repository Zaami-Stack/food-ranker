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
    <section className="panel lift-in rounded-[1.35rem] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full border border-[rgba(var(--line),0.9)] bg-[rgb(var(--surface-2))] px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-[rgb(var(--ink-700))]">
            Add Review
          </p>
          <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[rgb(var(--ink-900))]">Score The Food</h2>
        </div>
      </div>
      <p className="mt-2 text-sm text-[rgb(var(--ink-500))]">Review a dish and leave a comment so your top places stay accurate.</p>

      {!hasPlaces ? (
        <div className="mt-4 rounded-xl border border-dashed border-[rgba(var(--line),0.95)] bg-[rgb(var(--surface-2))]/75 px-3 py-4 text-sm text-[rgb(var(--ink-700))]">
          Add at least one place first before posting reviews.
        </div>
      ) : null}

      <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
        <label className="app-label" htmlFor="review-place">
          Place
        </label>
        <select
          id="review-place"
          value={draft.placeId}
          onChange={(event) => setDraft((prev) => ({ ...prev, placeId: event.target.value }))}
          className="app-select"
          required
          disabled={!hasPlaces}
        >
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>

        <label className="app-label" htmlFor="review-food-name">
          Food Name
        </label>
        <input
          id="review-food-name"
          value={draft.foodName}
          onChange={(event) => setDraft((prev) => ({ ...prev, foodName: event.target.value }))}
          className="app-field"
          placeholder="Chicken Shawarma"
          maxLength={80}
          required
          disabled={!hasPlaces}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="app-label" htmlFor="review-rating">
              Rating (1-5)
            </label>
            <select
              id="review-rating"
              value={draft.rating}
              onChange={(event) => setDraft((prev) => ({ ...prev, rating: Number(event.target.value) }))}
              className="app-select mt-1"
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
            <label className="app-label" htmlFor="reviewer-name">
              Your Name
            </label>
            <input
              id="reviewer-name"
              value={draft.reviewerName}
              onChange={(event) => setDraft((prev) => ({ ...prev, reviewerName: event.target.value }))}
              className="app-field mt-1"
              placeholder="Friend name"
              maxLength={40}
              required
              disabled={!hasPlaces}
            />
          </div>
        </div>

        <label className="app-label" htmlFor="review-comment">
          Comment (Optional)
        </label>
        <textarea
          id="review-comment"
          value={draft.comment}
          onChange={(event) => setDraft((prev) => ({ ...prev, comment: event.target.value }))}
          className="app-textarea"
          placeholder="Crispy fries, very good sauce."
          maxLength={280}
          disabled={!hasPlaces}
        />

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
        ) : null}
        {successMessage ? (
          <p className="rounded-xl border border-[rgba(var(--teal),0.25)] bg-[rgba(var(--teal-soft),0.55)] px-3 py-2 text-sm font-medium text-[rgb(var(--teal))]">
            {successMessage}
          </p>
        ) : null}

        <button type="submit" disabled={!hasPlaces || isSubmitting} className="app-btn app-btn-dark">
          {isSubmitting ? "Submitting..." : "Add Review"}
        </button>
      </form>
    </section>
  );
}
