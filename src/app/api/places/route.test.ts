import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { listPlacesWithStatsMock, createPlaceMock, MockRepositoryError } = vi.hoisted(() => {
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
    listPlacesWithStatsMock: vi.fn(),
    createPlaceMock: vi.fn(),
    MockRepositoryError,
  };
});

vi.mock("@/lib/repository", () => ({
  listPlacesWithStats: listPlacesWithStatsMock,
  createPlace: createPlaceMock,
  RepositoryError: MockRepositoryError,
}));

import { GET, POST } from "@/app/api/places/route";

describe("/api/places route", () => {
  beforeEach(() => {
    listPlacesWithStatsMock.mockReset();
    createPlaceMock.mockReset();
  });

  it("returns places on GET", async () => {
    listPlacesWithStatsMock.mockResolvedValue([
      {
        id: "p1",
        name: "Taco Corner",
        location: "Main Street",
        cuisine: "Mexican",
        addedBy: "Vinsx",
        createdAt: "2026-03-16T00:00:00.000Z",
        averageRating: 4.5,
        reviewCount: 2,
        latestReviews: [],
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.places).toHaveLength(1);
  });

  it("validates payload on POST", async () => {
    const request = new NextRequest("http://localhost/api/places", {
      method: "POST",
      body: JSON.stringify({ name: "A" }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(createPlaceMock).not.toHaveBeenCalled();
  });

  it("creates place on POST with valid payload", async () => {
    createPlaceMock.mockResolvedValue({
      id: "p2",
      name: "Noodle House",
      location: "Market Avenue",
      cuisine: "Asian",
      addedBy: "Friend",
      createdAt: "2026-03-16T00:00:00.000Z",
      averageRating: null,
      reviewCount: 0,
      latestReviews: [],
    });

    const request = new NextRequest("http://localhost/api/places", {
      method: "POST",
      body: JSON.stringify({
        name: "Noodle House",
        location: "Market Avenue",
        cuisine: "Asian",
        addedBy: "Friend",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(createPlaceMock).toHaveBeenCalledTimes(1);
  });
});
