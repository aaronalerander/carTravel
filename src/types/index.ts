export interface Destination {
  id: string;
  city: string;
  state: string;
  airportCode: string;
  roadHighlights: string;
  lat: number;
  lon: number;
}

export interface SearchParams {
  origin: string;        // IATA code e.g. "JFK"
  windowStart: string;   // "YYYY-MM-DD" — earliest you can depart
  windowEnd: string;     // "YYYY-MM-DD" — latest you can return
  tripDays: number;      // how many days the trip should last
}

export interface Filters {
  maxFlightPrice: number;
  maxCarPricePerDay: number;
  maxTotalPrice: number;
}

export interface FlightOffer {
  price: number;
  currency: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  stops: number;
}

export interface TuroListing {
  name: string;
  pricePerDay: number;
  totalPrice: number;
  rating?: number;
  imageUrl?: string;
  listingUrl: string;
}

export interface DestinationResult {
  destination: Destination;
  flightOffer: FlightOffer | null;
  cheapestCar: TuroListing | null;
  allCars: TuroListing[];
  totalCost: number | null;
  status: "success" | "flight-not-found" | "cars-not-found" | "error";
  errorMessage?: string;
}

export interface SearchRequest {
  searchParams: SearchParams;
}

export interface SearchResponse {
  results: DestinationResult[];
  searchedAt: string;
  cacheHit: boolean;
}
