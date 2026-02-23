import type { Direction } from "./TradingPanel";

export interface TradeRecord {
  id: string;
  asset: string;
  direction: Direction;
  amount: number;
  payout: number;
  entryPrice: number;
  exitPrice: number;
  openedAt: Date;
  closedAt: Date;
}

interface TradeHistoryProps {
  trades: TradeRecord[];
}

export const TradeHistory = ({ trades }: TradeHistoryProps) => {
  const totalProfit = trades.reduce((s, t) => s + t.payout, 0);
  const wins = trades.filter((t) => t.payout > 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : 0;

  return (
    <div className="flex flex-col rounded-xl border border-slate-800/80 bg-[#0c1018] p-3 text-xs shadow-lg">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
            Trade History
          </h2>
          <p className="mt-0.5 text-[10px] text-slate-600">Recent settled trades</p>
        </div>
        {trades.length > 0 && (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-500">P/L</span>
              <span className={`font-mono font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 font-mono">
              Win rate: {winRate.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-800/60 bg-slate-900/30 overflow-hidden">
        <div className="grid grid-cols-[1.3fr_0.5fr_0.8fr_0.5fr_0.6fr] gap-1 border-b border-slate-800/60 bg-slate-800/30 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
          <span>Asset</span>
          <span>Dir</span>
          <span>Entry/Exit</span>
          <span>Amt</span>
          <span>P/L</span>
        </div>
        <div className="h-[200px] overflow-y-auto">
          {trades.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-600 py-8">
              <span className="text-2xl mb-2 opacity-50">📋</span>
              <div className="text-[11px]">No trades yet</div>
              <div className="text-[10px] text-slate-700 mt-0.5">Place a trade to begin</div>
            </div>
          ) : (
            trades
              .slice()
              .reverse()
              .map((trade) => (
                <div
                  key={trade.id}
                  className="grid grid-cols-[1.3fr_0.5fr_0.8fr_0.5fr_0.6fr] items-center gap-1 border-b border-slate-800/30 px-2.5 py-1.5 text-[10px] last:border-0 animate-fade-in"
                >
                  <div>
                    <span className="font-semibold text-slate-300">{trade.asset}</span>
                    <div className="text-[9px] text-slate-700">
                      {trade.openedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  </div>
                  <div>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      trade.direction === "CALL"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {trade.direction === "CALL" ? "▲" : "▼"}
                    </span>
                  </div>
                  <div className="font-mono text-[9px] text-slate-500 leading-tight">
                    <div>{trade.entryPrice.toFixed(trade.entryPrice < 10 ? 4 : 2)}</div>
                    <div>{trade.exitPrice.toFixed(trade.exitPrice < 10 ? 4 : 2)}</div>
                  </div>
                  <div className="font-mono text-slate-400">${trade.amount}</div>
                  <div className={`font-mono font-bold ${trade.payout >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {trade.payout >= 0 ? "+" : ""}{trade.payout.toFixed(1)}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
