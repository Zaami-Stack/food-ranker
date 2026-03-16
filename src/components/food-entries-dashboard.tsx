"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiFailure, ApiSuccess, FoodEntry } from "@/lib/types";

type EntriesPayload = {
  entries: FoodEntry[];
};

type EntryCreatePayload = {
  entry: FoodEntry;
};

type EntryUpdatePayload = {
  entry: FoodEntry;
};

type FoodEntryDraft = {
  foodName: string;
  sourcePlace: string;
  saadRating: number;
  anasRating: number;
};

type RatingDraft = {
  saadRating: number;
  anasRating: number;
};

type RatingPickerProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  idPrefix: string;
  disabled?: boolean;
  compact?: boolean;
};

const PHOTO_ACCEPT_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";
const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

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

function RatingPicker({ label, value, onChange, idPrefix, disabled = false, compact = false }: RatingPickerProps) {
  return (
    <div>
      <p className="app-label">{label}</p>
      <div className={`mt-2 flex ${compact ? "gap-1.5" : "gap-2"}`} role="group" aria-label={label}>
        {RATING_OPTIONS.map((rating) => {
          const selected = value === rating;
          return (
            <button
              key={`${idPrefix}-${rating}`}
              type="button"
              onClick={() => onChange(rating)}
              disabled={disabled}
              className={[
                "rounded-lg border font-bold transition",
                compact ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm",
                selected
                  ? "border-[rgba(var(--accent),0.75)] bg-[rgba(var(--accent),0.2)] text-[rgb(var(--ink-950))]"
                  : "border-[rgba(var(--line),0.72)] bg-[rgba(var(--surface-1),0.75)] text-[rgb(var(--ink-700))] hover:border-[rgba(var(--accent),0.45)]",
                disabled ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
              aria-pressed={selected}
            >
              {rating}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FoodEntriesDashboard() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [draft, setDraft] = useState<FoodEntryDraft>(initialDraft);
  const [ratingDraftByEntryId, setRatingDraftByEntryId] = useState<Record<string, RatingDraft>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [entryErrorById, setEntryErrorById] = useState<Record<string, string>>({});
  const [entrySuccessById, setEntrySuccessById] = useState<Record<string, string>>({});

  const saadAverage = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }

    const total = entries.reduce((sum, entry) => sum + entry.saadRating, 0);
    return Number((total / entries.length).toFixed(2));
  }, [entries]);

  const anasAverage = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }

    const total = entries.reduce((sum, entry) => sum + entry.anasRating, 0);
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

  useEffect(() => {
    const nextDrafts: Record<string, RatingDraft> = {};
    for (const entry of entries) {
      nextDrafts[entry.id] = {
        saadRating: entry.saadRating,
        anasRating: entry.anasRating,
      };
    }
    setRatingDraftByEntryId(nextDrafts);
  }, [entries]);

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

  async function handleSaveEntryRatings(entryId: string) {
    const draftRatings = ratingDraftByEntryId[entryId];
    if (!draftRatings) {
      return;
    }

    setSavingEntryId(entryId);
    setEntryErrorById((prev) => ({ ...prev, [entryId]: "" }));
    setEntrySuccessById((prev) => ({ ...prev, [entryId]: "" }));

    try {
      const response = await fetch(`/api/food-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftRatings),
      });

      const payload = (await response.json()) as ApiSuccess<EntryUpdatePayload> | ApiFailure;
      if (!response.ok || !payload.success) {
        throw new Error(getErrorMessage(payload.success ? undefined : payload, "Could not update ratings."));
      }

      setEntries((prev) => prev.map((entry) => (entry.id === entryId ? payload.data.entry : entry)));
      setEntrySuccessById((prev) => ({ ...prev, [entryId]: "Ratings updated." }));
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Could not update ratings.";
      setEntryErrorById((prev) => ({ ...prev, [entryId]: message }));
    } finally {
      setSavingEntryId(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <header className="hero-shell panel lift-in p-5 sm:p-6">
        <p className="inline-flex rounded-full border border-[rgba(var(--accent),0.5)] bg-[rgba(var(--surface-2),0.85)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--accent))]">
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
            <p className="mt-1 text-xl font-bold text-[rgb(var(--ink-950))]">{saadAverage === null ? "--" : saadAverage}</p>
          </div>
          <div className="stat-tile">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">Anas Avg</p>
            <p className="mt-1 text-xl font-bold text-[rgb(var(--ink-950))]">{anasAverage === null ? "--" : anasAverage}</p>
          </div>
        </div>
      </header>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(320px,390px)_1fr]">
        <section className="panel lift-in p-5">
          <p className="inline-flex rounded-full border border-[rgba(var(--teal),0.45)] bg-[rgba(var(--teal-soft),0.38)] px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--teal))]">
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RatingPicker
                label="Saad Rating"
                value={draft.saadRating}
                onChange={(rating) => setDraft((prev) => ({ ...prev, saadRating: rating }))}
                idPrefix="create-saad"
                disabled={isSubmitting}
              />
              <RatingPicker
                label="Anas Rating"
                value={draft.anasRating}
                onChange={(rating) => setDraft((prev) => ({ ...prev, anasRating: rating }))}
                idPrefix="create-anas"
                disabled={isSubmitting}
              />
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
              <div className="rounded-lg border border-[rgba(var(--line),0.75)] bg-[rgba(var(--surface-2),0.6)] p-2">
                <div
                  className="h-40 w-full rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url("${photoPreviewUrl}")` }}
                  role="img"
                  aria-label="Selected food preview"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="mt-2 rounded-lg border border-[rgba(var(--line),0.75)] bg-[rgba(var(--surface-1),0.75)] px-3 py-1.5 text-xs font-bold text-[rgb(var(--ink-700))]"
                  disabled={isSubmitting}
                >
                  Remove Image
                </button>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-[rgba(248,113,113,0.6)] bg-[rgba(127,29,29,0.35)] px-3 py-2 text-sm font-medium text-red-200">
                {error}
              </p>
            ) : null}
            {successMessage ? (
              <p className="rounded-lg border border-[rgba(var(--teal),0.45)] bg-[rgba(var(--teal-soft),0.42)] px-3 py-2 text-sm font-medium text-[rgb(var(--teal))]">
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
              className="rounded-lg border border-[rgba(var(--accent),0.45)] bg-[rgba(var(--surface-2),0.72)] px-3 py-2 text-sm font-semibold text-[rgb(var(--accent))] transition hover:bg-[rgba(var(--surface-2),0.95)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-52 animate-pulse rounded-xl border border-[rgba(var(--line),0.65)] bg-[rgba(var(--surface-2),0.65)]" />
              ))}
            </div>
          ) : null}

          {!isLoading && entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgba(var(--line),0.72)] bg-[rgba(var(--surface-2),0.65)] px-4 py-8 text-center">
              <p className="text-base font-semibold text-[rgb(var(--ink-950))]">No food entries yet</p>
              <p className="mt-1 text-sm text-[rgb(var(--ink-500))]">Add your first food now.</p>
            </div>
          ) : null}

          {!isLoading && entries.length > 0 ? (
            <ul className="space-y-3">
              {entries.map((entry) => {
                const ratingDraft = ratingDraftByEntryId[entry.id] ?? {
                  saadRating: entry.saadRating,
                  anasRating: entry.anasRating,
                };
                const hasChanges = ratingDraft.saadRating !== entry.saadRating || ratingDraft.anasRating !== entry.anasRating;
                const isSavingCurrent = savingEntryId === entry.id;

                return (
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
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-bold text-[rgb(var(--ink-950))]">{entry.foodName}</p>
                            <p className="mt-1 text-sm text-[rgb(var(--ink-700))]">{entry.sourcePlace}</p>
                            <p className="mt-1 text-xs text-[rgb(var(--ink-500))]">{formatDate(entry.createdAt)}</p>
                          </div>
                          <div className="rounded-lg border border-[rgba(var(--accent),0.45)] bg-[rgba(var(--surface-2),0.82)] px-3 py-2 text-center">
                            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--accent))]">Average</p>
                            <p className="mt-1 text-lg font-bold text-[rgb(var(--accent))]">{entry.averageRating}</p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <RatingPicker
                            label="Saad Rating"
                            value={ratingDraft.saadRating}
                            onChange={(rating) =>
                              setRatingDraftByEntryId((prev) => ({
                                ...prev,
                                [entry.id]: {
                                  ...ratingDraft,
                                  saadRating: rating,
                                },
                              }))
                            }
                            idPrefix={`entry-${entry.id}-saad`}
                            disabled={isSavingCurrent}
                            compact
                          />
                          <RatingPicker
                            label="Anas Rating"
                            value={ratingDraft.anasRating}
                            onChange={(rating) =>
                              setRatingDraftByEntryId((prev) => ({
                                ...prev,
                                [entry.id]: {
                                  ...ratingDraft,
                                  anasRating: rating,
                                },
                              }))
                            }
                            idPrefix={`entry-${entry.id}-anas`}
                            disabled={isSavingCurrent}
                            compact
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => void handleSaveEntryRatings(entry.id)}
                            disabled={isSavingCurrent || !hasChanges}
                            className="rounded-lg border border-[rgba(var(--accent),0.5)] bg-[rgba(var(--surface-2),0.76)] px-3 py-2 text-sm font-semibold text-[rgb(var(--accent))] transition hover:bg-[rgba(var(--surface-2),0.95)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSavingCurrent ? "Saving..." : "Save Ratings"}
                          </button>
                          {entrySuccessById[entry.id] ? (
                            <span className="text-xs font-semibold text-[rgb(var(--teal))]">{entrySuccessById[entry.id]}</span>
                          ) : null}
                          {entryErrorById[entry.id] ? (
                            <span className="text-xs font-semibold text-red-300">{entryErrorById[entry.id]}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      </section>
    </main>
  );
}
