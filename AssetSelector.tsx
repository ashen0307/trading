export interface Asset {
  id: string;
  symbol: string;
  name: string;
  payout: number;
}

interface AssetSelectorProps {
  assets: Asset[];
  activeAssetId: string;
  onSelect: (id: string) => void;
  prices: Record<string, number>;
}

export const AssetSelector = ({ assets, activeAssetId, onSelect, prices }: AssetSelectorProps) => {
  return (
    <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1018] p-1.5 text-xs">
      {assets.map((asset) => {
        const active = asset.id === activeAssetId;
        const price = prices[asset.id];
        return (
          <button
            key={asset.id}
            onClick={() => onSelect(asset.id)}
            className={`flex min-w-[130px] flex-col items-start rounded-lg px-3 py-2 text-left transition cursor-pointer ${
              active
                ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/5"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            <div className="flex w-full items-center justify-between text-[11px]">
              <span className="font-bold">{asset.symbol}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-500"
                }`}
              >
                {Math.round(asset.payout * 100)}%
              </span>
            </div>
            {price !== undefined && (
              <div className={`mt-0.5 font-mono text-[10px] font-semibold ${active ? "text-emerald-400" : "text-slate-500"}`}>
                {price.toFixed(price < 10 ? 5 : 2)}
              </div>
            )}
            <div className={`text-[9px] ${active ? "text-emerald-500/50" : "text-slate-700"}`}>
              {asset.name}
            </div>
          </button>
        );
      })}
    </div>
  );
};
