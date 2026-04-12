import { LatLng } from "@/types";

/**
 * Build a Google Maps walking-directions URL. The !3e2 parameter forces
 * walking mode. Works on desktop (opens maps.google.com in a new tab) and
 * deep-links into the native Google Maps app on mobile.
 */
export function buildWalkingNavUrl(origin: LatLng, destination: LatLng): string {
  const o = `${origin.lat},${origin.lng}`;
  const d = `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/${o}/${d}/data=!3m1!4b1!4m2!4m1!3e2`;
}
