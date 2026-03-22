export function StatCard({ 
  title, 
  value, 
  percentage, 
  color,
  darkMode = true
}: { 
  title: string, 
  value: string, 
  percentage: number, 
  color: string,
  darkMode?: boolean
}) {
  return (
    <div className={`border p-3 md:p-5 rounded-xl md:rounded-2xl shadow-sm transition-all group ${
      darkMode 
        ? "bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/60" 
        : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
    }`}>
      <p className={`font-bold text-[10px] md:text-xs uppercase tracking-tighter mb-1 ${darkMode ? "text-zinc-500" : "text-zinc-500"}`}>
        {title}
      </p>
      <h3 className={`text-base md:text-xl font-black mb-2 md:mb-3 truncate ${darkMode ? "text-white" : "text-zinc-900"}`}>
        {value}
      </h3>
      <div className={`w-full rounded-full h-1.5 overflow-hidden ring-1 ${darkMode ? "bg-zinc-800/50 ring-white/5" : "bg-zinc-100 ring-black/5"}`}>
        <div 
          className={`h-full transition-all duration-1000 ${color} ${darkMode ? "shadow-[0_0_8px_rgba(255,255,255,0.1)]" : "shadow-sm"}`} 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
