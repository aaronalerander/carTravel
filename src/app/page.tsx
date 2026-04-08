"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import ResultsGrid from "@/components/ResultsGrid";
import { useSearch } from "@/hooks/useSearch";
import type { SearchParams } from "@/types";

export default function Home() {
  const { filteredResults, rawResults, filters, setFilters, search, isLoading, error } =
    useSearch();

  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);

  const handleSearch = (params: SearchParams) => {
    setLastSearchParams(params);
    search(params);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            🚗 CarTravel
            <span className="ml-2 text-sm font-normal text-gray-400">
              cheap flights · great roads · manual cars
            </span>
          </h1>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex gap-6">
        {/* Sidebar — only show when we have results or loading */}
        {(rawResults.length > 0 || isLoading) && (
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            resultCount={filteredResults.length}
            totalCount={rawResults.length}
          />
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          <ResultsGrid
            results={filteredResults}
            isLoading={isLoading}
            tripDays={lastSearchParams?.tripDays ?? 3}
          />
        </div>
      </main>
    </div>
  );
}
