"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AddPlaceForm } from "@/components/add-place-form";
import { AddReviewForm } from "@/components/add-review-form";
import { PlaceCard } from "@/components/place-card";
import type { ApiFailure, ApiSuccess, PlaceWithStats, Review } from "@/lib/types";

type PlacesPayload = {
  places: PlaceWithStats[];
};

type BoardProps = {
  places: PlaceWithStats[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  highlightPlaceId: string | null;
  onRefresh: () => Promise<void> | void;
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

function BoardSection({ places, isLoading, isRefreshing, error, highlightPlaceId, onRefresh }: BoardProps) {
  return (
    <section id="ranking-board" className="panel p-4 sm:p-5" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Live Ranking</p>
          <h2 className="text-xl font-bold text-[rgb(var(--ink-950))]">Top Food Places</h2>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={isRefreshing}
          className="rounded-lg border border-[rgba(var(--line),1)] bg-white px-3 py-2 text-sm font-semibold text-[rgb(var(--ink-700))] transition hover:bg-[rgb(var(--surface-2))] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl border border-[rgba(var(--line),0.95)] bg-white" />
          ))}
        </div>
      ) : null}

      {!isLoading && places.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(var(--line),1)] bg-[rgb(var(--surface-2))] px-4 py-8 text-center">
          <p className="text-base font-semibold text-[rgb(var(--ink-950))]">No places yet</p>
          <p className="mt-1 text-sm text-[rgb(var(--ink-500))]">Add your first place below and start reviewing.</p>
        </div>
      ) : null}

      {!isLoading && places.length > 0 ? (
        <div className="space-y-3">
          {places.map((place, index) => (
            <PlaceCard key={place.id} place={place} position={index + 1} highlighted={highlightPlaceId === place.id} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function PlacesDashboard() {
  const [places, setPlaces] = useState<PlaceWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightPlaceId, setHighlightPlaceId] = useState<string | null>(null);

  const totalReviews = useMemo(() => places.reduce((sum, place) => sum + place.reviewCount, 0), [places]);
  const topScore = places[0]?.averageRating ?? null;

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
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <header className="panel p-5 sm:p-6">
        <p className="inline-flex rounded-full border border-[rgba(var(--line),1)] bg-[rgb(var(--surface-2))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-700))]">
          Shared Food Journal
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-[rgb(var(--ink-950))] sm:text-4xl">Anas and Saad Space</h1>
        <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--ink-700))] sm:text-base">
          Easy and clean. Add places, rate meals, and keep your best spots ranked together.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2.5 sm:max-w-md sm:gap-3">
          <div className="rounded-xl border border-[rgba(var(--line),1)] bg-white px-3 py-2.5">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Places</p>
            <p className="mt-1 text-xl font-bold text-[rgb(var(--ink-950))]">{places.length}</p>
          </div>
          <div className="rounded-xl border border-[rgba(var(--line),1)] bg-white px-3 py-2.5">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Reviews</p>
            <p className="mt-1 text-xl font-bold text-[rgb(var(--ink-950))]">{totalReviews}</p>
          </div>
          <div className="rounded-xl border border-[rgba(var(--line),1)] bg-white px-3 py-2.5">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Top Score</p>
            <p className="mt-1 text-xl font-bold text-[rgb(var(--ink-950))]">{topScore === null ? "--" : topScore.toFixed(2)}</p>
          </div>
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_minmax(320px,380px)]">
        <BoardSection
          places={places}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={error}
          highlightPlaceId={highlightPlaceId}
          onRefresh={() => loadPlaces("refresh")}
        />
        <aside className="space-y-5">
          <section id="add-place">
            <AddPlaceForm onCreated={handlePlaceCreated} />
          </section>
          <section id="add-review">
            <AddReviewForm places={places} selectedPlaceId={highlightPlaceId} onCreated={handleReviewCreated} />
          </section>
        </aside>
      </div>
    </main>
  );
}
