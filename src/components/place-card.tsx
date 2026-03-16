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
    return "border-amber-300 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-900";
  }
  if (position === 2) {
    return "border-slate-300 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-900";
  }
  if (position === 3) {
    return "border-orange-300 bg-gradient-to-br from-orange-100 to-orange-50 text-orange-900";
  }
  return "border-[rgba(var(--line),1)] bg-gradient-to-br from-white to-[rgb(var(--surface-2))] text-[rgb(var(--ink-700))]";
}

export function PlaceCard({ place, position, highlighted = false }: PlaceCardProps) {
  return (
    <article
      className={[
        "panel relative overflow-hidden p-4",
        highlighted ? "border-[rgba(var(--accent),0.75)] ring-2 ring-[rgba(var(--accent),0.2)]" : "border-[rgba(var(--line),1)]",
      ].join(" ")}
    >
      <div className="mb-3 h-1.5 w-28 rounded-full bg-gradient-to-r from-[rgb(var(--accent))] via-[rgb(var(--accent-strong))] to-[rgb(var(--teal))]" />
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
          <h3 className="truncate text-[1.02rem] font-bold leading-tight text-[rgb(var(--ink-950))] sm:text-[1.08rem]">{place.name}</h3>
          <p className="mt-1 text-sm text-[rgb(var(--ink-700))]">{place.location}</p>
          <p className="mt-1 text-xs text-[rgb(var(--ink-500))]">
            {place.cuisine ? `${place.cuisine} | ` : ""}
            Added by {place.addedBy}
          </p>
        </div>

        <div className="min-w-[112px] rounded-lg border border-[rgba(var(--line),1)] bg-gradient-to-br from-white to-[rgb(var(--surface-2))] px-3 py-2">
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-700))]">Score</p>
          <p className="mt-1 text-sm font-bold text-[rgb(var(--ink-950))]">{formatScore(place.averageRating)}</p>
          <p className="text-[0.67rem] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-500))]">{place.reviewCount} reviews</p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(var(--line),0.55)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--teal))]"
          style={{ width: getProgress(place.averageRating) }}
        />
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[rgb(var(--ink-700))]">Recent Comments</h4>
        {place.latestReviews.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-[rgba(var(--line),1)] bg-[rgb(var(--surface-2))] px-3 py-3 text-sm text-[rgb(var(--ink-500))]">
            No comments yet for this place.
          </p>
        ) : (
          <ul className="mt-2.5 space-y-2">
            {place.latestReviews.map((review) => (
              <li
                key={review.id}
                className="rounded-lg border border-[rgba(var(--line),0.95)] bg-white/95 px-3 py-2.5 text-sm"
              >
                <p className="font-semibold text-[rgb(var(--ink-950))]">
                  {review.foodName}{" "}
                  <span className="ml-1 rounded-full bg-[rgba(var(--teal),0.14)] px-2 py-0.5 font-mono text-[0.68rem] font-bold text-[rgb(var(--teal))]">
                    {review.rating}/5
                  </span>
                </p>
                {review.imageUrl ? (
                  <a
                    href={review.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block overflow-hidden rounded-lg border border-[rgba(var(--line),1)]"
                  >
                    <div
                      className="h-32 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${review.imageUrl}")` }}
                      role="img"
                      aria-label={`${review.foodName} photo`}
                    />
                  </a>
                ) : null}
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
