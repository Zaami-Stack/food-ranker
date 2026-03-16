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

type RankingBoardSectionProps = {
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

function RankingBoardSection({
  places,
  isLoading,
  isRefreshing,
  error,
  highlightPlaceId,
  onRefresh,
}: RankingBoardSectionProps) {
  return (
    <section className="panel lift-in rounded-[1.35rem] p-4 sm:p-5" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.64rem] font-extrabold uppercase tracking-[0.12em] text-[rgb(var(--ink-500))]">Live Ranking</p>
          <h2 className="text-xl font-extrabold tracking-tight text-[rgb(var(--ink-900))]">Top Food Places</h2>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={isRefreshing}
          className="rounded-xl border border-[rgba(var(--line),0.95)] bg-white px-3 py-2 text-sm font-semibold text-[rgb(var(--ink-700))] transition hover:translate-y-[-1px] hover:bg-[rgb(var(--surface-2))] disabled:cursor-not-allowed disabled:opacity-55"
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
            <div key={index} className="h-40 animate-pulse rounded-[1.1rem] border border-[rgba(var(--line),0.7)] bg-white" />
          ))}
        </div>
      ) : null}

      {!isLoading && places.length === 0 ? (
        <div className="rounded-[1.1rem] border border-dashed border-[rgba(var(--line),0.95)] bg-[rgb(var(--surface-2))]/75 px-4 py-9 text-center">
          <p className="text-lg font-extrabold text-[rgb(var(--ink-900))]">No places yet</p>
          <p className="mt-1 text-sm text-[rgb(var(--ink-500))]">Open Add Place and save your first food spot.</p>
        </div>
      ) : null}

      {!isLoading && places.length > 0 ? (
        <div className="space-y-3.5">
          {places.map((place, index) => (
            <div key={place.id} style={{ animationDelay: `${index * 70}ms` }} className="lift-in">
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
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:pb-10">
      <header className="panel lift-in rounded-[1.5rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          <div>
            <p className="inline-flex rounded-full border border-[rgba(var(--line),0.92)] bg-[rgba(var(--teal-soft),0.52)] px-3 py-1 text-[0.67rem] font-extrabold uppercase tracking-[0.13em] text-[rgb(var(--teal))]">
              Mobile Food Tracker
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-[rgb(var(--ink-900))] sm:text-4xl">
              FoodSpot Ranker
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--ink-700))] sm:text-base">
              Save every place you try, score the dishes, and keep a clean ranking board that looks great on phones.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-xl border border-[rgba(var(--line),0.92)] bg-white px-3 py-2.5">
              <p className="text-[0.64rem] font-extrabold uppercase tracking-[0.1em] text-[rgb(var(--ink-500))]">Places</p>
              <p className="mt-1 text-xl font-black text-[rgb(var(--ink-900))]">{places.length}</p>
            </div>
            <div className="rounded-xl border border-[rgba(var(--line),0.92)] bg-white px-3 py-2.5">
              <p className="text-[0.64rem] font-extrabold uppercase tracking-[0.1em] text-[rgb(var(--ink-500))]">Reviews</p>
              <p className="mt-1 text-xl font-black text-[rgb(var(--ink-900))]">{totalReviews}</p>
            </div>
            <div className="rounded-xl border border-[rgba(var(--line),0.92)] bg-white px-3 py-2.5">
              <p className="text-[0.64rem] font-extrabold uppercase tracking-[0.1em] text-[rgb(var(--ink-500))]">Top Score</p>
              <p className="mt-1 text-xl font-black text-[rgb(var(--ink-900))]">{topScore === null ? "--" : topScore.toFixed(2)}</p>
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
            Add Place
          </button>
          <button
            type="button"
            className={`segment-item ${mobileView === "review" ? "segment-item-active" : ""}`}
            onClick={() => setMobileView("review")}
          >
            Add Review
          </button>
        </div>
      </div>

      <div className="mt-5 lg:hidden">
        {mobileView === "board" ? (
          <RankingBoardSection
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
        <RankingBoardSection
          places={places}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={error}
          highlightPlaceId={highlightPlaceId}
          onRefresh={() => loadPlaces("refresh")}
        />
      </div>

      <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-30 mx-auto flex w-full max-w-md px-4 lg:hidden">
        <div className="pointer-events-auto mx-auto grid w-full grid-cols-3 gap-2 rounded-2xl border border-[rgba(var(--line),0.92)] bg-white/95 p-2 shadow-[0_20px_32px_-18px_rgba(43,35,26,0.46)] backdrop-blur-sm">
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
