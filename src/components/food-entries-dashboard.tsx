"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiFailure, ApiSuccess, FoodEntry } from "@/lib/types";

type EntriesPayload = {
  entries: FoodEntry[];
};

type EntryCreatePayload = {
  entry: FoodEntry;
};

type FoodEntryDraft = {
  foodName: string;
  sourcePlace: string;
  saadRating: number;
  anasRating: number;
};

const PHOTO_ACCEPT_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

const initialDraft: FoodEntryDraft = {
  foodName: "",
  sourcePlace: "",
  saadRating: 4,
  anasRating: 4,
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

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function FoodEntriesDashboard() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [draft, setDraft] = useState<FoodEntryDraft>(initialDraft);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const averageOfAverages = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }

    const total = entries.reduce((sum, entry) => sum + entry.averageRating, 0);
    return Number((total / entries.length).toFixed(2));
  }, [entries]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  const loadEntries = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch("/api/food-entries", { cache: "no-store" });
      const payload = (await response.json()) as ApiSuccess<EntriesPayload> | ApiFailure;

      if (!response.ok || !payload.success) {
        throw new Error(getErrorMessage(payload.success ? undefined : payload, "Could not load food list."));
      }

      setEntries(payload.data.entries);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load food list.");
    } finally {
      if (mode === "initial") {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadEntries("initial");
  }, [loadEntries]);

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = photoFile
        ? await fetch("/api/food-entries", {
            method: "POST",
            body: (() => {
              const formData = new FormData();
              formData.set("foodName", draft.foodName);
              formData.set("sourcePlace", draft.sourcePlace);
              formData.set("saadRating", String(draft.saadRating));
              formData.set("anasRating", String(draft.anasRating));
              formData.set("photo", photoFile);
              return formData;
            })(),
          })
        : await fetch("/api/food-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(draft),
          });

      const payload = (await response.json()) as ApiSuccess<EntryCreatePayload> | ApiFailure;
      if (!response.ok || !payload.success) {
        throw new Error(getErrorMessage(payload.success ? undefined : payload, "Could not save food entry."));
      }

      setDraft(initialDraft);
      clearPhoto();
      setSuccessMessage("Food entry saved.");
      await loadEntries("refresh");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save food entry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <header className="hero-shell panel lift-in p-5 sm:p-6">
        <p className="inline-flex rounded-full border border-[rgba(var(--accent),0.28)] bg-[rgba(var(--surface-2),0.9)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--accent))]">
          Anas And Saad Space
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-[rgb(var(--ink-950))] sm:text-4xl">Food Rating Journal</h1>
        <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--ink-700))] sm:text-base">
          Add only what matters: photo, food name, where you got it, and ratings from Saad and Anas.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
          <div className="stat-tile">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Foods</p>
            <p className="mt-1 text-xl font-bold text-[rgb(var(--ink-950))]">{entries.length}</p>
          </div>
          <div className="stat-tile">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Saad Avg</p>
            <p className="mt-1 text-xl font-bold text-[rgb(var(--ink-950))]">
              {entries.length === 0 ? "--" : Number((entries.reduce((sum, item) => sum + item.saadRating, 0) / entries.length).toFixed(2))}
            </p>
          </div>
          <div className="stat-tile">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Overall</p>
            <p className="mt-1 text-xl font-bold text-[rgb(var(--ink-950))]">{averageOfAverages === null ? "--" : averageOfAverages}</p>
          </div>
        </div>
      </header>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(320px,390px)_1fr]">
        <section className="panel lift-in p-5">
          <p className="inline-flex rounded-full border border-[rgba(var(--teal),0.3)] bg-[rgba(var(--teal-soft),0.45)] px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--teal))]">
            New Food
          </p>
          <h2 className="mt-2 text-xl font-bold text-[rgb(var(--ink-950))]">Add One Entry</h2>

          <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
            <label className="app-label" htmlFor="food-name">
              Food Name
            </label>
            <input
              id="food-name"
              value={draft.foodName}
              onChange={(event) => setDraft((prev) => ({ ...prev, foodName: event.target.value }))}
              className="app-field"
              placeholder="Chicken Shawarma"
              maxLength={80}
              required
            />

            <label className="app-label" htmlFor="food-source-place">
              Where We Get It
            </label>
            <input
              id="food-source-place"
              value={draft.sourcePlace}
              onChange={(event) => setDraft((prev) => ({ ...prev, sourcePlace: event.target.value }))}
              className="app-field"
              placeholder="Downtown / Place name"
              maxLength={120}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="app-label" htmlFor="saad-rating">
                  Saad Rating
                </label>
                <select
                  id="saad-rating"
                  value={draft.saadRating}
                  onChange={(event) => setDraft((prev) => ({ ...prev, saadRating: Number(event.target.value) }))}
                  className="app-select mt-1"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="app-label" htmlFor="anas-rating">
                  Anas Rating
                </label>
                <select
                  id="anas-rating"
                  value={draft.anasRating}
                  onChange={(event) => setDraft((prev) => ({ ...prev, anasRating: Number(event.target.value) }))}
                  className="app-select mt-1"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="app-label" htmlFor="food-photo">
                Food Image
              </label>
              <input
                id="food-photo"
                type="file"
                accept={PHOTO_ACCEPT_TYPES}
                capture="environment"
                onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                className="app-field mt-1 file:mr-3 file:rounded-lg file:border-0 file:bg-[rgb(var(--surface-2))] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[rgb(var(--ink-700))]"
                disabled={isSubmitting}
              />
            </div>

            {photoPreviewUrl ? (
              <div className="rounded-lg border border-[rgba(var(--line),1)] bg-white p-2">
                <div
                  className="h-40 w-full rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url("${photoPreviewUrl}")` }}
                  role="img"
                  aria-label="Selected food preview"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="mt-2 rounded-lg border border-[rgba(var(--line),1)] bg-[rgb(var(--surface-2))] px-3 py-1.5 text-xs font-bold text-[rgb(var(--ink-700))]"
                  disabled={isSubmitting}
                >
                  Remove Image
                </button>
              </div>
            ) : null}

            {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
            {successMessage ? (
              <p className="rounded-lg border border-[rgba(var(--teal),0.28)] bg-[rgba(var(--teal-soft),0.65)] px-3 py-2 text-sm font-medium text-[rgb(var(--teal))]">
                {successMessage}
              </p>
            ) : null}

            <button type="submit" disabled={isSubmitting} className="app-btn app-btn-primary">
              {isSubmitting ? "Saving..." : "Save Food"}
            </button>
          </form>
        </section>

        <section className="panel lift-in p-4 sm:p-5" aria-live="polite">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Entries</p>
              <h2 className="text-xl font-bold text-[rgb(var(--ink-950))]">Food List</h2>
            </div>
            <button
              type="button"
              onClick={() => void loadEntries("refresh")}
              disabled={isRefreshing}
              className="rounded-lg border border-[rgba(var(--accent),0.28)] bg-[rgba(var(--surface-2),0.85)] px-3 py-2 text-sm font-semibold text-[rgb(var(--accent))] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-xl border border-[rgba(var(--line),0.95)] bg-white" />
              ))}
            </div>
          ) : null}

          {!isLoading && entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgba(var(--line),1)] bg-[rgb(var(--surface-2))] px-4 py-8 text-center">
              <p className="text-base font-semibold text-[rgb(var(--ink-950))]">No food entries yet</p>
              <p className="mt-1 text-sm text-[rgb(var(--ink-500))]">Add your first food now.</p>
            </div>
          ) : null}

          {!isLoading && entries.length > 0 ? (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li key={entry.id} className="panel overflow-hidden p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
                    <div
                      className="h-40 w-full bg-[rgb(var(--surface-2))] bg-cover bg-center sm:h-full"
                      style={entry.imageUrl ? { backgroundImage: `url("${entry.imageUrl}")` } : undefined}
                      role="img"
                      aria-label={entry.imageUrl ? `${entry.foodName} image` : "No food image"}
                    >
                      {!entry.imageUrl ? (
                        <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">
                          No Image
                        </div>
                      ) : null}
                    </div>
                    <div className="p-4">
                      <p className="text-lg font-bold text-[rgb(var(--ink-950))]">{entry.foodName}</p>
                      <p className="mt-1 text-sm text-[rgb(var(--ink-700))]">{entry.sourcePlace}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--ink-500))]">{formatDate(entry.createdAt)}</p>

                      <div className="mt-3 grid grid-cols-3 gap-2.5">
                        <div className="rounded-lg border border-[rgba(var(--line),1)] bg-[rgb(var(--surface-2))] px-2.5 py-2 text-center">
                          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Saad</p>
                          <p className="mt-1 text-lg font-bold text-[rgb(var(--ink-950))]">{entry.saadRating}</p>
                        </div>
                        <div className="rounded-lg border border-[rgba(var(--line),1)] bg-[rgb(var(--surface-2))] px-2.5 py-2 text-center">
                          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Anas</p>
                          <p className="mt-1 text-lg font-bold text-[rgb(var(--ink-950))]">{entry.anasRating}</p>
                        </div>
                        <div className="rounded-lg border border-[rgba(var(--accent),0.28)] bg-[rgba(var(--surface-2),0.95)] px-2.5 py-2 text-center">
                          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--accent))]">Average</p>
                          <p className="mt-1 text-lg font-bold text-[rgb(var(--accent))]">{entry.averageRating}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </section>
    </main>
  );
}
