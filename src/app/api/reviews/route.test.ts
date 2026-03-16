import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createReviewMock, uploadReviewPhotoMock, MockRepositoryError } = vi.hoisted(() => {
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
    createReviewMock: vi.fn(),
    uploadReviewPhotoMock: vi.fn(),
    MockRepositoryError,
  };
});

vi.mock("@/lib/repository", () => ({
  createReview: createReviewMock,
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

import { POST } from "@/app/api/reviews/route";

describe("/api/reviews route", () => {
  beforeEach(() => {
    createReviewMock.mockReset();
    uploadReviewPhotoMock.mockReset();
  });

  it("rejects invalid ratings", async () => {
    const request = new NextRequest("http://localhost/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        placeId: "11111111-1111-4111-8111-111111111111",
        foodName: "Pizza",
        rating: 12,
        comment: "Too high",
        reviewerName: "Vinsx",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(createReviewMock).not.toHaveBeenCalled();
  });

  it("creates review for valid payload", async () => {
    createReviewMock.mockResolvedValue({
      id: "r1",
      placeId: "11111111-1111-4111-8111-111111111111",
      foodName: "Pizza",
      rating: 5,
      comment: "Fantastic",
      imageUrl: null,
      reviewerName: "Vinsx",
      createdAt: "2026-03-16T00:00:00.000Z",
    });

    const request = new NextRequest("http://localhost/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        placeId: "11111111-1111-4111-8111-111111111111",
        foodName: "Pizza",
        rating: 5,
        comment: "Fantastic",
        reviewerName: "Vinsx",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(createReviewMock).toHaveBeenCalledTimes(1);
  });

  it("creates review with uploaded photo for multipart payload", async () => {
    uploadReviewPhotoMock.mockResolvedValue("https://example.com/pizza.jpg");
    createReviewMock.mockResolvedValue({
      id: "r2",
      placeId: "11111111-1111-4111-8111-111111111111",
      foodName: "Pizza",
      rating: 5,
      comment: "With photo",
      imageUrl: "https://example.com/pizza.jpg",
      reviewerName: "Vinsx",
      createdAt: "2026-03-16T00:00:00.000Z",
    });

    const formData = new FormData();
    formData.set("placeId", "11111111-1111-4111-8111-111111111111");
    formData.set("foodName", "Pizza");
    formData.set("rating", "5");
    formData.set("comment", "With photo");
    formData.set("reviewerName", "Vinsx");
    formData.set("photo", new File([Uint8Array.from([1, 2, 3])], "pizza.jpg", { type: "image/jpeg" }));

    const request = new NextRequest("http://localhost/api/reviews", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(uploadReviewPhotoMock).toHaveBeenCalledTimes(1);
    expect(createReviewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://example.com/pizza.jpg",
      }),
    );
  });
});
