import type { PlaceWithStats, Review } from "@/lib/types";

export function getAverageRating(reviews: Review[]) {
  if (reviews.length === 0) {
    return null;
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Number((total / reviews.length).toFixed(2));
}

export function sortPlacesForRanking(places: PlaceWithStats[]) {
  return [...places].sort((a, b) => {
    const aScore = a.averageRating ?? -1;
    const bScore = b.averageRating ?? -1;

    if (bScore !== aScore) {
      return bScore - aScore;
    }

    if (b.reviewCount !== a.reviewCount) {
      return b.reviewCount - a.reviewCount;
    }

    const byRecency = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (byRecency !== 0) {
      return byRecency;
    }

    return a.name.localeCompare(b.name);
  });
}
