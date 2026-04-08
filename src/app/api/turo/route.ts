export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { scrapeManualCars } from "@/lib/turoScraper";
import { turoCache } from "@/lib/cache";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!city || !state || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing params: city, state, startDate, endDate" },
      { status: 400 }
    );
  }

  const cacheKey = `${city}-${state}-${startDate}-${endDate}`;
  const cached = turoCache.get(cacheKey);
  if (cached !== null) {
    return NextResponse.json({ results: cached, cacheHit: true });
  }

  const results = await scrapeManualCars(city, state, startDate, endDate);
  turoCache.set(cacheKey, results);

  return NextResponse.json({ results, cacheHit: false });
}
