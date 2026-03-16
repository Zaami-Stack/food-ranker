import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { updateFoodEntryRatingsMock, MockRepositoryError } = vi.hoisted(() => {
  class MockRepositoryError extends Error {
    code: "PLACE_EXISTS" | "PLACE_NOT_FOUND" | "FOOD_ENTRY_NOT_FOUND" | "DB_READ_FAILED" | "DB_WRITE_FAILED";
    status: number;

    constructor(
      message: string,
      code: "PLACE_EXISTS" | "PLACE_NOT_FOUND" | "FOOD_ENTRY_NOT_FOUND" | "DB_READ_FAILED" | "DB_WRITE_FAILED",
      status: number,
    ) {
      super(message);
      this.code = code;
      this.status = status;
    }
  }

  return {
    updateFoodEntryRatingsMock: vi.fn(),
    MockRepositoryError,
  };
});

vi.mock("@/lib/repository", () => ({
  updateFoodEntryRatings: updateFoodEntryRatingsMock,
  RepositoryError: MockRepositoryError,
}));

import { PATCH } from "@/app/api/food-entries/[entryId]/route";

describe("/api/food-entries/[entryId] route", () => {
  beforeEach(() => {
    updateFoodEntryRatingsMock.mockReset();
  });

  it("validates payload on PATCH", async () => {
    const request = new NextRequest("http://localhost/api/food-entries/11111111-1111-4111-8111-111111111111", {
      method: "PATCH",
      body: JSON.stringify({ saadRating: 0 }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(request, {
      params: { entryId: "11111111-1111-4111-8111-111111111111" },
    });

    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(updateFoodEntryRatingsMock).not.toHaveBeenCalled();
  });

  it("updates ratings on PATCH", async () => {
    updateFoodEntryRatingsMock.mockResolvedValue({
      id: "f1",
      foodName: "Burger",
      sourcePlace: "Burger Box",
      imageUrl: null,
      saadRating: 5,
      anasRating: 4,
      averageRating: 4.5,
      createdAt: "2026-03-16T00:00:00.000Z",
    });

    const request = new NextRequest("http://localhost/api/food-entries/11111111-1111-4111-8111-111111111111", {
      method: "PATCH",
      body: JSON.stringify({ saadRating: 5, anasRating: 4 }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(request, {
      params: { entryId: "11111111-1111-4111-8111-111111111111" },
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateFoodEntryRatingsMock).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", {
      saadRating: 5,
      anasRating: 4,
    });
  });
});
