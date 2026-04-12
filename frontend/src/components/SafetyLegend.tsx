export default function SafetyLegend() {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Safety scale</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
      </div>
      <div className="flex justify-between text-[10px] text-zinc-500">
        <span>Safe (71-100)</span>
        <span>Moderate</span>
        <span>Avoid (0-40)</span>
      </div>
    </div>
  );
}
