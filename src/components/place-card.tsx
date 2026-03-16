import type { PlaceWithStats } from "@/lib/types";

type PlaceCardProps = {
  place: PlaceWithStats;
  position: number;
  highlighted?: boolean;
};

function formatScore(score: number | null) {
  if (score === null) {
    return "No ratings";
  }
  return `${score.toFixed(2)} / 5`;
}

function getProgress(score: number | null) {
  if (score === null) {
    return "0%";
  }
  return `${Math.max(0, Math.min(100, (score / 5) * 100))}%`;
}

function getRankTone(position: number) {
  if (position === 1) {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }
  if (position === 2) {
    return "border-slate-300 bg-slate-50 text-slate-900";
  }
  if (position === 3) {
    return "border-orange-300 bg-orange-50 text-orange-900";
  }
  return "border-[rgba(var(--line),0.95)] bg-white text-[rgb(var(--ink-700))]";
}

export function PlaceCard({ place, position, highlighted = false }: PlaceCardProps) {
  return (
    <article
      className={[
        "panel card-3d rounded-[1.2rem] border p-4 sm:p-4.5",
        highlighted ? "border-[rgba(var(--accent),0.55)]" : "border-[rgba(var(--line),0.9)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={[
              "mb-2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border px-2.5 text-[0.72rem] font-extrabold tracking-[0.08em]",
              getRankTone(position),
            ].join(" ")}
          >
            #{position}
          </div>
          <h3 className="truncate text-[1.06rem] font-extrabold leading-tight text-[rgb(var(--ink-950))] sm:text-[1.14rem]">{place.name}</h3>
          <p className="mt-1 text-sm text-[rgb(var(--ink-700))]">{place.location}</p>
          <p className="mt-1 text-xs text-[rgb(var(--ink-500))]">
            {place.cuisine ? `${place.cuisine} | ` : ""}
            Added by {place.addedBy}
          </p>
        </div>

        <div className="min-w-[110px] rounded-xl border border-[rgba(var(--line),0.95)] bg-[rgb(var(--surface-2))] px-3 py-2">
          <p className="text-[0.64rem] font-extrabold uppercase tracking-[0.1em] text-[rgb(var(--ink-700))]">Score</p>
          <p className="mt-1 text-sm font-extrabold text-[rgb(var(--ink-950))]">{formatScore(place.averageRating)}</p>
          <p className="text-[0.67rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">{place.reviewCount} reviews</p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(var(--line),0.4)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--accent))] via-[rgb(var(--accent-strong))] to-[rgb(var(--teal))]"
          style={{ width: getProgress(place.averageRating) }}
        />
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[rgb(var(--ink-700))]">Recent Comments</h4>
        {place.latestReviews.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-[rgba(var(--line),0.95)] bg-white px-3 py-3 text-sm text-[rgb(var(--ink-500))]">
            No comments yet for this place.
          </p>
        ) : (
          <ul className="mt-2.5 space-y-2.5">
            {place.latestReviews.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-[rgba(var(--line),0.8)] bg-white px-3 py-2.5 text-sm shadow-[0_14px_26px_-24px_rgba(30,64,175,0.8)]"
              >
                <p className="font-semibold text-[rgb(var(--ink-950))]">
                  {review.foodName}{" "}
                  <span className="ml-1 rounded-full bg-[rgba(var(--teal),0.12)] px-2 py-0.5 font-mono text-[0.68rem] font-bold text-[rgb(var(--teal))]">
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
