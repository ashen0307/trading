import { useState, useEffect, useMemo } from "react";

export interface DepositRecord {
  id: string;
  coin: string;
  network: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: number;
  walletAddress: string;
}

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (amount: number, coin: string, network: string, walletAddress: string) => void;
  deposits: DepositRecord[];
}

const COINS = [
  { id: "USDT", name: "Tether", icon: "💵", color: "from-green-500 to-emerald-600" },
  { id: "BTC", name: "Bitcoin", icon: "₿", color: "from-orange-500 to-amber-600" },
  { id: "ETH", name: "Ethereum", icon: "Ξ", color: "from-blue-500 to-indigo-600" },
  { id: "TRX", name: "TRON", icon: "◈", color: "from-red-500 to-rose-600" },
];

const NETWORKS = [
  { id: "BEP20", name: "BEP20", chain: "BNB Smart Chain", color: "text-yellow-400", badge: "bg-yellow-500/15 text-yellow-400" },
  { id: "TRC20", name: "TRC20", chain: "TRON Network", color: "text-red-400", badge: "bg-red-500/15 text-red-400" },
];

function generateAddress(network: string): string {
  const hex = "0123456789abcdef";
  const b58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  if (network === "BEP20") {
    let addr = "0x";
    for (let i = 0; i < 40; i++) addr += hex[Math.floor(Math.random() * 16)];
    return addr;
  }
  let addr = "T";
  for (let i = 0; i < 33; i++) addr += b58[Math.floor(Math.random() * 58)];
  return addr;
}

const PRESETS = [50, 100, 250, 500, 1000];

export const DepositModal = ({ open, onClose, onDeposit, deposits }: DepositModalProps) => {
  const [tab, setTab] = useState<"new" | "history">("new");
  const [coin, setCoin] = useState("USDT");
  const [network, setNetwork] = useState("BEP20");
  const [amount, setAmount] = useState(100);
  const [step, setStep] = useState<"form" | "address" | "success">("form");
  const [copied, setCopied] = useState(false);
  const [depositAddress, setDepositAddress] = useState("");

  useEffect(() => {
    setDepositAddress(generateAddress(network));
  }, [network, coin]);

  const pendingDeposits = useMemo(() => deposits.filter(d => d.status === "pending"), [deposits]);
  const completedDeposits = useMemo(() => deposits.filter(d => d.status !== "pending"), [deposits]);
  const pendingCount = pendingDeposits.length;

  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (step === "form" && amount > 0) {
      setStep("address");
      return;
    }
    if (step === "address") {
      onDeposit(amount, coin, network, depositAddress);
      setStep("success");
    }
  };

  const handleClose = () => {
    setStep("form");
    onClose();
  };

  const selectedCoin = COINS.find(c => c.id === coin)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#0c1018] shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">💰 Deposit Crypto</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Send crypto to your trading account</p>
          </div>
          <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/60 px-5">
          <button onClick={() => { setTab("new"); setStep("form"); }} className={`px-4 py-2.5 text-xs font-bold transition cursor-pointer border-b-2 ${tab === "new" ? "text-emerald-400 border-emerald-400" : "text-slate-500 border-transparent hover:text-slate-300"}`}>
            New Deposit
          </button>
          <button onClick={() => setTab("history")} className={`px-4 py-2.5 text-xs font-bold transition cursor-pointer border-b-2 flex items-center gap-1.5 ${tab === "history" ? "text-emerald-400 border-emerald-400" : "text-slate-500 border-transparent hover:text-slate-300"}`}>
            History
            {pendingCount > 0 && <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">{pendingCount}</span>}
          </button>
        </div>

        <div className="p-5">
          {tab === "history" ? (
            /* ─── HISTORY TAB ─── */
            <div>
              {deposits.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2 opacity-50">📋</div>
                  <div className="text-sm text-slate-500">No deposit history</div>
                  <div className="text-[11px] text-slate-700 mt-1">Make your first deposit to get started</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Pending */}
                  {pendingDeposits.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Pending Deposits ({pendingDeposits.length})
                      </h3>
                      <div className="space-y-1.5">
                        {pendingDeposits.map(d => (
                          <div key={d.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 animate-fade-in">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{COINS.find(c => c.id === d.coin)?.icon}</span>
                                <div>
                                  <span className="font-bold text-white text-xs">${d.amount.toFixed(2)}</span>
                                  <span className="text-[10px] text-slate-500 ml-1.5">{d.coin}</span>
                                </div>
                              </div>
                              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400 animate-pulse">⏳ Pending</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px]">{d.network}</span>
                              <span>{new Date(d.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="mt-1.5 text-[9px] font-mono text-slate-600 truncate">To: {d.walletAddress}</div>
                            {/* Progress bar animation */}
                            <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" style={{ width: "60%" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed */}
                  {completedDeposits.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Completed ({completedDeposits.length})
                      </h3>
                      <div className="space-y-1.5">
                        {completedDeposits.slice().reverse().map(d => (
                          <div key={d.id} className="rounded-lg border border-slate-800/60 bg-slate-900/30 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{COINS.find(c => c.id === d.coin)?.icon}</span>
                                <div>
                                  <span className="font-bold text-white text-xs">${d.amount.toFixed(2)}</span>
                                  <span className="text-[10px] text-slate-500 ml-1.5">{d.coin}</span>
                                </div>
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                                {d.status === "completed" ? "✓ Completed" : "✗ Failed"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px]">{d.network}</span>
                              <span>{new Date(d.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          ) : step === "success" ? (
            /* ─── SUCCESS ─── */
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/40">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-lg font-bold text-white">Deposit Submitted!</h3>
              <p className="mt-2 text-sm text-slate-400">${amount} {coin} via {network}</p>
              <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-[11px] text-amber-300">
                <p className="font-bold">⏳ Confirming on blockchain...</p>
                <p className="text-[10px] text-amber-400/60 mt-0.5">Your deposit will be credited shortly (auto-confirms in demo).</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setTab("history")} className="flex-1 rounded-full bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer">View History</button>
                <button onClick={handleClose} className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition cursor-pointer">Done</button>
              </div>
            </div>

          ) : step === "address" ? (
            /* ─── ADDRESS STEP ─── */
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-[11px] text-amber-300 font-medium">
                ⚠️ Send exactly <span className="font-bold">${amount} in {coin}</span> to the address below via <span className="font-bold">{network}</span> network.
              </div>

              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${selectedCoin.color} text-lg text-white`}>
                    {selectedCoin.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">{coin} Deposit</div>
                    <div className="text-[10px] text-slate-500">{network} Network</div>
                  </div>
                </div>

                {/* QR Placeholder */}
                <div className="mx-auto mb-3 h-28 w-28 rounded-xl bg-white p-2 flex items-center justify-center">
                  <div className="grid grid-cols-7 gap-px">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div key={i} className={`h-3 w-3 ${Math.random() > 0.4 ? "bg-slate-900" : "bg-white"}`} />
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 mb-1">Deposit Address ({network})</div>
                <div className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 font-mono text-[11px] text-emerald-400 break-all text-left">
                  {depositAddress}
                </div>
                <button onClick={handleCopy} className="mt-2 rounded-lg bg-emerald-500/15 px-4 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition cursor-pointer">
                  {copied ? "Copied! ✓" : "📋 Copy Address"}
                </button>
              </div>

              <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">Coin</span><span className="text-white font-medium">{selectedCoin.icon} {coin}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="text-white">{network}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="text-white font-mono font-bold">${amount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fee</span><span className="text-emerald-400 font-mono">Free</span></div>
              </div>

              <div className="rounded-lg bg-rose-500/8 border border-rose-500/15 px-3 py-2 text-[10px] text-rose-300/80">
                ⚠️ Only send <span className="font-bold">{coin}</span> on <span className="font-bold">{network}</span> network. Sending other assets or using wrong network may result in permanent loss.
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep("form")} className="flex-1 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer">← Back</button>
                <button onClick={handleConfirm} className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition cursor-pointer">I've Sent the Payment</button>
              </div>
            </div>

          ) : (
            /* ─── FORM STEP ─── */
            <div className="space-y-4">
              {/* Coin Selection */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-400">Select Coin</label>
                <div className="grid grid-cols-4 gap-2">
                  {COINS.map(c => (
                    <button key={c.id} onClick={() => setCoin(c.id)} className={`rounded-lg border p-2.5 text-center transition cursor-pointer ${coin === c.id ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600"}`}>
                      <div className={`flex h-8 w-8 mx-auto items-center justify-center rounded-lg bg-gradient-to-br ${c.color} text-sm text-white mb-1`}>{c.icon}</div>
                      <div className={`text-[11px] font-bold ${coin === c.id ? "text-emerald-400" : "text-slate-400"}`}>{c.id}</div>
                      <div className="text-[9px] text-slate-600">{c.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Network Selection */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-400">Select Network</label>
                <div className="grid grid-cols-2 gap-2">
                  {NETWORKS.map(n => (
                    <button key={n.id} onClick={() => setNetwork(n.id)} className={`rounded-lg border p-3 text-left transition cursor-pointer ${network === n.id ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${n.badge}`}>{n.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{n.chain}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-400">Deposit Amount (USD)</label>
                <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 font-mono text-sm focus-within:border-emerald-500/40 transition">
                  <span className="mr-1.5 text-slate-500 font-bold">$</span>
                  <input type="number" className="h-5 w-full bg-transparent text-white outline-none" min={10} value={Number.isNaN(amount) ? "" : amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
                </div>
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {PRESETS.map(v => (
                    <button key={v} onClick={() => setAmount(v)} className={`rounded-lg py-1.5 text-[11px] font-semibold transition cursor-pointer ${amount === v ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-slate-800 text-slate-500 hover:bg-slate-700"}`}>${v}</button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">Coin</span><span className="text-white font-medium">{selectedCoin.icon} {coin}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="text-white">{network}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Deposit Fee</span><span className="text-emerald-400 font-mono">Free</span></div>
                <div className="border-t border-slate-700 pt-1.5 flex justify-between font-bold">
                  <span className="text-slate-300">You'll receive</span>
                  <span className="text-emerald-400 font-mono">${amount > 0 ? amount.toFixed(2) : "0.00"}</span>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-3 py-2.5 text-[11px] text-emerald-300">
                <p className="font-bold">⚡ Auto-confirmed in demo</p>
                <p className="text-[10px] text-emerald-400/60 mt-0.5">Deposits are automatically confirmed after a short delay.</p>
              </div>

              <button onClick={handleConfirm} disabled={amount <= 0} className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                Continue → Get Deposit Address
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
