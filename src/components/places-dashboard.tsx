"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AddPlaceForm } from "@/components/add-place-form";
import { AddReviewForm } from "@/components/add-review-form";
import { PlaceCard } from "@/components/place-card";
import type { ApiFailure, ApiSuccess, PlaceWithStats, Review } from "@/lib/types";

type PlacesPayload = {
  places: PlaceWithStats[];
};

type MobileView = "board" | "place" | "review";

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
    <section className="panel card-3d lift-in p-4 sm:p-5" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.64rem] font-extrabold uppercase tracking-[0.11em] text-[rgb(var(--ink-500))]">Ranking</p>
          <h2 className="text-xl font-black tracking-tight text-[rgb(var(--ink-950))]">Top Places</h2>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={isRefreshing}
          className="rounded-xl border border-[rgba(var(--line),0.95)] bg-white px-3 py-2 text-sm font-semibold text-[rgb(var(--ink-700))] transition hover:translate-y-[-1px] hover:shadow-[0_10px_18px_-16px_rgba(37,99,235,0.9)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="panel card-3d h-40 animate-pulse border border-[rgba(var(--line),0.8)] bg-white/90" />
          ))}
        </div>
      ) : null}

      {!isLoading && places.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(var(--line),0.95)] bg-[rgb(var(--surface-2))]/70 px-4 py-9 text-center">
          <p className="text-lg font-black text-[rgb(var(--ink-950))]">No places yet</p>
          <p className="mt-1 text-sm text-[rgb(var(--ink-500))]">Use Add Place to save your first spot.</p>
        </div>
      ) : null}

      {!isLoading && places.length > 0 ? (
        <div className="space-y-3.5">
          {places.map((place, index) => (
            <div key={place.id} className="lift-in" style={{ animationDelay: `${index * 65}ms` }}>
              <PlaceCard place={place} position={index + 1} highlighted={highlightPlaceId === place.id} />
            </div>
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
  const [mobileView, setMobileView] = useState<MobileView>("board");

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
    setMobileView("board");
    await loadPlaces("refresh");
  }

  async function handleReviewCreated(review: Review) {
    setHighlightPlaceId(review.placeId);
    setMobileView("board");
    await loadPlaces("refresh");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10">
      <header className="panel card-3d lift-in p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <p className="inline-flex rounded-full border border-[rgba(var(--line),0.95)] bg-[rgb(var(--surface-2))] px-3 py-1 text-[0.67rem] font-extrabold uppercase tracking-[0.12em] text-[rgb(var(--ink-700))]">
              Clean 3D Mobile UI
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-[rgb(var(--ink-950))] sm:text-4xl">FoodSpot Ranker</h1>
            <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--ink-700))] sm:text-base">
              Built for phones first. Add places, rate dishes, and keep your ranking board sharp and fast.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="panel card-3d border border-[rgba(var(--line),0.95)] bg-white/95 px-3 py-2.5">
              <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.11em] text-[rgb(var(--ink-500))]">Places</p>
              <p className="mt-1 text-xl font-black text-[rgb(var(--ink-950))]">{places.length}</p>
            </div>
            <div className="panel card-3d border border-[rgba(var(--line),0.95)] bg-white/95 px-3 py-2.5">
              <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.11em] text-[rgb(var(--ink-500))]">Reviews</p>
              <p className="mt-1 text-xl font-black text-[rgb(var(--ink-950))]">{totalReviews}</p>
            </div>
            <div className="panel card-3d border border-[rgba(var(--line),0.95)] bg-white/95 px-3 py-2.5">
              <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.11em] text-[rgb(var(--ink-500))]">Top</p>
              <p className="mt-1 text-xl font-black text-[rgb(var(--ink-950))]">{topScore === null ? "--" : topScore.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-4 lg:hidden">
        <div className="segment-wrap">
          <button
            type="button"
            className={`segment-item ${mobileView === "board" ? "segment-item-active" : ""}`}
            onClick={() => setMobileView("board")}
          >
            Board
          </button>
          <button
            type="button"
            className={`segment-item ${mobileView === "place" ? "segment-item-active" : ""}`}
            onClick={() => setMobileView("place")}
          >
            Place
          </button>
          <button
            type="button"
            className={`segment-item ${mobileView === "review" ? "segment-item-active" : ""}`}
            onClick={() => setMobileView("review")}
          >
            Review
          </button>
        </div>
      </div>

      <div className="mt-5 lg:hidden">
        {mobileView === "board" ? (
          <BoardSection
            places={places}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            error={error}
            highlightPlaceId={highlightPlaceId}
            onRefresh={() => loadPlaces("refresh")}
          />
        ) : null}
        {mobileView === "place" ? <AddPlaceForm onCreated={handlePlaceCreated} /> : null}
        {mobileView === "review" ? (
          <AddReviewForm places={places} selectedPlaceId={highlightPlaceId} onCreated={handleReviewCreated} />
        ) : null}
      </div>

      <div className="mt-6 hidden gap-6 lg:grid lg:grid-cols-[minmax(320px,370px)_1fr]">
        <aside className="space-y-6">
          <AddPlaceForm onCreated={handlePlaceCreated} />
          <AddReviewForm places={places} selectedPlaceId={highlightPlaceId} onCreated={handleReviewCreated} />
        </aside>
        <BoardSection
          places={places}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={error}
          highlightPlaceId={highlightPlaceId}
          onRefresh={() => loadPlaces("refresh")}
        />
      </div>

      <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-30 mx-auto flex w-full max-w-md px-4 lg:hidden">
        <div className="pointer-events-auto mx-auto grid w-full grid-cols-3 gap-2 rounded-2xl border border-[rgba(var(--line),0.95)] bg-white/96 p-2 shadow-[0_24px_36px_-24px_rgba(30,64,175,0.8)] backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setMobileView("board")}
            className={`rounded-xl px-2 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.09em] ${
              mobileView === "board" ? "bg-[rgb(var(--accent))] text-white" : "bg-[rgb(var(--surface-2))] text-[rgb(var(--ink-700))]"
            }`}
          >
            Board
          </button>
          <button
            type="button"
            onClick={() => setMobileView("place")}
            className={`rounded-xl px-2 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.09em] ${
              mobileView === "place" ? "bg-[rgb(var(--accent))] text-white" : "bg-[rgb(var(--surface-2))] text-[rgb(var(--ink-700))]"
            }`}
          >
            Place
          </button>
          <button
            type="button"
            onClick={() => setMobileView("review")}
            className={`rounded-xl px-2 py-2 text-[0.72rem] font-extrabold uppercase tracking-[0.09em] ${
              mobileView === "review" ? "bg-[rgb(var(--accent))] text-white" : "bg-[rgb(var(--surface-2))] text-[rgb(var(--ink-700))]"
            }`}
          >
            Review
          </button>
        </div>
      </nav>
    </main>
  );
}
