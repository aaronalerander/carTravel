import type { DestinationResult } from "@/types";
import DestinationCard from "./DestinationCard";
import LoadingCard from "./LoadingCard";

interface ResultsGridProps {
  results: DestinationResult[];
  isLoading: boolean;
  tripDays: number;
}

export default function ResultsGrid({ results, isLoading, tripDays }: ResultsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <span className="text-5xl mb-4">🗺️</span>
        <p className="text-lg font-medium">No results yet</p>
        <p className="text-sm mt-1">Enter your origin airport and departure date to search</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {results.map((result) => (
        <DestinationCard
          key={result.destination.id}
          result={result}
          tripDays={tripDays}
        />
      ))}
    </div>
  );
}
