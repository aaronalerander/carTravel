export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { searchFlights } from "@/lib/amadeus";
import { scrapeManualCars } from "@/lib/turoScraper";
import { flightCache, turoCache } from "@/lib/cache";
import destinations from "@/lib/destinations";
import type {
  Destination,
  DestinationResult,
  FlightOffer,
  SearchRequest,
  SearchResponse,
  TuroListing,
} from "@/types";

class Semaphore {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(private maxConcurrent: number) {}

  async acquire(): Promise<() => void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return this.release.bind(this);
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.running++;
        resolve(this.release.bind(this));
      });
    });
  }

  private release() {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}


function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

async function fetchFlight(
  origin: string,
  dest: Destination,
  departureDate: string,
  returnDate: string,
  flexDays: number,
  semaphore: Semaphore
): Promise<FlightOffer | null> {
  const cacheKey = `${origin}-${dest.airportCode}-${departureDate}-${returnDate}`;
  const cached = flightCache.get(cacheKey);
  if (cached !== null) return cached;

  const release = await semaphore.acquire();
  try {
    const result = await searchFlights(origin, dest.airportCode, departureDate, returnDate, flexDays);
    flightCache.set(cacheKey, result);
    return result;
  } finally {
    release();
  }
}

async function fetchTuro(
  dest: Destination,
  startDate: string,
  endDate: string,
  semaphore: Semaphore
): Promise<TuroListing[]> {
  const cacheKey = `${dest.city}-${dest.state}-${startDate}-${endDate}`;
  const cached = turoCache.get(cacheKey);
  if (cached !== null) return cached;

  const release = await semaphore.acquire();
  try {
    const result = await scrapeManualCars(dest.city, dest.state, startDate, endDate);
    turoCache.set(cacheKey, result);
    return result;
  } finally {
    release();
  }
}

async function fetchDestination(
  origin: string,
  dest: Destination,
  departureDate: string,
  returnDate: string,
  flexDays: number,
  turoSemaphore: Semaphore,
  flightSemaphore: Semaphore
): Promise<DestinationResult> {
  try {
    const [flightOffer, turoListings] = await Promise.all([
      withTimeout(fetchFlight(origin, dest, departureDate, returnDate, flexDays, flightSemaphore), 30000),
      withTimeout(fetchTuro(dest, departureDate, returnDate, turoSemaphore), 25000),
    ]);

    const cheapestCar = turoListings.length > 0 ? turoListings[0] : null;
    const totalCost =
      flightOffer && cheapestCar
        ? flightOffer.price + cheapestCar.totalPrice
        : null;

    let status: DestinationResult["status"] = "success";
    if (!flightOffer) status = "flight-not-found";
    else if (!cheapestCar) status = "cars-not-found";

    return { destination: dest, flightOffer, cheapestCar, allCars: turoListings, totalCost, status };
  } catch (err) {
    return {
      destination: dest,
      flightOffer: null,
      cheapestCar: null,
      allCars: [],
      totalCost: null,
      status: "error",
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function POST(req: Request) {
  let body: SearchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { searchParams } = body;
  if (!searchParams?.origin || !searchParams?.windowStart || !searchParams?.windowEnd || !searchParams?.tripDays) {
    return NextResponse.json(
      { error: "Missing required fields: origin, windowStart, windowEnd, tripDays" },
      { status: 400 }
    );
  }

  const { origin, windowStart, windowEnd, tripDays } = searchParams;
  if (!/^[A-Z]{3}$/.test(origin)) {
    return NextResponse.json({ error: "origin must be a 3-letter IATA code" }, { status: 400 });
  }

  // Derive concrete departure/return dates from the window
  const departureDate = windowStart;
  const returnDate = (() => {
    const d = new Date(windowStart);
    d.setUTCDate(d.getUTCDate() + tripDays);
    return d.toISOString().split("T")[0];
  })();

  // How many days of flexibility SerpApi should search around the departure date.
  // Capped at 7 (SerpApi's max), using half the window so the search stays within range.
  const windowDays = Math.round(
    (new Date(windowEnd).getTime() - new Date(windowStart).getTime()) / 86400000
  );
  const flexDays = Math.min(7, Math.floor((windowDays - tripDays) / 2));

  const turoSemaphore = new Semaphore(5);
  const flightSemaphore = new Semaphore(3);

  const settled = await Promise.allSettled(
    destinations.map((dest) =>
      fetchDestination(origin, dest, departureDate, returnDate, flexDays, turoSemaphore, flightSemaphore)
    )
  );

  const results: DestinationResult[] = settled
    .map((r) =>
      r.status === "fulfilled"
        ? r.value
        : ({
            destination: destinations[0],
            flightOffer: null,
            cheapestCar: null,
            allCars: [],
            totalCost: null,
            status: "error",
            errorMessage: "Promise rejected",
          } as DestinationResult)
    )
    .sort((a, b) => {
      if (a.totalCost === null) return 1;
      if (b.totalCost === null) return -1;
      return a.totalCost - b.totalCost;
    });

  const response: SearchResponse = {
    results,
    searchedAt: new Date().toISOString(),
    cacheHit: false,
  };

  return NextResponse.json(response);
}
