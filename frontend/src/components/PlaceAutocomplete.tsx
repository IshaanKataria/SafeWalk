"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

// Barnet (Hendon / Golders Green) bounding box — biases suggestions to the
// area our ML model was trained on.
const BIAS_BOUNDS = {
  south: 51.56,
  north: 51.60,
  west: -0.24,
  east: -0.17,
};

interface PlaceAutocompleteProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  label: string;
}

export default function PlaceAutocomplete({
  value,
  onChange,
  placeholder,
  label,
}: PlaceAutocompleteProps) {
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      bounds: BIAS_BOUNDS,
      componentRestrictions: { country: "gb" },
      fields: ["formatted_address", "geometry.location", "name"],
      types: ["geocode", "establishment"],
      strictBounds: false,
    });

    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const text = place.formatted_address || place.name || "";
      if (text) onChange(text);
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [placesLib, onChange]);

  return (
    <div>
      <label className="block text-[12px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-[var(--color-sw-surface-3)] border border-[var(--color-sw-border)]
                   rounded-xl text-[14px] text-white placeholder-zinc-600
                   focus:outline-none focus:border-[var(--color-sw-green)]/40 focus:ring-1 focus:ring-[var(--color-sw-green)]/20
                   transition-all"
      />
    </div>
  );
}
