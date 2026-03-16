import { describe, expect, it } from "vitest";
import { placeInputSchema, reviewInputSchema } from "@/lib/schemas";

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
});
