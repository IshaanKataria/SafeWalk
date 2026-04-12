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
    <form onSubmit={handleSubmit} className="space-y-3">
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

      <p className="text-[11px] text-zinc-600 leading-snug -mt-1">
        Best results within the Barnet area — our model is trained on local data.
      </p>

      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[13px] text-zinc-400">
            Time of day
          </label>
          <span className="text-[13px] font-medium text-white tabular-nums">
            {formatHour(timeOfDay)} {isDark ? "🌙" : "☀️"}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={23}
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5">
          <span>12 AM</span>
          <span>12 PM</span>
          <span>11 PM</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500
                   disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500
                   text-white text-[14px] font-semibold tracking-wide
                   rounded-2xl transition-all
                   shadow-[0_2px_12px_rgba(34,197,94,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]
                   hover:shadow-[0_4px_20px_rgba(34,197,94,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
                   disabled:shadow-none
                   flex items-center justify-center gap-2"
      >
        {loading && <Spinner size={16} />}
        {loading ? "Finding safe routes" : "Find Safe Routes"}
      </button>
    </form>
  );
}
