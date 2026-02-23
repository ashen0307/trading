import { useState, useEffect } from "react";
import type { Direction } from "./TradingPanel";

export interface OpenTradeView {
  id: string;
  assetId: string;
  assetSymbol: string;
  direction: Direction;
  amount: number;
  payoutFactor: number;
  entryPrice: number;
  currentPrice: number;
  openTime: number;
  expirySeconds: number;
}

interface RunningTradesProps {
  trades: OpenTradeView[];
  onSelectAsset: (assetId: string) => void;
}

export const RunningTrades = ({ trades, onSelectAsset }: RunningTradesProps) => {
  // Force re-render every 200ms for smooth countdown
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (trades.length === 0) return;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [trades.length]);

  // Suppress unused warning
  void tick;

  const now = Date.now();

  return (
    <div
      className={`rounded-xl border bg-slate-900/80 p-3 text-xs shadow-lg transition-all ${
        trades.length > 0
          ? "border-emerald-500/30 animate-glow"
          : "border-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
            Running Trades
          </h2>
          {trades.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white shadow-md shadow-emerald-500/30">
              {trades.length}
            </span>
          )}
        </div>
        {trades.length > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            LIVE
          </span>
        )}
      </div>

      {trades.length === 0 ? (
        <div className="flex items-center justify-center py-5 gap-3 text-slate-600">
          <div className="text-center">
            <div className="text-2xl mb-1.5 opacity-50">📈</div>
            <div className="text-[11px] font-medium text-slate-500">No active trades</div>
            <div className="text-[10px] text-slate-700 mt-0.5">
              Place a CALL or PUT trade to see it here
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {trades.map((trade) => {
            const elapsed = Math.max(0, (now - trade.openTime) / 1000);
            const remaining = Math.max(0, trade.expirySeconds - elapsed);
            const progress = Math.min(1, elapsed / trade.expirySeconds);
            const isCall = trade.direction === "CALL";
            const priceDiff = trade.currentPrice - trade.entryPrice;
            const isWinning = isCall ? priceDiff > 0 : priceDiff < 0;
            const potentialPnl = isWinning
              ? trade.amount * trade.payoutFactor
              : -trade.amount;

            const formatTime = (s: number) => {
              const m = Math.floor(s / 60);
              const sec = Math.floor(s % 60);
              return m > 0
                ? `${m}:${sec.toString().padStart(2, "0")}`
                : `${sec}s`;
            };

            return (
              <button
                key={trade.id}
                onClick={() => onSelectAsset(trade.assetId)}
                className={`w-full rounded-lg border p-3 text-left transition-all cursor-pointer animate-fade-in ${
                  isWinning
                    ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                    : "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
                }`}
              >
                {/* Top: Direction + Asset + Amount */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        isCall
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {isCall ? "▲ CALL" : "▼ PUT"}
                    </span>
                    <span className="font-bold text-white text-[12px]">
                      {trade.assetSymbol}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-300 font-semibold">
                    ${trade.amount.toFixed(2)}
                  </span>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  <div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">
                      Entry
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {trade.entryPrice.toFixed(trade.entryPrice < 10 ? 5 : 2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">
                      Current
                    </div>
                    <div
                      className={`font-mono text-[11px] font-semibold ${
                        isWinning ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {trade.currentPrice.toFixed(
                        trade.currentPrice < 10 ? 5 : 2
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">
                      Potential P/L
                    </div>
                    <div
                      className={`font-mono text-[11px] font-bold ${
                        isWinning ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isWinning ? "+" : ""}${potentialPnl.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Progress + Timer */}
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        progress > 0.8
                          ? "bg-gradient-to-r from-rose-500 to-red-500"
                          : progress > 0.5
                            ? "bg-gradient-to-r from-amber-500 to-orange-500"
                            : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                      }`}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold min-w-[42px] text-right ${
                      progress > 0.8
                        ? "text-rose-400"
                        : progress > 0.5
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {formatTime(remaining)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
