import { useState } from "react";

export interface ReferralData {
  code: string;
  referrals: ReferralEntry[];
  totalEarnings: number;
}

export interface ReferralEntry {
  id: string;
  name: string;
  joinDate: string;
  tradeVolume: number;
  commission: number;
  status: "active" | "inactive";
}

interface ReferralModalProps {
  open: boolean;
  onClose: () => void;
  referralData: ReferralData;
  onSimulateReferral: () => void;
}

export const ReferralModal = ({ open, onClose, referralData, onSimulateReferral }: ReferralModalProps) => {
  const [copied, setCopied] = useState("");

  if (!open) return null;

  const referralLink = `https://binarypro.com/ref/${referralData.code}`;
  const activeRefs = referralData.referrals.filter((r) => r.status === "active").length;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#0c1018] shadow-2xl animate-slide-up">
        <div className="border-b border-slate-800/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">🎁 Referral Program</h2>
              <p className="text-[11px] text-slate-500">Earn <span className="text-emerald-400 font-bold">0.5%</span> commission on referral trades</p>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-emerald-500/60">Earnings</div>
              <div className="mt-1 font-mono text-lg font-bold text-emerald-400">${referralData.totalEarnings.toFixed(2)}</div>
            </div>
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-600">Total</div>
              <div className="mt-1 font-mono text-lg font-bold text-white">{referralData.referrals.length}</div>
            </div>
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-600">Active</div>
              <div className="mt-1 font-mono text-lg font-bold text-cyan-400">{activeRefs}</div>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-emerald-500/15 p-4">
            <h3 className="text-xs font-bold text-emerald-400 mb-2">💡 How It Works</h3>
            <div className="space-y-2">
              {[
                { step: "1", text: "Share your unique referral code or link" },
                { step: "2", text: "Friends sign up and start trading" },
                { step: "3", text: "You earn 0.5% on every trade they place" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">{item.step}</div>
                  <p className="text-[11px] text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Code */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-slate-400">Your Referral Code</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5">
                <span className="font-mono text-lg font-bold tracking-widest text-emerald-400">{referralData.code}</span>
              </div>
              <button onClick={() => handleCopy(referralData.code, "code")} className="rounded-lg bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-400 transition cursor-pointer whitespace-nowrap">
                {copied === "code" ? "Copied! ✓" : "Copy"}
              </button>
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-slate-400">Referral Link</label>
            <div className="flex gap-2">
              <input readOnly value={referralLink} className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400 font-mono outline-none" />
              <button onClick={() => handleCopy(referralLink, "link")} className="rounded-lg bg-slate-700 px-4 text-xs font-medium text-slate-300 hover:bg-slate-600 transition cursor-pointer">
                {copied === "link" ? "Copied! ✓" : "Copy"}
              </button>
            </div>
          </div>

          {/* Share */}
          <div className="flex gap-2">
            {[
              { label: "📧 Email", color: "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" },
              { label: "🐦 Twitter", color: "bg-sky-500/15 text-sky-400 hover:bg-sky-500/25" },
              { label: "💬 WhatsApp", color: "bg-green-500/15 text-green-400 hover:bg-green-500/25" },
            ].map((btn) => (
              <button key={btn.label} onClick={() => handleCopy(referralLink, "share")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer ${btn.color}`}>{btn.label}</button>
            ))}
          </div>

          {/* Simulate */}
          <button onClick={onSimulateReferral} className="w-full rounded-lg bg-violet-500/15 border border-violet-500/25 px-4 py-2.5 text-xs font-bold text-violet-400 hover:bg-violet-500/25 transition cursor-pointer">
            ✨ Simulate New Referral (Demo)
          </button>

          {/* Referral List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Your Referrals</h3>
            {referralData.referrals.length === 0 ? (
              <div className="rounded-xl bg-slate-800/30 border border-slate-700/40 p-8 text-center">
                <div className="text-3xl mb-2 opacity-50">👥</div>
                <div className="text-sm text-slate-500">No referrals yet</div>
                <div className="text-[11px] text-slate-700 mt-1">Share your code to start earning</div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700/40 overflow-hidden">
                <div className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] gap-2 bg-slate-800/60 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <span>User</span><span>Volume</span><span>Commission</span><span>Status</span>
                </div>
                <div className="max-h-[180px] overflow-y-auto">
                  {referralData.referrals.map((r) => (
                    <div key={r.id} className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] gap-2 items-center border-t border-slate-800/40 px-3 py-2.5 text-xs">
                      <div><div className="font-medium text-slate-300">{r.name}</div><div className="text-[10px] text-slate-600">{r.joinDate}</div></div>
                      <div className="font-mono text-slate-400">${r.tradeVolume.toFixed(0)}</div>
                      <div className="font-mono text-emerald-400 font-bold">+${r.commission.toFixed(2)}</div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-center ${r.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3 text-[11px] text-slate-500">
            <span className="text-emerald-400 font-bold">ℹ️ Commission: 0.5%</span> — Calculated on each referral trade. Instant credit. No cap.
          </div>
        </div>
      </div>
    </div>
  );
};
