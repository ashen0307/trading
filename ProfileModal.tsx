import { useState } from "react";
import type { KYCStatus } from "./KYCModal";
import type { TradeRecord } from "./TradeHistory";

export interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  country: string;
  avatarColor: string;
  joinDate: string;
  accountId: string;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  tradeAlerts: boolean;
}

/* Re-export nothing but note: 2FA modal is opened separately via onOpen2FA callback */

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  balance: number;
  kycStatus: KYCStatus;
  closedTrades: TradeRecord[];
  totalDeposited: number;
  totalWithdrawn: number;
  referralCode: string;
  referralEarnings: number;
  referralCount: number;
  profileData: ProfileData;
  onProfileUpdate: (data: ProfileData) => void;
  onOpen2FA: () => void;
}

const AVATAR_COLORS = [
  "from-emerald-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-blue-500 to-indigo-500",
  "from-teal-500 to-green-500",
];

const TABS = ["Overview", "Security", "Settings"];

const KYC_INFO: Record<KYCStatus, { label: string; color: string }> = {
  NOT_STARTED: { label: "Unverified", color: "text-rose-400" },
  IN_PROGRESS: { label: "In Progress", color: "text-amber-400" },
  PENDING_REVIEW: { label: "Under Review", color: "text-amber-400" },
  VERIFIED: { label: "Verified ✓", color: "text-emerald-400" },
  REJECTED: { label: "Rejected", color: "text-rose-400" },
};

export const ProfileModal = ({
  open, onClose, balance, kycStatus, closedTrades,
  totalDeposited, totalWithdrawn, referralCode, referralEarnings, referralCount,
  profileData, onProfileUpdate, onOpen2FA,
}: ProfileModalProps) => {
  const [tab, setTab] = useState(0);
  const [editName, setEditName] = useState(profileData.displayName);
  const [editEmail, setEditEmail] = useState(profileData.email);
  const [editPhone, setEditPhone] = useState(profileData.phone);

  if (!open) return null;

  const totalPnl = closedTrades.reduce((s, t) => s + t.payout, 0);
  const wins = closedTrades.filter((t) => t.payout > 0).length;
  const losses = closedTrades.filter((t) => t.payout < 0).length;
  const winRate = closedTrades.length ? (wins / closedTrades.length) * 100 : 0;
  const totalVolume = closedTrades.reduce((s, t) => s + t.amount, 0);
  const bestTrade = closedTrades.length ? Math.max(...closedTrades.map((t) => t.payout)) : 0;
  const worstTrade = closedTrades.length ? Math.min(...closedTrades.map((t) => t.payout)) : 0;
  const kycInfo = KYC_INFO[kycStatus];
  const initials = profileData.displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";

  const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder-slate-600 focus:border-emerald-500/50 transition";

  const handleSave = () => {
    onProfileUpdate({ ...profileData, displayName: editName || profileData.displayName, email: editEmail || profileData.email, phone: editPhone || profileData.phone });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#0c1018] shadow-2xl animate-slide-up">
        {/* Header Banner */}
        <div className="relative border-b border-slate-800/60">
          <div className="h-20 rounded-t-2xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-violet-600/20" />
          <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 transition cursor-pointer">✕</button>
          <div className="px-6 pb-4">
            <div className="-mt-10 flex items-end gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${profileData.avatarColor} text-2xl font-bold text-white shadow-xl ring-4 ring-[#0c1018]`}>{initials}</div>
              <div className="pb-1">
                <h2 className="text-lg font-bold text-white">{profileData.displayName}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">{profileData.accountId}</span>
                  <span>•</span>
                  <span className={`font-semibold ${kycInfo.color}`}>{kycInfo.label}</span>
                  <span>•</span>
                  <span>Joined {profileData.joinDate}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-0 px-6">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} className={`px-4 py-2 text-xs font-bold transition cursor-pointer border-b-2 ${tab === i ? "text-emerald-400 border-emerald-400" : "text-slate-500 border-transparent hover:text-slate-300"}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[320px]">
          {tab === 0 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Account Overview</h3>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    { label: "Balance", value: `$${balance.toFixed(2)}`, color: "text-white" },
                    { label: "Total P/L", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? "text-emerald-400" : "text-rose-400" },
                    { label: "Deposited", value: `$${totalDeposited.toFixed(2)}`, color: "text-cyan-400" },
                    { label: "Withdrawn", value: `$${totalWithdrawn.toFixed(2)}`, color: "text-amber-400" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-600">{s.label}</div>
                      <div className={`mt-1 font-mono text-sm font-bold ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Trading Performance</h3>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    { label: "Total Trades", value: String(closedTrades.length), color: "text-white" },
                    { label: "Win Rate", value: `${winRate.toFixed(1)}%`, color: winRate >= 55 ? "text-emerald-400" : "text-slate-300" },
                    { label: "Wins / Losses", value: `${wins} / ${losses}`, color: "text-slate-300" },
                    { label: "Volume", value: `$${totalVolume.toFixed(0)}`, color: "text-white" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-600">{s.label}</div>
                      <div className={`mt-1 font-mono text-sm font-bold ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 p-3">
                    <div className="text-[10px] uppercase text-emerald-500/60">Best Trade</div>
                    <div className="mt-1 font-mono text-sm font-bold text-emerald-400">+${bestTrade.toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl bg-rose-500/8 border border-rose-500/15 p-3">
                    <div className="text-[10px] uppercase text-rose-500/60">Worst Trade</div>
                    <div className="mt-1 font-mono text-sm font-bold text-rose-400">${worstTrade.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              {closedTrades.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Win/Loss Ratio</h3>
                  <div className="h-3 flex rounded-full overflow-hidden bg-slate-800">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${winRate}%` }} />
                    <div className="bg-rose-500 transition-all" style={{ width: `${100 - winRate}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px]">
                    <span className="text-emerald-400">{wins} Wins ({winRate.toFixed(1)}%)</span>
                    <span className="text-rose-400">{losses} Losses ({(100 - winRate).toFixed(1)}%)</span>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Referral</h3>
                <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><div className="text-[10px] uppercase text-slate-600">Code</div><div className="mt-1 font-mono text-sm font-bold text-emerald-400">{referralCode}</div></div>
                    <div><div className="text-[10px] uppercase text-slate-600">Referrals</div><div className="mt-1 font-mono text-sm font-bold text-white">{referralCount}</div></div>
                    <div><div className="text-[10px] uppercase text-slate-600">Earnings</div><div className="mt-1 font-mono text-sm font-bold text-emerald-400">${referralEarnings.toFixed(2)}</div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 1 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Security</h3>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">Two-Factor Authentication</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {profileData.twoFactorEnabled ? "2FA is currently active" : "Add extra security to your account"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${profileData.twoFactorEnabled ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
                      {profileData.twoFactorEnabled ? "Enabled ✓" : "Disabled"}
                    </span>
                    <button
                      onClick={onOpen2FA}
                      className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/25 hover:bg-emerald-500/25 transition cursor-pointer"
                    >
                      {profileData.twoFactorEnabled ? "Manage" : "Enable"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4 space-y-3">
                <div className="text-sm font-bold text-white">Change Password</div>
                <input type="password" className={inputClass} placeholder="Current password" />
                <input type="password" className={inputClass} placeholder="New password" />
                <input type="password" className={inputClass} placeholder="Confirm password" />
                <button className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-400 transition cursor-pointer">Update Password</button>
              </div>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
                <div className="text-sm font-bold text-white mb-2">Active Sessions</div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-2">
                  <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-400" /><div><div className="text-xs text-white font-medium">Current Session</div><div className="text-[10px] text-slate-600">Chrome • Web</div></div></div>
                  <span className="text-[10px] text-emerald-400 font-medium">Active</span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
                <div className="flex items-center justify-between"><div><div className="text-sm font-bold text-white">KYC Status</div></div><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${kycInfo.color} bg-slate-800 ring-1 ring-slate-700`}>{kycInfo.label}</span></div>
              </div>
            </div>
          )}

          {tab === 2 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Settings</h3>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4 space-y-3">
                <div className="text-sm font-bold text-white">Personal Info</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Name</label><input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Email</label><input className={inputClass} value={editEmail} onChange={(e) => setEditEmail(e.target.value)} /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone</label><input className={inputClass} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
                  <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Country</label><input className={inputClass} value={profileData.country} disabled /></div>
                </div>
                <button onClick={handleSave} className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-400 transition cursor-pointer">Save Changes</button>
              </div>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
                <div className="text-sm font-bold text-white mb-3">Avatar Color</div>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button key={c} onClick={() => onProfileUpdate({ ...profileData, avatarColor: c })} className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c} transition ring-2 cursor-pointer ${profileData.avatarColor === c ? "ring-white scale-110" : "ring-transparent hover:ring-slate-500"}`} />
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4 space-y-3">
                <div className="text-sm font-bold text-white">Notifications</div>
                {[
                  { key: "emailNotifications" as const, label: "Email Notifications", desc: "Trade confirmations via email", enabled: profileData.emailNotifications },
                  { key: "tradeAlerts" as const, label: "Trade Alerts", desc: "Alerts when trades settle", enabled: profileData.tradeAlerts },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <div><div className="text-xs font-medium text-slate-300">{item.label}</div><div className="text-[10px] text-slate-600">{item.desc}</div></div>
                    <button onClick={() => onProfileUpdate({ ...profileData, [item.key]: !item.enabled })} className={`relative h-6 w-11 rounded-full transition cursor-pointer ${item.enabled ? "bg-emerald-500" : "bg-slate-700"}`}>
                      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition ${item.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 p-4">
                <div className="text-sm font-bold text-rose-400 mb-1">Danger Zone</div>
                <p className="text-[11px] text-slate-500 mb-3">Permanently delete your account and all data.</p>
                <button className="rounded-lg bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-400 ring-1 ring-rose-500/25 hover:bg-rose-500/25 transition cursor-pointer">Delete Account</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
