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

function getRankStyle(position: number) {
  if (position === 1) {
    return "bg-gradient-to-br from-amber-200 to-amber-100 text-amber-900 border-amber-300";
  }
  if (position === 2) {
    return "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 border-slate-300";
  }
  if (position === 3) {
    return "bg-gradient-to-br from-orange-200 to-orange-100 text-orange-900 border-orange-300";
  }
  return "bg-white text-[rgb(var(--ink-700))] border-[rgba(var(--line),0.9)]";
}

function getScoreFill(score: number | null) {
  if (score === null) {
    return "0%";
  }
  return `${Math.min(100, Math.max(0, (score / 5) * 100))}%`;
}

function renderRatingLabel(score: number | null) {
  if (score === null) {
    return "Pending";
  }
  if (score >= 4.7) {
    return "Elite";
  }
  if (score >= 4.2) {
    return "Great";
  }
  if (score >= 3.5) {
    return "Good";
  }
  return "Average";
}

export function PlaceCard({ place, position, highlighted = false }: PlaceCardProps) {
  return (
    <article
      className={[
        "rounded-[1.2rem] border p-4 transition duration-200",
        highlighted
          ? "border-[rgba(var(--accent),0.5)] bg-[rgba(255,243,234,0.9)] shadow-[0_0_0_4px_rgba(222,93,47,0.16)]"
          : "border-[rgba(var(--line),0.9)] bg-white/90",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className={[
              "mb-2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border px-2.5 text-[0.72rem] font-extrabold tracking-[0.08em]",
              getRankStyle(position),
            ].join(" ")}
          >
            #{position}
          </div>
          <h3 className="text-[1.05rem] font-extrabold leading-tight text-[rgb(var(--ink-900))] sm:text-[1.15rem]">{place.name}</h3>
          <p className="mt-1 text-sm text-[rgb(var(--ink-700))]">{place.location}</p>
          <p className="mt-1 text-xs text-[rgb(var(--ink-500))]">
            {place.cuisine ? `${place.cuisine} | ` : ""}
            Added by {place.addedBy}
          </p>
        </div>
        <div className="min-w-[108px] rounded-xl border border-[rgba(var(--line),0.9)] bg-[rgb(var(--surface-2))] px-3 py-2">
          <p className="text-[0.64rem] font-extrabold uppercase tracking-[0.11em] text-[rgb(var(--ink-700))]">Score</p>
          <p className="mt-1 text-sm font-extrabold text-[rgb(var(--ink-900))]">{formatScore(place.averageRating)}</p>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">{renderRatingLabel(place.averageRating)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[rgb(var(--ink-700))]">Recent Comments</h4>
          <p className="text-xs font-semibold text-[rgb(var(--ink-500))]">{place.reviewCount} total reviews</p>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(var(--line),0.35)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--teal))]"
            style={{ width: getScoreFill(place.averageRating) }}
          />
        </div>

        {place.latestReviews.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-[rgba(var(--line),0.95)] bg-white px-3 py-3 text-sm text-[rgb(var(--ink-500))]">
            No comments yet for this place.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {place.latestReviews.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-[rgba(var(--line),0.75)] bg-white px-3 py-2.5 text-sm shadow-[0_12px_24px_-22px_rgba(35,30,24,0.85)]"
              >
                <p className="font-semibold text-[rgb(var(--ink-900))]">
                  {review.foodName}{" "}
                  <span className="ml-1 rounded-full bg-[rgb(var(--teal-soft))] px-2 py-0.5 font-mono text-[0.68rem] font-bold text-[rgb(var(--teal))]">
                    {review.rating}/5
                  </span>
                </p>
                <p className="mt-1.5 text-[rgb(var(--ink-700))]">{review.comment || "No text comment provided."}</p>
                <p className="mt-1.5 text-xs font-semibold text-[rgb(var(--ink-500))]">by {review.reviewerName}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
