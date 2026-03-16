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
    <section className="panel fade-up rounded-2xl p-5 shadow-soft">
      <h2 className="text-lg font-bold text-stone-900">Add New Place</h2>
      <p className="mt-1 text-sm text-stone-600">Save a restaurant or street food stop that you both want to track.</p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-stone-800" htmlFor="place-name">
          Place Name
        </label>
        <input
          id="place-name"
          value={draft.name}
          onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
          className="w-full rounded-lg border border-[rgb(var(--brand-border))] bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-orange-100"
          maxLength={80}
          required
          placeholder="Casa Tacos"
        />

        <label className="block text-sm font-medium text-stone-800" htmlFor="place-location">
          Location
        </label>
        <input
          id="place-location"
          value={draft.location}
          onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
          className="w-full rounded-lg border border-[rgb(var(--brand-border))] bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-orange-100"
          maxLength={120}
          required
          placeholder="Downtown, near the train station"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-stone-800" htmlFor="place-cuisine">
              Cuisine (Optional)
            </label>
            <input
              id="place-cuisine"
              value={draft.cuisine}
              onChange={(event) => setDraft((prev) => ({ ...prev, cuisine: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--brand-border))] bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-orange-100"
              maxLength={50}
              placeholder="Mexican"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-800" htmlFor="place-added-by">
              Your Name
            </label>
            <input
              id="place-added-by"
              value={draft.addedBy}
              onChange={(event) => setDraft((prev) => ({ ...prev, addedBy: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--brand-border))] bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-orange-100"
              maxLength={40}
              required
              placeholder="Vinsx"
            />
          </div>
        </div>

        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {successMessage ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[rgb(var(--brand-accent))] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Adding place..." : "Add Place"}
        </button>
      </form>
    </section>
  );
}
