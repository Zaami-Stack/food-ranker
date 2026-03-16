import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { listFoodEntriesMock, createFoodEntryMock, uploadReviewPhotoMock, MockRepositoryError } = vi.hoisted(() => {
  class MockRepositoryError extends Error {
    code: "PLACE_EXISTS" | "PLACE_NOT_FOUND" | "DB_READ_FAILED" | "DB_WRITE_FAILED";
    status: number;

    constructor(
      message: string,
      code: "PLACE_EXISTS" | "PLACE_NOT_FOUND" | "DB_READ_FAILED" | "DB_WRITE_FAILED",
      status: number,
    ) {
      super(message);
      this.code = code;
      this.status = status;
    }
  }

  return {
    listFoodEntriesMock: vi.fn(),
    createFoodEntryMock: vi.fn(),
    uploadReviewPhotoMock: vi.fn(),
    MockRepositoryError,
  };
});

vi.mock("@/lib/repository", () => ({
  listFoodEntries: listFoodEntriesMock,
  createFoodEntry: createFoodEntryMock,
  RepositoryError: MockRepositoryError,
}));

vi.mock("@/lib/review-photo", () => ({
  uploadReviewPhoto: uploadReviewPhotoMock,
  ReviewPhotoError: class MockReviewPhotoError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

import { GET, POST } from "@/app/api/food-entries/route";

describe("/api/food-entries route", () => {
  beforeEach(() => {
    listFoodEntriesMock.mockReset();
    createFoodEntryMock.mockReset();
    uploadReviewPhotoMock.mockReset();
  });

  it("returns entries on GET", async () => {
    listFoodEntriesMock.mockResolvedValue([
      {
        id: "f1",
        foodName: "Chicken Shawarma",
        sourcePlace: "Main Street",
        imageUrl: null,
        saadRating: 4,
        anasRating: 5,
        averageRating: 4.5,
        createdAt: "2026-03-16T00:00:00.000Z",
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.entries).toHaveLength(1);
  });

  it("validates payload on POST", async () => {
    const request = new NextRequest("http://localhost/api/food-entries", {
      method: "POST",
      body: JSON.stringify({
        foodName: "x",
        sourcePlace: "y",
        saadRating: 10,
        anasRating: 1,
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(createFoodEntryMock).not.toHaveBeenCalled();
  });

  it("creates entry from multipart payload with photo", async () => {
    uploadReviewPhotoMock.mockResolvedValue("https://example.com/food.jpg");
    createFoodEntryMock.mockResolvedValue({
      id: "f2",
      foodName: "Beef Burger",
      sourcePlace: "Burger Box",
      imageUrl: "https://example.com/food.jpg",
      saadRating: 5,
      anasRating: 4,
      averageRating: 4.5,
      createdAt: "2026-03-16T00:00:00.000Z",
    });

    const formData = new FormData();
    formData.set("foodName", "Beef Burger");
    formData.set("sourcePlace", "Burger Box");
    formData.set("saadRating", "5");
    formData.set("anasRating", "4");
    formData.set("photo", new File([Uint8Array.from([1, 2, 3])], "burger.jpg", { type: "image/jpeg" }));

    const request = new NextRequest("http://localhost/api/food-entries", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(uploadReviewPhotoMock).toHaveBeenCalledTimes(1);
    expect(createFoodEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://example.com/food.jpg",
      }),
    );
  });
});
