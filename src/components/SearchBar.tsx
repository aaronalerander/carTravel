"use client";

import { useState } from "react";
import type { SearchParams } from "@/types";

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const today = new Date().toISOString().split("T")[0];

  const [origin, setOrigin] = useState("");
  const [windowStart, setWindowStart] = useState(today);
  const [windowEnd, setWindowEnd] = useState(addDays(today, 14));
  const [tripDays, setTripDays] = useState(3);

  const handleWindowStartChange = (val: string) => {
    setWindowStart(val);
    // Keep end at least tripDays after the new start
    if (windowEnd <= addDays(val, tripDays - 1)) {
      setWindowEnd(addDays(val, tripDays));
    }
  };

  const handleTripDaysChange = (val: number) => {
    setTripDays(val);
    // Keep window wide enough to fit the trip
    if (windowEnd <= addDays(windowStart, val - 1)) {
      setWindowEnd(addDays(windowStart, val));
    }
  };

  const isValid =
    origin.trim().length === 3 &&
    windowEnd > addDays(windowStart, tripDays - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSearch({ origin: origin.trim().toUpperCase(), windowStart, windowEnd, tripDays });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Flying from
        </label>
        <input
          type="text"
          placeholder="SFO"
          value={origin}
          onChange={(e) => setOrigin(e.target.value.toUpperCase())}
          maxLength={3}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Available from
        </label>
        <input
          type="date"
          value={windowStart}
          min={today}
          onChange={(e) => handleWindowStartChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Available until
        </label>
        <input
          type="date"
          value={windowEnd}
          min={addDays(windowStart, tripDays)}
          onChange={(e) => setWindowEnd(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Trip length
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={tripDays}
            min={1}
            max={14}
            onChange={(e) => handleTripDaysChange(Number(e.target.value))}
            className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <span className="text-sm text-gray-500">days</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !isValid}
        className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
