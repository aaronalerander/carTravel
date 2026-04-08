"use client";

import { useState } from "react";
import type {
  DestinationResult,
  Filters,
  SearchParams,
  SearchResponse,
} from "@/types";

const DEFAULT_FILTERS: Filters = {
  maxFlightPrice: 1000,
  maxCarPricePerDay: 300,
  maxTotalPrice: 3000,
};

export function useSearch() {
  const [rawResults, setRawResults] = useState<DestinationResult[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedAt, setSearchedAt] = useState<string | null>(null);

  const search = async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    setRawResults([]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchParams: params }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Search failed (${res.status})`);
      }

      const data: SearchResponse = await res.json();
      setRawResults(data.results);
      setSearchedAt(data.searchedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResults = rawResults.filter((r) => {
    if (r.flightOffer && r.flightOffer.price > filters.maxFlightPrice) return false;
    if (r.cheapestCar && r.cheapestCar.pricePerDay > filters.maxCarPricePerDay) return false;
    if (r.totalCost !== null && r.totalCost > filters.maxTotalPrice) return false;
    return true;
  });

  return {
    filteredResults,
    rawResults,
    filters,
    setFilters,
    search,
    isLoading,
    error,
    searchedAt,
  };
}
