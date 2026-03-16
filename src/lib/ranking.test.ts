import { describe, expect, it } from "vitest";
import { getAverageRating, sortPlacesForRanking } from "@/lib/ranking";
import type { PlaceWithStats } from "@/lib/types";

describe("getAverageRating", () => {
  it("returns null for empty reviews", () => {
    expect(getAverageRating([])).toBeNull();
  });

  it("returns rounded average", () => {
    const score = getAverageRating([
      {
        id: "1",
        placeId: "p1",
        foodName: "Burger",
        rating: 5,
        comment: null,
        reviewerName: "A",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        placeId: "p1",
        foodName: "Fries",
        rating: 4,
        comment: null,
        reviewerName: "B",
        createdAt: new Date().toISOString(),
      },
    ]);

    expect(score).toBe(4.5);
  });
});

describe("sortPlacesForRanking", () => {
  it("sorts by average rating then review count", () => {
    const places: PlaceWithStats[] = [
      {
        id: "p1",
        name: "Alpha",
        location: "One",
        cuisine: null,
        addedBy: "V",
        createdAt: "2026-03-01T12:00:00.000Z",
        averageRating: 4.5,
        reviewCount: 2,
        latestReviews: [],
      },
      {
        id: "p2",
        name: "Beta",
        location: "Two",
        cuisine: null,
        addedBy: "V",
        createdAt: "2026-03-01T12:00:00.000Z",
        averageRating: 4.8,
        reviewCount: 1,
        latestReviews: [],
      },
      {
        id: "p3",
        name: "Gamma",
        location: "Three",
        cuisine: null,
        addedBy: "V",
        createdAt: "2026-03-01T12:00:00.000Z",
        averageRating: 4.5,
        reviewCount: 5,
        latestReviews: [],
      },
    ];

    const sorted = sortPlacesForRanking(places);
    expect(sorted.map((place) => place.id)).toEqual(["p2", "p3", "p1"]);
  });
});
