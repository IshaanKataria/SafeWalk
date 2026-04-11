"use client";

import { useState } from "react";

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
  const [origin, setOrigin] = useState("Clapham Junction Station, London");
  const [destination, setDestination] = useState("Wandsworth Town Station, London");
  const [timeOfDay, setTimeOfDay] = useState(21);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    onSubmit(origin, destination, timeOfDay);
  }

  const isDark = timeOfDay >= 19 || timeOfDay < 6;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-1">From</label>
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          placeholder="Starting location"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">To</label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          placeholder="Destination"
        />
      </div>

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
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
      >
        {loading ? "Finding safe routes..." : "Find Safe Routes"}
      </button>
    </form>
  );
}
