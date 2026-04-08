"use client";

import { useState } from "react";
import type { DestinationResult, TuroListing } from "@/types";

function formatPrice(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface DestinationCardProps {
  result: DestinationResult;
  tripDays: number;
}

export default function DestinationCard({ result, tripDays }: DestinationCardProps) {
  const { destination, flightOffer, allCars, status } = result;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedCar: TuroListing | undefined = allCars[selectedIndex];

  const totalCost =
    flightOffer && selectedCar
      ? flightOffer.price + selectedCar.totalPrice
      : null;

  const isSuccess = status === "success";

  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm flex flex-col gap-4 transition-all ${isSuccess ? "border-gray-200 hover:shadow-md" : "border-gray-100 opacity-70"}`}>
      {/* Header */}
      <div>
        <h3 className="font-semibold text-gray-900 text-lg">
          {destination.city}, {destination.state}
        </h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {destination.roadHighlights}
        </p>
      </div>

      {/* Flight */}
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">✈️</span>
        <div className="flex-1">
          {flightOffer ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  {formatPrice(flightOffer.price)}
                </span>
                <span className="text-xs text-gray-400">round trip</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {flightOffer.airline} · {flightOffer.stops === 0 ? "Nonstop" : `${flightOffer.stops} stop${flightOffer.stops > 1 ? "s" : ""}`} · departs {formatDateTime(flightOffer.departureTime)}
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-400 italic">No flights found</span>
          )}
        </div>
      </div>

      {/* Car */}
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">🚗</span>
        <div className="flex-1">
          {allCars.length > 0 ? (
            <>
              {/* Dropdown — only shown if more than one car */}
              {allCars.length > 1 ? (
                <select
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {allCars.map((car, i) => (
                    <option key={i} value={i}>
                      {car.name} — {formatPrice(car.pricePerDay)}/day
                      {car.rating ? ` ★${car.rating}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm font-medium text-gray-800 mb-1">
                  {selectedCar?.name}
                </div>
              )}

              {selectedCar && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">
                      {formatPrice(selectedCar.pricePerDay)}/day
                    </span>
                    {selectedCar.rating && (
                      <span className="text-xs text-amber-600">★ {selectedCar.rating}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {tripDays}d total = {formatPrice(selectedCar.totalPrice)}
                  </div>
                  <a
                    href={selectedCar.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    View on Turo →
                  </a>
                </>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400 italic">No manual cars found</span>
          )}
        </div>
      </div>

      {/* Total — updates live as you change the selected car */}
      {totalCost !== null && (
        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            Total ({tripDays}d trip)
          </span>
          <span className="text-lg font-bold text-blue-700">
            {formatPrice(totalCost)}
          </span>
        </div>
      )}
    </div>
  );
}
