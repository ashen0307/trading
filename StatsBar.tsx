interface StatsBarProps {
  balance: number;
  openTrades: number;
  totalPnl: number;
  winRate: number;
}

export const StatsBar = ({ balance, openTrades, totalPnl, winRate }: StatsBarProps) => {
  const stats = [
    { label: "Balance", value: `$${balance.toFixed(2)}`, color: "text-white", icon: "💰" },
    { label: "Open Positions", value: String(openTrades), color: openTrades > 0 ? "text-amber-400" : "text-slate-400", icon: "📊" },
    { label: "Total P/L", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? "text-emerald-400" : "text-rose-400", icon: totalPnl >= 0 ? "📈" : "📉" },
    { label: "Win Rate", value: `${(Number.isNaN(winRate) ? 0 : winRate).toFixed(1)}%`, color: winRate >= 55 ? "text-emerald-400" : "text-slate-400", icon: "🎯" },
  ];

  return (
    <section className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800/80 bg-[#0c1018] p-2.5 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2 rounded-lg bg-slate-900/50 px-3 py-2">
          <span className="text-sm">{s.icon}</span>
          <div className="flex flex-col gap-0">
            <span className="text-[10px] text-slate-600 font-medium">{s.label}</span>
            <span className={`font-mono text-[13px] font-bold ${s.color}`}>{s.value}</span>
          </div>
        </div>
      ))}
    </section>
  );
};
