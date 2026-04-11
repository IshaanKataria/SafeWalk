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
      <label className="block text-sm text-zinc-400 mb-1">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}
