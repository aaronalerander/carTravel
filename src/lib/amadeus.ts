import type { FlightOffer } from "@/types";

const SERPAPI_BASE = "https://serpapi.com/search.json";

export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  flexDays = 0
): Promise<FlightOffer | null> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY must be set in .env.local");
  }

  // SerpApi flexible_outbound_date_type: 1=±1d, 2=±2d, 3=±3d, 7=±7d
  // Clamp to the values SerpApi actually supports
  const flex = flexDays >= 7 ? "7" : flexDays >= 3 ? "3" : flexDays >= 2 ? "2" : flexDays >= 1 ? "1" : "0";

  const params = new URLSearchParams({
    engine: "google_flights",
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departureDate,
    return_date: returnDate,
    currency: "USD",
    hl: "en",
    type: "1", // 1 = round trip
    api_key: apiKey,
    ...(flex !== "0" && {
      flexible_outbound_date_type: flex,
      flexible_return_date_type: flex,
    }),
  });

  try {
    const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, {
      next: { revalidate: 0 }, // no caching at fetch level — we handle caching ourselves
    });

    if (!res.ok) {
      console.error(`SerpApi HTTP ${res.status} for ${origin}→${destination}`);
      return null;
    }

    const data = await res.json();

    // SerpApi returns best_flights and other_flights; combine and pick cheapest
    const allFlights = [
      ...(data.best_flights ?? []),
      ...(data.other_flights ?? []),
    ];

    if (allFlights.length === 0) return null;

    // Sort by price and take the cheapest
    allFlights.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    const cheapest = allFlights[0];

    const firstLeg = cheapest.flights?.[0];
    const lastLeg = cheapest.flights?.[cheapest.flights.length - 1];
    if (!firstLeg) return null;

    const stops = (cheapest.flights?.length ?? 1) - 1;

    // SerpApi times are "YYYY-MM-DD HH:MM" — convert to ISO 8601
    const toISO = (t: string) => t ? t.replace(" ", "T") + ":00" : "";

    return {
      price: cheapest.price,
      currency: "USD",
      airline: firstLeg.airline ?? firstLeg.airline_logo ?? "Unknown",
      departureTime: toISO(firstLeg.departure_airport?.time ?? ""),
      arrivalTime: toISO(lastLeg?.arrival_airport?.time ?? ""),
      stops,
    };
  } catch (err) {
    console.error(`SerpApi flight search failed for ${origin}→${destination}:`, err);
    return null;
  }
}
