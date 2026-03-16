import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createReviewMock, MockRepositoryError } = vi.hoisted(() => {
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
    createReviewMock: vi.fn(),
    MockRepositoryError,
  };
});

vi.mock("@/lib/repository", () => ({
  createReview: createReviewMock,
  RepositoryError: MockRepositoryError,
}));

import { POST } from "@/app/api/reviews/route";

describe("/api/reviews route", () => {
  beforeEach(() => {
    createReviewMock.mockReset();
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
});
