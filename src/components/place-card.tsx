import type { PlaceWithStats } from "@/lib/types";

type PlaceCardProps = {
  place: PlaceWithStats;
  position: number;
  highlighted?: boolean;
};

function formatScore(score: number | null) {
  if (score === null) {
    return "No ratings yet";
  }

  return `${score.toFixed(2)} / 5`;
}

function renderStars(rating: number) {
  return `${"*".repeat(rating)}${"-".repeat(5 - rating)}`;
}

export function PlaceCard({ place, position, highlighted = false }: PlaceCardProps) {
  return (
    <article
      className={[
        "rounded-xl border p-4 transition",
        highlighted
          ? "border-orange-300 bg-orange-50/70 shadow-[0_0_0_3px_rgba(251,146,60,0.18)]"
          : "border-[rgb(var(--brand-border))] bg-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Rank #{position}</p>
          <h3 className="text-xl font-bold text-stone-900">{place.name}</h3>
          <p className="mt-1 text-sm text-stone-700">{place.location}</p>
          <p className="mt-1 text-xs text-stone-500">
            {place.cuisine ? `${place.cuisine} | ` : ""}
            Added by {place.addedBy}
          </p>
        </div>
        <div className="rounded-lg border border-[rgb(var(--brand-border))] bg-amber-50 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.08em] text-amber-800">Score</p>
          <p className="text-sm font-bold text-amber-950">{formatScore(place.averageRating)}</p>
          <p className="text-xs text-amber-900">{place.reviewCount} reviews</p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-stone-800">Recent Comments</h4>
        {place.latestReviews.length === 0 ? (
          <p className="mt-1 text-sm text-stone-600">No comments yet for this place.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {place.latestReviews.map((review) => (
              <li key={review.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
                <p className="font-semibold text-stone-900">
                  {review.foodName} <span className="font-mono text-xs text-stone-600">{renderStars(review.rating)}</span>
                </p>
                <p className="mt-1 text-stone-700">{review.comment || "No text comment provided."}</p>
                <p className="mt-1 text-xs text-stone-500">by {review.reviewerName}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
