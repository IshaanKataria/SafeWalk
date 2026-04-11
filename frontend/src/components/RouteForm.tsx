"use client";

import { useState } from "react";
import PlaceAutocomplete from "./PlaceAutocomplete";
import Spinner from "./Spinner";

interface RouteFormProps {
  onSubmit: (origin: string, destination: string, timeOfDay: number) => void;
  loading: boolean;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export default function RouteForm({ onSubmit, loading }: RouteFormProps) {
  const [origin, setOrigin] = useState("Hendon Central Station, London");
  const [destination, setDestination] = useState("Golders Green Station, London");
  const [timeOfDay, setTimeOfDay] = useState(21);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    onSubmit(origin, destination, timeOfDay);
  }

  const isDark = timeOfDay >= 19 || timeOfDay < 6;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PlaceAutocomplete
        label="From"
        value={origin}
        onChange={setOrigin}
        placeholder="Starting location"
      />

      <PlaceAutocomplete
        label="To"
        value={destination}
        onChange={setDestination}
        placeholder="Destination"
      />

      <p className="text-[11px] text-zinc-500 -mt-2 leading-snug">
        Best results within the Barnet area — our model is trained on local data.
      </p>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">
          Time of day: {formatHour(timeOfDay)} {isDark ? "🌙" : "☀️"}
        </label>
        <input
          type="range"
          min={0}
          max={23}
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>12 AM</span>
          <span>12 PM</span>
          <span>11 PM</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading && <Spinner size={16} />}
        {loading ? "Finding safe routes" : "Find Safe Routes"}
      </button>
    </form>
  );
}
