export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { searchFlights } from "@/lib/amadeus";
import { flightCache } from "@/lib/cache";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");

  if (!origin || !destination || !departureDate || !returnDate) {
    return NextResponse.json(
      {
        error: "Missing params: origin, destination, departureDate, returnDate",
      },
      { status: 400 }
    );
  }

  const cacheKey = `${origin}-${destination}-${departureDate}-${returnDate}`;
  const cached = flightCache.get(cacheKey);
  if (cached !== null) {
    return NextResponse.json({ result: cached, cacheHit: true });
  }

  const result = await searchFlights(
    origin,
    destination,
    departureDate,
    returnDate
  );
  flightCache.set(cacheKey, result);

  return NextResponse.json({ result, cacheHit: false });
}
