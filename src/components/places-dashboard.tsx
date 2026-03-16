"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AddPlaceForm } from "@/components/add-place-form";
import { AddReviewForm } from "@/components/add-review-form";
import { PlaceCard } from "@/components/place-card";
import type { ApiFailure, ApiSuccess, PlaceWithStats, Review } from "@/lib/types";

type PlacesPayload = {
  places: PlaceWithStats[];
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

export function PlacesDashboard() {
  const [places, setPlaces] = useState<PlaceWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightPlaceId, setHighlightPlaceId] = useState<string | null>(null);

  const totalReviews = useMemo(() => places.reduce((sum, place) => sum + place.reviewCount, 0), [places]);

  const loadPlaces = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch("/api/places", { cache: "no-store" });
      const payload = (await response.json()) as ApiSuccess<PlacesPayload> | ApiFailure;

      if (!response.ok || !payload.success) {
        const message = getErrorMessage(payload.success ? undefined : payload, "Could not load places.");
        throw new Error(message);
      }

      setPlaces(payload.data.places);
      setError(null);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Could not load places.";
      setError(message);
    } finally {
      if (mode === "initial") {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPlaces("initial");
  }, [loadPlaces]);

  async function handlePlaceCreated(place: PlaceWithStats) {
    setHighlightPlaceId(place.id);
    await loadPlaces("refresh");
  }

  async function handleReviewCreated(review: Review) {
    setHighlightPlaceId(review.placeId);
    await loadPlaces("refresh");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="fade-up rounded-2xl border border-[rgb(var(--brand-border))] bg-white/70 p-6 shadow-soft backdrop-blur-sm">
        <p className="mb-2 inline-flex rounded-full border border-[rgb(var(--brand-border))] bg-[rgb(var(--brand-accent-soft))]/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
          Shared Food Journal
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">FoodSpot Ranker</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-700 sm:text-base">
              Add your favorite food places, rate each dish, and keep one live ranking board for you and your friend.
            </p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--brand-border))] bg-white px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.1em] text-stone-500">Stats</p>
            <p className="text-sm font-semibold text-stone-800">
              {places.length} places | {totalReviews} reviews
            </p>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <aside className="space-y-6">
          <AddPlaceForm onCreated={handlePlaceCreated} />
          <AddReviewForm places={places} selectedPlaceId={highlightPlaceId} onCreated={handleReviewCreated} />
        </aside>

        <section className="panel fade-up rounded-2xl p-5 shadow-soft" aria-live="polite">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-stone-900">Ranking Board</h2>
            <button
              type="button"
              onClick={() => void loadPlaces("refresh")}
              disabled={isRefreshing}
              className="rounded-lg border border-[rgb(var(--brand-border))] bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-xl border border-stone-200 bg-stone-100" />
              ))}
            </div>
          ) : null}

          {!isLoading && places.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgb(var(--brand-border))] bg-amber-50/60 px-4 py-10 text-center">
              <p className="text-lg font-semibold text-stone-800">No places yet.</p>
              <p className="mt-1 text-sm text-stone-600">Start by adding the first food place using the form.</p>
            </div>
          ) : null}

          {!isLoading && places.length > 0 ? (
            <div className="space-y-4">
              {places.map((place, index) => (
                <PlaceCard key={place.id} place={place} position={index + 1} highlighted={highlightPlaceId === place.id} />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
