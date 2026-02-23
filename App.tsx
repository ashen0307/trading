import { useEffect, useMemo, useReducer, useState, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { AssetSelector, type Asset } from "./components/AssetSelector";
import { CandleChart, type Candle } from "./components/CandleChart";
import { TradingPanel, type Direction } from "./components/TradingPanel";
import { TradeHistory, type TradeRecord } from "./components/TradeHistory";
import { StatsBar } from "./components/StatsBar";
import { DepositModal, type DepositRecord } from "./components/DepositModal";
import { WithdrawModal, type WithdrawRecord } from "./components/WithdrawModal";
import { KYCModal, type KYCStatus } from "./components/KYCModal";
import { ProfileModal, type ProfileData } from "./components/ProfileModal";
import { ReferralModal, type ReferralData, type ReferralEntry } from "./components/ReferralModal";
import { RunningTrades, type OpenTradeView } from "./components/RunningTrades";
import { TwoFactorModal } from "./components/TwoFactorModal";

/* ─── Types ──────────────────────────────────────────────── */

interface LiveAssetState {
  id: string;
  price: number;
  candlesByTf: Record<number, Candle[]>;
}

interface OpenTrade {
  id: string;
  assetId: string;
  direction: Direction;
  amount: number;
  payoutFactor: number;
  entryPrice: number;
  openTime: number;
  expirySeconds: number;
}

/* ─── Withdrawal fee map ─────────────────────────────────── */

const WITHDRAW_FEES: Record<string, number> = {
  USDT: 1,
  BTC: 5,
  ETH: 3,
  TRX: 0.5,
};

/* ─── State ──────────────────────────────────────────────── */

interface AppState {
  balance: number;
  liveAssets: Record<string, LiveAssetState>;
  openTrades: OpenTrade[];
  closedTrades: TradeRecord[];
  lastResult: { status: "PENDING" | "WIN" | "LOSS" | null; payout: number } | null;
  kycStatus: KYCStatus;
  totalDeposited: number;
  totalWithdrawn: number;
  profileData: ProfileData;
  referralData: ReferralData;
  depositRecords: DepositRecord[];
  withdrawRecords: WithdrawRecord[];
}

type AppAction =
  | { type: "TICK"; now: number }
  | { type: "PLACE_TRADE"; trade: OpenTrade }
  | { type: "ADD_DEPOSIT"; record: DepositRecord }
  | { type: "COMPLETE_DEPOSIT"; id: string }
  | { type: "ADD_WITHDRAW"; record: WithdrawRecord }
  | { type: "COMPLETE_WITHDRAW"; id: string }
  | { type: "SET_KYC"; status: KYCStatus }
  | { type: "UPDATE_PROFILE"; data: ProfileData }
  | { type: "ADD_REFERRAL"; entry: ReferralEntry; earnings: number };

/* ─── Constants ──────────────────────────────────────────── */

const REFERRAL_RATE = 0.005;
const TF_SECONDS = [60, 300, 900, 3600];
const TF_LABEL_MAP: Record<string, number> = { "1m": 60, "5m": 300, "15m": 900, "1H": 3600 };

type TradingAsset = Asset & { basePrice: number };

const ASSETS: TradingAsset[] = [
  { id: "btcusd", symbol: "BTC/USD", name: "Bitcoin vs US Dollar", payout: 0.82, basePrice: 64000 },
  { id: "ethusd", symbol: "ETH/USD", name: "Ethereum vs US Dollar", payout: 0.80, basePrice: 3200 },
  { id: "eurusd", symbol: "EUR/USD", name: "Euro vs US Dollar", payout: 0.78, basePrice: 1.085 },
  { id: "gbpusd", symbol: "GBP/USD", name: "British Pound vs USD", payout: 0.79, basePrice: 1.265 },
  { id: "xauusd", symbol: "XAU/USD", name: "Gold vs US Dollar", payout: 0.81, basePrice: 2300 },
  { id: "spx500", symbol: "SPX500", name: "S&P 500 Index", payout: 0.77, basePrice: 5200 },
];

const ASSET_MAP: Record<string, TradingAsset> = ASSETS.reduce(
  (acc, a) => { acc[a.id] = a; return acc; },
  {} as Record<string, TradingAsset>,
);

/* ─── Helpers ────────────────────────────────────────────── */

function generateCode(prefix: string, len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = prefix;
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function seedCandles(basePrice: number, periodSec: number, count = 500): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const pMs = periodSec * 1000;
  const now = Date.now();
  for (let i = count; i > 0; i--) {
    const time = Math.floor((now - i * pMs) / pMs) * pMs;
    const open = price;
    const vol = basePrice * 0.003 * Math.sqrt(periodSec / 60);
    const drift = (Math.random() - 0.5) * vol;
    const close = open + drift;
    const high = Math.max(open, close) * (1 + Math.random() * 0.0006);
    const low = Math.min(open, close) * (1 - Math.random() * 0.0006);
    candles.push({ time, open, high, low, close });
    price = close;
  }
  return candles;
}

function tickCandles(candles: Candle[], periodSec: number, newPrice: number, now: number): Candle[] {
  const pMs = periodSec * 1000;
  const bucket = Math.floor(now / pMs) * pMs;
  const arr = candles.slice();
  const last = arr[arr.length - 1];
  if (last && last.time === bucket) {
    arr[arr.length - 1] = { ...last, close: newPrice, high: Math.max(last.high, newPrice), low: Math.min(last.low, newPrice) };
  } else {
    arr.push({ time: bucket, open: last ? last.close : newPrice, high: newPrice, low: newPrice, close: newPrice });
  }
  return arr.length > 500 ? arr.slice(-500) : arr;
}

/* ─── Initial State ──────────────────────────────────────── */

function createInitialState(): AppState {
  const liveAssets: Record<string, LiveAssetState> = {};
  for (const asset of ASSETS) {
    const candlesByTf: Record<number, Candle[]> = {};
    for (const tf of TF_SECONDS) candlesByTf[tf] = seedCandles(asset.basePrice, tf);
    liveAssets[asset.id] = { id: asset.id, price: asset.basePrice, candlesByTf };
  }
  return {
    balance: 1000,
    liveAssets,
    openTrades: [],
    closedTrades: [],
    lastResult: null,
    kycStatus: "NOT_STARTED",
    totalDeposited: 0,
    totalWithdrawn: 0,
    depositRecords: [],
    withdrawRecords: [],
    profileData: {
      displayName: "Demo Trader",
      email: "trader@binarypro.com",
      phone: "+1 555 000 1234",
      country: "United States",
      avatarColor: "from-emerald-500 to-cyan-500",
      joinDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      accountId: generateCode("ACC-", 8),
      twoFactorEnabled: false,
      emailNotifications: true,
      tradeAlerts: true,
    },
    referralData: { code: generateCode("BP-", 6), referrals: [], totalEarnings: 0 },
  };
}

/* ─── Reducer ────────────────────────────────────────────── */

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "TICK": {
      const now = action.now;
      const updatedLive: Record<string, LiveAssetState> = {};
      for (const asset of ASSETS) {
        const prev = state.liveAssets[asset.id];
        const shock = (Math.random() - 0.5) * 2 * 0.0008;
        let nextPrice = prev.price * (1 + shock);
        if (!Number.isFinite(nextPrice) || nextPrice <= 0) nextPrice = prev.price;
        const candlesByTf: Record<number, Candle[]> = {};
        for (const tf of TF_SECONDS) candlesByTf[tf] = tickCandles(prev.candlesByTf[tf], tf, nextPrice, now);
        updatedLive[asset.id] = { id: asset.id, price: nextPrice, candlesByTf };
      }

      let newBalance = state.balance;
      const remaining: OpenTrade[] = [];
      let closed = state.closedTrades.slice();
      let lastResult = state.lastResult;

      for (const trade of state.openTrades) {
        const expiryTime = trade.openTime + trade.expirySeconds * 1000;
        if (now >= expiryTime) {
          const exitPrice = (updatedLive[trade.assetId] ?? state.liveAssets[trade.assetId])?.price ?? trade.entryPrice;
          const isWin = trade.direction === "CALL" ? exitPrice > trade.entryPrice : exitPrice < trade.entryPrice;
          const pnl = isWin ? trade.amount * trade.payoutFactor : -trade.amount;
          if (isWin) newBalance += trade.amount + trade.amount * trade.payoutFactor;
          const meta = ASSET_MAP[trade.assetId];
          closed.push({
            id: trade.id, asset: meta?.symbol ?? trade.assetId, direction: trade.direction,
            amount: trade.amount, payout: pnl, entryPrice: trade.entryPrice, exitPrice,
            openedAt: new Date(trade.openTime), closedAt: new Date(expiryTime),
          });
          lastResult = { status: isWin ? "WIN" : "LOSS", payout: pnl };
        } else {
          remaining.push(trade);
        }
      }
      if (closed.length > 50) closed = closed.slice(-50);
      return { ...state, liveAssets: updatedLive, openTrades: remaining, closedTrades: closed, balance: newBalance, lastResult };
    }

    case "PLACE_TRADE":
      return { ...state, balance: state.balance - action.trade.amount, openTrades: [...state.openTrades, action.trade], lastResult: { status: "PENDING", payout: 0 } };

    /* ── Deposit: instant credit + pending record ── */
    case "ADD_DEPOSIT":
      return {
        ...state,
        balance: state.balance + action.record.amount,
        totalDeposited: state.totalDeposited + action.record.amount,
        depositRecords: [...state.depositRecords, action.record],
      };

    case "COMPLETE_DEPOSIT":
      return {
        ...state,
        depositRecords: state.depositRecords.map(d =>
          d.id === action.id ? { ...d, status: "completed" as const } : d
        ),
      };

    /* ── Withdraw: instant debit + pending record ── */
    case "ADD_WITHDRAW":
      return {
        ...state,
        balance: state.balance - action.record.amount,
        totalWithdrawn: state.totalWithdrawn + action.record.amount,
        withdrawRecords: [...state.withdrawRecords, action.record],
      };

    case "COMPLETE_WITHDRAW":
      return {
        ...state,
        withdrawRecords: state.withdrawRecords.map(w =>
          w.id === action.id ? { ...w, status: "completed" as const } : w
        ),
      };

    case "SET_KYC":
      return { ...state, kycStatus: action.status };

    case "UPDATE_PROFILE":
      return { ...state, profileData: action.data };

    case "ADD_REFERRAL":
      return {
        ...state, balance: state.balance + action.earnings,
        referralData: { ...state.referralData, referrals: [...state.referralData.referrals, action.entry], totalEarnings: state.referralData.totalEarnings + action.earnings },
      };

    default:
      return state;
  }
}

/* ─── Demo names ─────────────────────────────────────────── */

const DEMO_NAMES = ["Alex K.", "Maria S.", "James T.", "Sophie L.", "Chen W.", "Omar H.", "Lena M.", "David R.", "Yuki N.", "Priya P.", "Lucas F.", "Emma B.", "Rio V.", "Anna G.", "Max D."];

/* ─── App Component ──────────────────────────────────────── */

export function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  const [activeAssetId, setActiveAssetId] = useState(ASSETS[0].id);
  const [amount, setAmount] = useState(25);
  const [expirySeconds, setExpirySeconds] = useState(60);
  const [timeframe, setTimeframe] = useState("1m");

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);

  // Tick engine
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), 800);
    return () => clearInterval(id);
  }, []);

  // Auto-verify KYC
  useEffect(() => {
    if (state.kycStatus === "PENDING_REVIEW") {
      const t = setTimeout(() => dispatch({ type: "SET_KYC", status: "VERIFIED" }), 8000);
      return () => clearTimeout(t);
    }
  }, [state.kycStatus]);

  // Auto-confirm pending deposits (10s delay)
  useEffect(() => {
    const pending = state.depositRecords.filter(d => d.status === "pending");
    if (pending.length === 0) return;
    const timers = pending.map(d => {
      const elapsed = Date.now() - d.createdAt;
      const remaining = Math.max(500, 10000 - elapsed);
      return setTimeout(() => dispatch({ type: "COMPLETE_DEPOSIT", id: d.id }), remaining);
    });
    return () => timers.forEach(clearTimeout);
  }, [state.depositRecords]);

  // Auto-confirm pending withdrawals (15s delay)
  useEffect(() => {
    const pending = state.withdrawRecords.filter(w => w.status === "pending");
    if (pending.length === 0) return;
    const timers = pending.map(w => {
      const elapsed = Date.now() - w.createdAt;
      const remaining = Math.max(500, 15000 - elapsed);
      return setTimeout(() => dispatch({ type: "COMPLETE_WITHDRAW", id: w.id }), remaining);
    });
    return () => timers.forEach(clearTimeout);
  }, [state.withdrawRecords]);

  const activeAsset = useMemo(() => ASSETS.find((a) => a.id === activeAssetId) ?? ASSETS[0], [activeAssetId]);
  const activeLive = state.liveAssets[activeAsset.id];
  const tfSeconds = TF_LABEL_MAP[timeframe] ?? 60;
  const candles = activeLive?.candlesByTf[tfSeconds] ?? [];
  const currentPrice = activeLive?.price ?? activeAsset.basePrice;

  // Prices map for asset selector
  const pricesMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of ASSETS) m[a.id] = state.liveAssets[a.id]?.price ?? a.basePrice;
    return m;
  }, [state.liveAssets]);

  // Active open trade for chart overlay
  const activeOpenTrade = useMemo(() => {
    const trades = state.openTrades.filter((t) => t.assetId === activeAssetId);
    return trades.length ? trades.reduce((a, b) => (b.openTime > a.openTime ? b : a)) : undefined;
  }, [state.openTrades, activeAssetId]);

  // Running trades view
  const runningTradeViews: OpenTradeView[] = useMemo(() => {
    return state.openTrades.map((t) => {
      const meta = ASSET_MAP[t.assetId];
      const live = state.liveAssets[t.assetId];
      return {
        id: t.id, assetId: t.assetId, assetSymbol: meta?.symbol ?? t.assetId,
        direction: t.direction, amount: t.amount, payoutFactor: t.payoutFactor,
        entryPrice: t.entryPrice, currentPrice: live?.price ?? t.entryPrice,
        openTime: t.openTime, expirySeconds: t.expirySeconds,
      };
    });
  }, [state.openTrades, state.liveAssets]);

  // Countdown for active trade
  let countdownLabel = "00s";
  let countdownPercent = 0;
  let timeLeftPercent = 0;
  let entryPrice: number | null = null;

  if (activeOpenTrade) {
    const now = Date.now();
    const total = activeOpenTrade.expirySeconds;
    const elapsed = Math.min(total, Math.max(0, (now - activeOpenTrade.openTime) / 1000));
    const remaining = Math.max(0, total - elapsed);
    countdownLabel = `${Math.floor(remaining).toString().padStart(2, "0")}s`;
    countdownPercent = (elapsed / total) * 100;
    timeLeftPercent = elapsed / total;
    entryPrice = activeOpenTrade.entryPrice;
  }

  const handlePlaceTrade = useCallback((direction: Direction) => {
    if (!activeAsset) return;
    const inv = Math.max(1, Math.min(amount, state.balance));
    if (!Number.isFinite(inv) || inv <= 0 || inv > state.balance) return;
    const trade: OpenTrade = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      assetId: activeAssetId, direction, amount: inv, payoutFactor: activeAsset.payout,
      entryPrice: activeLive?.price ?? activeAsset.basePrice,
      openTime: Date.now(), expirySeconds,
    };
    dispatch({ type: "PLACE_TRADE", trade });
    setAmount(inv);
  }, [activeAsset, activeAssetId, activeLive?.price, amount, expirySeconds, state.balance]);

  /* ── Deposit handler ── */
  const handleDeposit = useCallback((depositAmount: number, coin: string, network: string, walletAddress: string) => {
    if (depositAmount <= 0) return;
    const record: DepositRecord = {
      id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      coin,
      network,
      amount: depositAmount,
      status: "pending",
      createdAt: Date.now(),
      walletAddress,
    };
    dispatch({ type: "ADD_DEPOSIT", record });
  }, []);

  /* ── Withdraw handler ── */
  const handleWithdraw = useCallback((withdrawAmount: number, coin: string, network: string, toAddress: string) => {
    if (withdrawAmount <= 0 || withdrawAmount > state.balance) return;
    const fee = WITHDRAW_FEES[coin] ?? 1;
    const netAmount = Math.max(0, withdrawAmount - fee);
    const record: WithdrawRecord = {
      id: `wth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      coin,
      network,
      amount: withdrawAmount,
      fee,
      netAmount,
      toAddress,
      status: "pending",
      createdAt: Date.now(),
    };
    dispatch({ type: "ADD_WITHDRAW", record });
  }, [state.balance]);

  const handleSimulateReferral = useCallback(() => {
    const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
    const tradeVolume = 200 + Math.random() * 2000;
    const commission = tradeVolume * REFERRAL_RATE;
    const entry: ReferralEntry = {
      id: `ref-${Date.now()}`, name,
      joinDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tradeVolume, commission, status: Math.random() > 0.2 ? "active" : "inactive",
    };
    dispatch({ type: "ADD_REFERRAL", entry, earnings: commission });
  }, []);

  const totalProfit = useMemo(() => state.closedTrades.reduce((s, t) => s + t.payout, 0), [state.closedTrades]);
  const wins = useMemo(() => state.closedTrades.filter((t) => t.payout > 0).length, [state.closedTrades]);
  const winRate = state.closedTrades.length ? (wins / state.closedTrades.length) * 100 : 0;
  const tradingDisabled = !activeAsset || amount <= 0 || amount > state.balance || state.balance <= 0;

  const initials = state.profileData.displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-[#060a10]">
      <div className="mx-auto flex min-h-screen max-w-[1480px] flex-col">
        <Navbar
          balance={state.balance}
          onDepositClick={() => setDepositOpen(true)}
          onWithdrawClick={() => setWithdrawOpen(true)}
          onProfileClick={() => setProfileOpen(true)}
          onReferralClick={() => setReferralOpen(true)}
          kycStatus={state.kycStatus}
          onKYCClick={() => setKycOpen(true)}
          profileInitials={initials}
          avatarColor={state.profileData.avatarColor}
        />

        <main className="flex flex-col gap-3 px-3 pb-6 pt-3 sm:gap-3.5 sm:px-5 sm:pt-4">
          <StatsBar
            balance={state.balance}
            openTrades={state.openTrades.length}
            totalPnl={totalProfit}
            winRate={winRate}
          />

          <AssetSelector
            assets={ASSETS}
            activeAssetId={activeAssetId}
            onSelect={setActiveAssetId}
            prices={pricesMap}
          />

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-3">
              <CandleChart
                candles={candles}
                currentPrice={currentPrice}
                entryPrice={entryPrice}
                timeLeftPercent={timeLeftPercent}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
              <RunningTrades
                trades={runningTradeViews}
                onSelectAsset={setActiveAssetId}
              />
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-3">
              <TradingPanel
                amount={amount}
                onAmountChange={setAmount}
                expirySeconds={expirySeconds}
                onExpiryChange={setExpirySeconds}
                onPlaceTrade={handlePlaceTrade}
                disabled={tradingDisabled}
                countdownLabel={countdownLabel}
                countdownPercent={countdownPercent}
                resultBanner={state.lastResult}
                activePayout={activeAsset.payout}
                balance={state.balance}
              />
              <TradeHistory trades={state.closedTrades} />
            </div>
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onDeposit={handleDeposit}
        deposits={state.depositRecords}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        balance={state.balance}
        onWithdraw={handleWithdraw}
        kycVerified={state.kycStatus === "VERIFIED"}
        withdrawals={state.withdrawRecords}
      />
      <KYCModal
        open={kycOpen}
        onClose={() => setKycOpen(false)}
        kycStatus={state.kycStatus}
        onStatusChange={(s) => dispatch({ type: "SET_KYC", status: s })}
      />
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        balance={state.balance}
        kycStatus={state.kycStatus}
        closedTrades={state.closedTrades}
        totalDeposited={state.totalDeposited}
        totalWithdrawn={state.totalWithdrawn}
        referralCode={state.referralData.code}
        referralEarnings={state.referralData.totalEarnings}
        referralCount={state.referralData.referrals.length}
        profileData={state.profileData}
        onProfileUpdate={(data) => dispatch({ type: "UPDATE_PROFILE", data })}
        onOpen2FA={() => { setProfileOpen(false); setTwoFactorOpen(true); }}
      />
      <TwoFactorModal
        open={twoFactorOpen}
        onClose={() => setTwoFactorOpen(false)}
        enabled={state.profileData.twoFactorEnabled}
        onToggle={(enabled) => dispatch({ type: "UPDATE_PROFILE", data: { ...state.profileData, twoFactorEnabled: enabled } })}
      />
      <ReferralModal
        open={referralOpen}
        onClose={() => setReferralOpen(false)}
        referralData={state.referralData}
        onSimulateReferral={handleSimulateReferral}
      />
    </div>
  );
}
