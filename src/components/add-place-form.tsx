"use client";

import { useState } from "react";
import type { ApiFailure, ApiSuccess, PlaceWithStats } from "@/lib/types";

type PlaceCreatePayload = {
  place: PlaceWithStats;
};

type AddPlaceFormProps = {
  onCreated: (place: PlaceWithStats) => void | Promise<void>;
};

type PlaceDraft = {
  name: string;
  location: string;
  cuisine: string;
  addedBy: string;
};

const initialDraft: PlaceDraft = {
  name: "",
  location: "",
  cuisine: "",
  addedBy: "",
};

function readFailureMessage(payload: ApiFailure | undefined, fallback: string) {
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

export function AddPlaceForm({ onCreated }: AddPlaceFormProps) {
  const [draft, setDraft] = useState<PlaceDraft>(initialDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json()) as ApiSuccess<PlaceCreatePayload> | ApiFailure;
      if (!response.ok || !payload.success) {
        const message = readFailureMessage(payload.success ? undefined : payload, "Could not add place.");
        throw new Error(message);
      }

      await onCreated(payload.data.place);
      setDraft(initialDraft);
      setSuccessMessage("Place added to the board.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not add place.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel lift-in rounded-[1.35rem] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full border border-[rgba(var(--line),0.9)] bg-[rgb(var(--surface-2))] px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-[rgb(var(--ink-700))]">
            Add Place
          </p>
          <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[rgb(var(--ink-900))]">Save A New Food Spot</h2>
        </div>
      </div>
      <p className="mt-2 text-sm text-[rgb(var(--ink-500))]">Drop the exact place where you ate so your ranking board keeps growing.</p>

      <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
        <label className="app-label" htmlFor="place-name">
          Place Name
        </label>
        <input
          id="place-name"
          value={draft.name}
          onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
          className="app-field"
          maxLength={80}
          required
          placeholder="Casa Tacos, Grill Hub, etc."
        />

        <label className="app-label" htmlFor="place-location">
          Location
        </label>
        <input
          id="place-location"
          value={draft.location}
          onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
          className="app-field"
          maxLength={120}
          required
          placeholder="District, landmark, or map pin area"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="app-label" htmlFor="place-cuisine">
              Cuisine (Optional)
            </label>
            <input
              id="place-cuisine"
              value={draft.cuisine}
              onChange={(event) => setDraft((prev) => ({ ...prev, cuisine: event.target.value }))}
              className="app-field mt-1"
              maxLength={50}
              placeholder="Mexican, Asian, Burgers"
            />
          </div>

          <div>
            <label className="app-label" htmlFor="place-added-by">
              Your Name
            </label>
            <input
              id="place-added-by"
              value={draft.addedBy}
              onChange={(event) => setDraft((prev) => ({ ...prev, addedBy: event.target.value }))}
              className="app-field mt-1"
              maxLength={40}
              required
              placeholder="Your name"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
        ) : null}
        {successMessage ? (
          <p className="rounded-xl border border-[rgba(var(--teal),0.25)] bg-[rgba(var(--teal-soft),0.55)] px-3 py-2 text-sm font-medium text-[rgb(var(--teal))]">
            {successMessage}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="app-btn app-btn-primary">
          {isSubmitting ? "Adding place..." : "Add Place"}
        </button>
      </form>
    </section>
  );
}
