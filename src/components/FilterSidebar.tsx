"use client";

import type { Filters } from "@/types";

interface FilterSidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  resultCount: number;
  totalCount: number;
}

function SliderRow({
  label,
  value,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-blue-600">
          ${value.toLocaleString()}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>$0</span>
        <span>${max.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function FilterSidebar({
  filters,
  onChange,
  resultCount,
  totalCount,
}: FilterSidebarProps) {
  return (
    <aside className="w-64 shrink-0">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm sticky top-4">
        <h2 className="font-semibold text-gray-800 mb-4">Filters</h2>

        <div className="flex flex-col gap-6">
          <SliderRow
            label="Max flight price"
            value={filters.maxFlightPrice}
            max={2000}
            step={25}
            onChange={(v) => onChange({ ...filters, maxFlightPrice: v })}
          />
          <SliderRow
            label="Max car / day"
            value={filters.maxCarPricePerDay}
            max={500}
            step={10}
            onChange={(v) => onChange({ ...filters, maxCarPricePerDay: v })}
          />
          <SliderRow
            label="Max total cost"
            value={filters.maxTotalPrice}
            max={5000}
            step={50}
            onChange={(v) => onChange({ ...filters, maxTotalPrice: v })}
          />
        </div>

        {totalCount > 0 && (
          <p className="mt-5 text-xs text-gray-500 text-center">
            Showing {resultCount} of {totalCount} destinations
          </p>
        )}
      </div>
    </aside>
  );
}
