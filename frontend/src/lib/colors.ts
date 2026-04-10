export function scoreToHex(score: number): string {
  if (score >= 71) return "#22c55e"; // green-500
  if (score >= 41) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}

export function scoreToLabel(score: number): string {
  if (score >= 71) return "Safe";
  if (score >= 41) return "Moderate";
  return "Avoid";
}

export function scoreToBg(score: number): string {
  if (score >= 71) return "bg-green-500/20 border-green-500/40";
  if (score >= 41) return "bg-yellow-500/20 border-yellow-500/40";
  return "bg-red-500/20 border-red-500/40";
}

export function scoreToText(score: number): string {
  if (score >= 71) return "text-green-400";
  if (score >= 41) return "text-yellow-400";
  return "text-red-400";
}
