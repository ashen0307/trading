export type Direction = "CALL" | "PUT";

interface TradingPanelProps {
  amount: number;
  onAmountChange: (value: number) => void;
  expirySeconds: number;
  onExpiryChange: (seconds: number) => void;
  onPlaceTrade: (direction: Direction) => void;
  disabled: boolean;
  countdownLabel: string;
  countdownPercent: number;
  resultBanner: { status: "PENDING" | "WIN" | "LOSS" | null; payout: number } | null;
  activePayout: number;
  balance: number;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250];
const EXPIRIES = [30, 60, 120, 300];

export const TradingPanel = ({
  amount,
  onAmountChange,
  expirySeconds,
  onExpiryChange,
  onPlaceTrade,
  disabled,
  countdownLabel,
  countdownPercent,
  resultBanner,
  activePayout,
  balance,
}: TradingPanelProps) => {
  const potentialReturn = amount * activePayout;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800/80 bg-[#0c1018] p-4 text-xs shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
          Trade
        </h2>
        <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/25">
          {Math.round(activePayout * 100)}% Payout
        </div>
      </div>

      {/* Investment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500">Investment Amount</span>
          <span className="text-[10px] text-slate-600 font-mono">Balance: ${balance.toFixed(2)}</span>
        </div>
        <div className="flex items-center rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-2.5 font-mono text-sm ring-1 ring-transparent focus-within:border-emerald-500/40 focus-within:ring-emerald-500/20 transition">
          <span className="mr-1.5 text-slate-500 font-bold">$</span>
          <input
            type="number"
            className="h-5 w-full bg-transparent text-white outline-none placeholder-slate-600"
            min={1}
            step={1}
            value={Number.isNaN(amount) ? "" : amount}
            onChange={(e) => onAmountChange(Number(e.target.value) || 0)}
          />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESET_AMOUNTS.map((v) => (
            <button
              key={v}
              onClick={() => onAmountChange(v)}
              className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                amount === v
                  ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                  : "bg-slate-800/80 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
              }`}
            >
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Expiry */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-slate-500">Expiry Time</span>
        <div className="grid grid-cols-4 gap-1.5">
          {EXPIRIES.map((sec) => (
            <button
              key={sec}
              onClick={() => onExpiryChange(sec)}
              className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                expirySeconds === sec
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "bg-slate-800/80 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
              }`}
            >
              {sec < 60 ? `${sec}s` : sec === 60 ? "1m" : `${Math.round(sec / 60)}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Potential Return */}
      <div className="rounded-lg bg-slate-800/50 border border-slate-700/40 px-3 py-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Potential Return</span>
          <span className="font-mono font-bold text-emerald-400">+${potentialReturn.toFixed(2)}</span>
        </div>
      </div>

      {/* Countdown */}
      {countdownPercent > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Countdown</span>
            <span className="font-mono font-bold text-white">{countdownLabel}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500 transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, countdownPercent))}%` }}
            />
          </div>
        </div>
      )}

      {/* Result Banner */}
      {resultBanner && (
        <div
          className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[11px] font-semibold animate-fade-in ${
            resultBanner.status === "WIN"
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : resultBanner.status === "LOSS"
                ? "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"
                : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
          }`}
        >
          <span>
            {resultBanner.status === "WIN"
              ? "✅ Trade Won – ITM"
              : resultBanner.status === "LOSS"
                ? "❌ Trade Lost – OTM"
                : "⏳ Trade in progress..."}
          </span>
          <span className="font-mono">
            {resultBanner.status === "PENDING"
              ? "–"
              : `${resultBanner.payout >= 0 ? "+" : ""}$${resultBanner.payout.toFixed(2)}`}
          </span>
        </div>
      )}

      {/* Trade Buttons */}
      <div className="grid grid-cols-2 gap-2 text-xs font-bold mt-auto">
        <button
          disabled={disabled}
          onClick={() => onPlaceTrade("PUT")}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 py-3 text-white shadow-lg shadow-rose-500/20 transition hover:from-rose-400 hover:to-rose-500 disabled:cursor-not-allowed disabled:from-rose-500/20 disabled:to-rose-600/20 disabled:text-rose-300/40 disabled:shadow-none cursor-pointer"
        >
          <span className="text-base leading-none">▼</span>
          PUT
        </button>
        <button
          disabled={disabled}
          onClick={() => onPlaceTrade("CALL")}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 py-3 text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:from-emerald-500/20 disabled:to-emerald-600/20 disabled:text-emerald-300/40 disabled:shadow-none cursor-pointer"
        >
          <span className="text-base leading-none">▲</span>
          CALL
        </button>
      </div>

      <p className="text-[9px] leading-relaxed text-slate-700 text-center">
        Trading involves significant risk. Only trade capital you can afford to lose.
      </p>
    </div>
  );
};
