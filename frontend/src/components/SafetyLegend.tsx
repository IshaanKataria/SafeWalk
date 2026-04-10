export default function SafetyLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-zinc-400">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span>Safe (71-100)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <span>Moderate (41-70)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span>Avoid (0-40)</span>
      </div>
    </div>
  );
}
