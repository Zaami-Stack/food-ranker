import { describe, expect, it } from "vitest";
import { foodEntryInputSchema, foodEntryRatingsUpdateSchema, placeInputSchema, reviewInputSchema } from "@/lib/schemas";

describe("placeInputSchema", () => {
  it("accepts valid place payloads", () => {
    const result = placeInputSchema.safeParse({
      name: "Taco Spot",
      location: "Main Street",
      cuisine: "Mexican",
      addedBy: "Vinsx",
    });

    expect(result.success).toBe(true);
  });

  it("rejects place names that are too short", () => {
    const result = placeInputSchema.safeParse({
      name: "A",
      location: "Main Street",
      cuisine: "Mexican",
      addedBy: "Vinsx",
    });

    expect(result.success).toBe(false);
  });
});

describe("reviewInputSchema", () => {
  it("coerces rating and accepts valid review payloads", () => {
    const result = reviewInputSchema.safeParse({
      placeId: "11111111-1111-4111-8111-111111111111",
      foodName: "Beef Ramen",
      rating: "5",
      comment: "Amazing flavor",
      imageUrl: "https://example.com/photo.jpg",
      reviewerName: "Friend",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rating).toBe(5);
    }
  });

  it("rejects ratings outside range", () => {
    const result = reviewInputSchema.safeParse({
      placeId: "11111111-1111-4111-8111-111111111111",
      foodName: "Beef Ramen",
      rating: 7,
      comment: "Too high",
      reviewerName: "Friend",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid image URLs", () => {
    const result = reviewInputSchema.safeParse({
      placeId: "11111111-1111-4111-8111-111111111111",
      foodName: "Beef Ramen",
      rating: 5,
      imageUrl: "not-a-url",
      reviewerName: "Friend",
    });

    expect(result.success).toBe(false);
  });
});

describe("foodEntryInputSchema", () => {
  it("accepts valid food entries", () => {
    const result = foodEntryInputSchema.safeParse({
      foodName: "Chicken Shawarma",
      sourcePlace: "Old Town",
      imageUrl: "https://example.com/food.jpg",
      saadRating: "4",
      anasRating: 5,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.saadRating).toBe(4);
    }
  });

  it("rejects ratings outside range", () => {
    const result = foodEntryInputSchema.safeParse({
      foodName: "Chicken Shawarma",
      sourcePlace: "Old Town",
      saadRating: 0,
      anasRating: 6,
    });

    expect(result.success).toBe(false);
  });
});

describe("foodEntryRatingsUpdateSchema", () => {
  it("accepts partial updates", () => {
    const result = foodEntryRatingsUpdateSchema.safeParse({
      saadRating: 5,
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty updates", () => {
    const result = foodEntryRatingsUpdateSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
