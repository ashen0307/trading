import type { KYCStatus } from "./KYCModal";

interface NavbarProps {
  balance: number;
  onDepositClick: () => void;
  onWithdrawClick: () => void;
  onProfileClick: () => void;
  onReferralClick: () => void;
  kycStatus: KYCStatus;
  onKYCClick: () => void;
  profileInitials: string;
  avatarColor: string;
}

const KYC_BADGES: Record<KYCStatus, { label: string; classes: string }> = {
  NOT_STARTED: { label: "Unverified", classes: "bg-rose-500/15 text-rose-400 ring-rose-500/30" },
  IN_PROGRESS: { label: "In Progress", classes: "bg-amber-500/15 text-amber-400 ring-amber-500/30" },
  PENDING_REVIEW: { label: "Under Review", classes: "bg-amber-500/15 text-amber-400 ring-amber-500/30 animate-pulse" },
  VERIFIED: { label: "Verified ✓", classes: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
  REJECTED: { label: "Rejected", classes: "bg-rose-500/15 text-rose-400 ring-rose-500/30" },
};

export const Navbar = ({
  balance,
  onDepositClick,
  onWithdrawClick,
  onProfileClick,
  onReferralClick,
  kycStatus,
  onKYCClick,
  profileInitials,
  avatarColor,
}: NavbarProps) => {
  const badge = KYC_BADGES[kycStatus];

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800/80 bg-[#0a0e16]/95 px-4 py-2.5 backdrop-blur-xl sm:px-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25">
          <span className="text-lg font-black">B</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-white">BinaryPro</div>
          <div className="text-[10px] text-slate-600 hidden sm:block">Trading Terminal</div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 text-xs sm:gap-2">
        {/* KYC Badge */}
        <button
          onClick={onKYCClick}
          className={`hidden md:block rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 transition hover:brightness-125 cursor-pointer ${badge.classes}`}
        >
          KYC: {badge.label}
        </button>

        {/* Referral */}
        <button
          onClick={onReferralClick}
          className="hidden sm:flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-400 ring-1 ring-violet-500/25 hover:bg-violet-500/20 transition cursor-pointer"
        >
          🎁 Refer
        </button>

        {/* Balance */}
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-400 ring-1 ring-emerald-500/25">
          <span className="text-[10px] font-medium hidden sm:inline">Balance</span>
          <span className="font-mono text-xs font-bold">${balance.toFixed(2)}</span>
        </div>

        {/* Deposit */}
        <button
          onClick={onDepositClick}
          className="rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 cursor-pointer"
        >
          Deposit
        </button>

        {/* Withdraw */}
        <button
          onClick={onWithdrawClick}
          className="hidden sm:block rounded-full bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-300 ring-1 ring-slate-700 transition hover:bg-slate-700 hover:text-white cursor-pointer"
        >
          Withdraw
        </button>

        {/* Profile Avatar */}
        <button
          onClick={onProfileClick}
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor} text-[11px] font-bold text-white shadow-md transition hover:scale-110 hover:shadow-lg cursor-pointer ring-2 ring-slate-800`}
        >
          {profileInitials}
        </button>
      </div>
    </header>
  );
};
