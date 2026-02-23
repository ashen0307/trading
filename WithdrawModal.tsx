import { useState, useMemo } from "react";

export interface WithdrawRecord {
  id: string;
  coin: string;
  network: string;
  amount: number;
  fee: number;
  netAmount: number;
  toAddress: string;
  status: "pending" | "completed" | "failed";
  createdAt: number;
}

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  balance: number;
  onWithdraw: (amount: number, coin: string, network: string, toAddress: string) => void;
  kycVerified: boolean;
  withdrawals: WithdrawRecord[];
}

const COINS = [
  { id: "USDT", name: "Tether", icon: "💵", fee: 1, color: "from-green-500 to-emerald-600" },
  { id: "BTC", name: "Bitcoin", icon: "₿", fee: 5, color: "from-orange-500 to-amber-600" },
  { id: "ETH", name: "Ethereum", icon: "Ξ", fee: 3, color: "from-blue-500 to-indigo-600" },
  { id: "TRX", name: "TRON", icon: "◈", fee: 0.5, color: "from-red-500 to-rose-600" },
];

const NETWORKS = [
  { id: "BEP20", name: "BEP20", chain: "BNB Smart Chain", placeholder: "0x...", badge: "bg-yellow-500/15 text-yellow-400" },
  { id: "TRC20", name: "TRC20", chain: "TRON Network", placeholder: "T...", badge: "bg-red-500/15 text-red-400" },
];

export const WithdrawModal = ({ open, onClose, balance, onWithdraw, kycVerified, withdrawals }: WithdrawModalProps) => {
  const [tab, setTab] = useState<"new" | "history">("new");
  const [coin, setCoin] = useState("USDT");
  const [network, setNetwork] = useState("BEP20");
  const [amount, setAmount] = useState(50);
  const [address, setAddress] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");

  const pendingWithdrawals = useMemo(() => withdrawals.filter(w => w.status === "pending"), [withdrawals]);
  const completedWithdrawals = useMemo(() => withdrawals.filter(w => w.status !== "pending"), [withdrawals]);
  const pendingCount = pendingWithdrawals.length;

  if (!open) return null;

  const selectedCoin = COINS.find(c => c.id === coin)!;
  const selectedNetwork = NETWORKS.find(n => n.id === network)!;
  const fee = selectedCoin.fee;
  const netAmount = Math.max(0, amount - fee);

  const isValidAddress = network === "BEP20"
    ? address.startsWith("0x") && address.length >= 42
    : address.startsWith("T") && address.length >= 30;
  const isValid = amount > fee && amount <= balance && isValidAddress && kycVerified;

  const handleConfirm = () => {
    if (step === "form" && isValid) { setStep("confirm"); return; }
    if (step === "confirm") { onWithdraw(amount, coin, network, address); setStep("success"); }
  };

  const handleClose = () => { setStep("form"); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#0c1018] shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">💸 Withdraw Crypto</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Available: <span className="font-mono text-emerald-400 font-bold">${balance.toFixed(2)}</span></p>
          </div>
          <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/60 px-5">
          <button onClick={() => { setTab("new"); setStep("form"); }} className={`px-4 py-2.5 text-xs font-bold transition cursor-pointer border-b-2 ${tab === "new" ? "text-emerald-400 border-emerald-400" : "text-slate-500 border-transparent hover:text-slate-300"}`}>
            New Withdrawal
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
              {withdrawals.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2 opacity-50">📋</div>
                  <div className="text-sm text-slate-500">No withdrawal history</div>
                  <div className="text-[11px] text-slate-700 mt-1">Your withdrawals will appear here</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Pending */}
                  {pendingWithdrawals.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Pending Withdrawals ({pendingWithdrawals.length})
                      </h3>
                      <div className="space-y-1.5">
                        {pendingWithdrawals.map(w => (
                          <div key={w.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 animate-fade-in">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{COINS.find(c => c.id === w.coin)?.icon}</span>
                                <div>
                                  <span className="font-bold text-white text-xs">${w.amount.toFixed(2)}</span>
                                  <span className="text-[10px] text-slate-500 ml-1.5">{w.coin}</span>
                                </div>
                              </div>
                              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400 animate-pulse">⏳ Processing</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px]">{w.network}</span>
                              <span>Fee: ${w.fee.toFixed(2)} · Net: ${w.netAmount.toFixed(2)}</span>
                            </div>
                            <div className="text-[9px] font-mono text-slate-600 truncate">To: {w.toAddress}</div>
                            <div className="flex items-center justify-between text-[10px] text-slate-600 mt-1">
                              <span>{new Date(w.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" style={{ width: "40%" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed */}
                  {completedWithdrawals.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Completed ({completedWithdrawals.length})
                      </h3>
                      <div className="space-y-1.5">
                        {completedWithdrawals.slice().reverse().map(w => (
                          <div key={w.id} className="rounded-lg border border-slate-800/60 bg-slate-900/30 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{COINS.find(c => c.id === w.coin)?.icon}</span>
                                <div>
                                  <span className="font-bold text-white text-xs">${w.amount.toFixed(2)}</span>
                                  <span className="text-[10px] text-slate-500 ml-1.5">{w.coin}</span>
                                </div>
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${w.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                                {w.status === "completed" ? "✓ Completed" : "✗ Failed"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px]">{w.network}</span>
                              <span>Fee: ${w.fee.toFixed(2)} · Net: ${w.netAmount.toFixed(2)}</span>
                            </div>
                            <div className="text-[9px] font-mono text-slate-600 truncate">To: {w.toAddress}</div>
                            <div className="text-[10px] text-slate-600 mt-1">{new Date(w.createdAt).toLocaleString()}</div>
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
              <h3 className="text-lg font-bold text-white">Withdrawal Submitted!</h3>
              <p className="mt-2 text-sm text-slate-400">${netAmount.toFixed(2)} {coin} via {network}</p>
              <div className="mt-4 rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 text-left space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="text-white font-mono">${amount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fee</span><span className="text-amber-400 font-mono">-${fee.toFixed(2)}</span></div>
                <div className="border-t border-slate-700 pt-1.5 flex justify-between font-bold"><span className="text-slate-300">Net Amount</span><span className="text-emerald-400 font-mono">${netAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="text-white">{network}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">To</span><span className="text-slate-300 font-mono text-[10px] truncate max-w-[200px]">{address}</span></div>
              </div>
              <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-300">
                ⏳ Processing... auto-completes in demo mode.
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setTab("history")} className="flex-1 rounded-full bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer">View History</button>
                <button onClick={handleClose} className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition cursor-pointer">Done</button>
              </div>
            </div>

          ) : step === "confirm" ? (
            /* ─── CONFIRM ─── */
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-[11px] text-amber-300 font-medium">
                ⚠️ Please review your withdrawal details carefully
              </div>

              <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4 space-y-2 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">Coin</span><span className="text-white font-medium">{selectedCoin.icon} {coin}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="text-white">{network}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Destination</span><span className="text-slate-300 font-mono text-[10px] truncate max-w-[200px]">{address}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="text-white font-mono">${amount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fee ({coin})</span><span className="text-amber-400 font-mono">${fee.toFixed(2)}</span></div>
                <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
                  <span className="text-slate-300">You'll receive</span>
                  <span className="text-emerald-400 font-mono text-sm">${netAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Balance after</span><span className="text-white font-mono">${(balance - amount).toFixed(2)}</span></div>
              </div>

              <div className="rounded-lg bg-rose-500/8 border border-rose-500/15 px-3 py-2 text-[10px] text-rose-300/80">
                ⚠️ Withdrawals are irreversible. Double-check the address and network.
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep("form")} className="flex-1 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer">← Back</button>
                <button onClick={handleConfirm} className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition cursor-pointer">Confirm Withdrawal</button>
              </div>
            </div>

          ) : (
            /* ─── FORM STEP ─── */
            <div className="space-y-4">
              {!kycVerified && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 text-[11px] text-rose-300">
                  <span className="font-bold">⚠️ KYC Required:</span> Complete identity verification before withdrawing.
                </div>
              )}

              {/* Coin Selection */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-400">Select Coin</label>
                <div className="grid grid-cols-4 gap-2">
                  {COINS.map(c => (
                    <button key={c.id} onClick={() => setCoin(c.id)} className={`rounded-lg border p-2.5 text-center transition cursor-pointer ${coin === c.id ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600"}`}>
                      <div className={`flex h-8 w-8 mx-auto items-center justify-center rounded-lg bg-gradient-to-br ${c.color} text-sm text-white mb-1`}>{c.icon}</div>
                      <div className={`text-[11px] font-bold ${coin === c.id ? "text-emerald-400" : "text-slate-400"}`}>{c.id}</div>
                      <div className="text-[9px] text-slate-600">Fee: ${c.fee}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Network Selection */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-400">Select Network</label>
                <div className="grid grid-cols-2 gap-2">
                  {NETWORKS.map(n => (
                    <button key={n.id} onClick={() => { setNetwork(n.id); setAddress(""); }} className={`rounded-lg border p-3 text-left transition cursor-pointer ${network === n.id ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${n.badge}`}>{n.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{n.chain}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-400">
                  {coin} Wallet Address ({network})
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 font-mono text-xs text-white outline-none placeholder-slate-600 focus:border-emerald-500/40 transition"
                  placeholder={selectedNetwork.placeholder + " Enter your " + network + " wallet address"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value.trim())}
                />
                {address.length > 0 && !isValidAddress && (
                  <p className="mt-1 text-[10px] text-rose-400">
                    ⚠️ Invalid {network} address. {network === "BEP20" ? "Must start with 0x (42+ chars)" : "Must start with T (30+ chars)"}
                  </p>
                )}
                {address.length > 0 && isValidAddress && (
                  <p className="mt-1 text-[10px] text-emerald-400">✓ Valid {network} address</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Withdraw Amount (USD)</label>
                  <span className="text-[10px] text-slate-600 font-mono">Min: ${(fee + 1).toFixed(0)}</span>
                </div>
                <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 font-mono text-sm focus-within:border-emerald-500/40 transition">
                  <span className="mr-1.5 text-slate-500 font-bold">$</span>
                  <input type="number" className="h-5 w-full bg-transparent text-white outline-none" min={fee + 1} max={balance} value={Number.isNaN(amount) ? "" : amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
                </div>
                <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                  {[25, 50, 100, 250, 0].map((v, i) => (
                    <button key={i} onClick={() => setAmount(i === 4 ? Math.floor(balance) : v)} className={`rounded-lg py-1.5 text-[11px] font-semibold transition cursor-pointer ${amount === (i === 4 ? Math.floor(balance) : v) ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-slate-800 text-slate-500 hover:bg-slate-700"}`}>
                      {i === 4 ? "Max" : `$${v}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Summary */}
              <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">Coin</span><span className="text-white font-medium">{selectedCoin.icon} {coin}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="text-white">{network}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="text-white font-mono">${amount > 0 ? amount.toFixed(2) : "0.00"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Network Fee</span><span className="text-amber-400 font-mono">-${fee.toFixed(2)}</span></div>
                <div className="border-t border-slate-700 pt-1.5 flex justify-between font-bold">
                  <span className="text-slate-300">You receive</span>
                  <span className="text-emerald-400 font-mono">${netAmount > 0 ? netAmount.toFixed(2) : "0.00"}</span>
                </div>
              </div>

              <button onClick={handleConfirm} disabled={!isValid} className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                {!kycVerified ? "🔒 KYC Required" : !isValidAddress && address.length > 0 ? "Invalid Address" : "Continue to Review →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
