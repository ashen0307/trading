import { useEffect, useRef, useMemo, useState, useCallback } from "react";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type ChartType = "candle" | "line" | "bar";
export type IndicatorType = "SMA" | "EMA" | "BOLL" | "VOL" | "RSI";

interface CandleChartProps {
  candles: Candle[];
  currentPrice: number;
  entryPrice: number | null;
  timeLeftPercent: number;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

const TF_OPTIONS = ["1m", "5m", "15m", "1H"];
const TF_SECONDS_MAP: Record<string, number> = { "1m": 60, "5m": 300, "15m": 900, "1H": 3600 };
const ZOOM_LEVELS = [20, 30, 50, 70, 100, 140, 200];

const BULL_COLOR = "#22c55e";
const BEAR_COLOR = "#ef4444";
const LINE_COLOR = "#3b82f6";
const BG_TOP = "#0c1018";
const BG_BOTTOM = "#080c14";
const GRID_COLOR = "148,163,184";

/* ── Indicator Calculations ── */
function calcSMA(data: number[], period: number): (number | null)[] {
  const r: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { r.push(null); continue; }
    let s = 0; for (let j = i - period + 1; j <= i; j++) s += data[j];
    r.push(s / period);
  }
  return r;
}

function calcEMA(data: number[], period: number): (number | null)[] {
  const r: (number | null)[] = []; const k = 2 / (period + 1); let ema: number | null = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { r.push(null); continue; }
    if (ema === null) { let s = 0; for (let j = i - period + 1; j <= i; j++) s += data[j]; ema = s / period; }
    else ema = data[i] * k + ema * (1 - k);
    r.push(ema);
  }
  return r;
}

function calcBollinger(data: number[], period: number, mult: number) {
  const mid = calcSMA(data, period);
  const upper: (number | null)[] = [], lower: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (mid[i] === null) { upper.push(null); lower.push(null); continue; }
    let v = 0; for (let j = i - period + 1; j <= i; j++) v += (data[j] - mid[i]!) ** 2;
    const std = Math.sqrt(v / period);
    upper.push(mid[i]! + mult * std); lower.push(mid[i]! - mult * std);
  }
  return { mid, upper, lower };
}

function calcRSI(data: number[], period: number): (number | null)[] {
  const r: (number | null)[] = [];
  if (data.length < period + 1) return data.map(() => null);
  let ag = 0, al = 0;
  for (let i = 1; i <= period; i++) { const d = data[i] - data[i - 1]; if (d > 0) ag += d; else al += Math.abs(d); }
  ag /= period; al /= period;
  for (let i = 0; i < data.length; i++) {
    if (i < period) { r.push(null); continue; }
    if (i === period) { const rs = al === 0 ? 100 : ag / al; r.push(100 - 100 / (1 + rs)); continue; }
    const d = data[i] - data[i - 1]; const g = d > 0 ? d : 0; const l = d < 0 ? Math.abs(d) : 0;
    ag = (ag * (period - 1) + g) / period; al = (al * (period - 1) + l) / period;
    const rs = al === 0 ? 100 : ag / al; r.push(100 - 100 / (1 + rs));
  }
  return r;
}

const INDICATOR_COLORS: Record<string, string> = {
  SMA: "#f59e0b", EMA: "#8b5cf6", BOLL_MID: "#06b6d4", BOLL_BAND: "rgba(6,182,212,0.08)",
  VOL_UP: "rgba(34,197,94,0.35)", VOL_DOWN: "rgba(239,68,68,0.3)", RSI: "#ec4899",
};

export const CandleChart = ({
  candles, currentPrice, entryPrice, timeLeftPercent, timeframe, onTimeframeChange,
}: CandleChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomIndex, setZoomIndex] = useState(4);
  const [chartType, setChartType] = useState<ChartType>("candle");
  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorType>>(new Set());
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  /* ═══ HISTORY NAVIGATION STATE ═══ */
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; offset: number } | null>(null);

  const visibleCount = ZOOM_LEVELS[zoomIndex];
  const totalCandles = candles.length;
  const maxOffset = Math.max(0, totalCandles - visibleCount);
  const clampedOffset = Math.min(scrollOffset, maxOffset);
  const isAtLatest = clampedOffset === 0;

  const displayCandles = useMemo(() => {
    const endIdx = totalCandles - clampedOffset;
    const startIdx = Math.max(0, endIdx - visibleCount);
    return candles.slice(startIdx, endIdx);
  }, [candles, visibleCount, clampedOffset, totalCandles]);

  const tfSec = TF_SECONDS_MAP[timeframe] ?? 60;

  const dateRange = useMemo(() => {
    if (displayCandles.length === 0) return { start: "", end: "", duration: "" };
    const first = displayCandles[0];
    const last = displayCandles[displayCandles.length - 1];
    const fmt = (t: number) => {
      const d = new Date(t);
      return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };
    const durationMin = Math.round((last.time - first.time) / 60000);
    let duration = "";
    if (durationMin < 60) duration = `${durationMin}m`;
    else if (durationMin < 1440) duration = `${(durationMin / 60).toFixed(1)}h`;
    else duration = `${(durationMin / 1440).toFixed(1)}d`;
    return { start: fmt(first.time), end: fmt(last.time), duration };
  }, [displayCandles]);

  const scrollBy = useCallback((delta: number) => {
    setScrollOffset(prev => Math.max(0, Math.min(maxOffset, prev + delta)));
  }, [maxOffset]);

  const goToLatest = useCallback(() => setScrollOffset(0), []);
  const goToOldest = useCallback(() => setScrollOffset(maxOffset), [maxOffset]);
  const handleZoomIn = useCallback(() => setZoomIndex(i => Math.max(0, i - 1)), []);
  const handleZoomOut = useCallback(() => setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1)), []);
  const toggleIndicator = useCallback((ind: IndicatorType) => {
    setActiveIndicators(prev => { const n = new Set(prev); if (n.has(ind)) n.delete(ind); else n.add(ind); return n; });
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "ArrowLeft") scrollBy(Math.max(1, Math.floor(visibleCount * 0.2)));
      if (e.key === "ArrowRight") scrollBy(-Math.max(1, Math.floor(visibleCount * 0.2)));
      if (e.key === "Home") goToOldest();
      if (e.key === "End") goToLatest();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleZoomIn, handleZoomOut, scrollBy, visibleCount, goToLatest, goToOldest]);

  // Mouse wheel scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      scrollBy(Math.sign(delta) * Math.max(1, Math.floor(visibleCount * 0.05)));
    };
    container.addEventListener("wheel", handler, { passive: false });
    return () => container.removeEventListener("wheel", handler);
  }, [scrollBy, visibleCount]);

  // Mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, offset: clampedOffset };
  }, [clampedOffset]);

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current) return;
    const chartW = containerRef.current.clientWidth - 84;
    const candleWidth = chartW / visibleCount;
    const dx = e.clientX - dragStartRef.current.x;
    const candlesDragged = Math.round(dx / candleWidth);
    setScrollOffset(Math.max(0, Math.min(maxOffset, dragStartRef.current.offset + candlesDragged)));
  }, [isDragging, visibleCount, maxOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handler = () => { setIsDragging(false); dragStartRef.current = null; };
    window.addEventListener("mouseup", handler);
    return () => window.removeEventListener("mouseup", handler);
  }, [isDragging]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (isDragging) handleDragMove(e);
  }, [isDragging, handleDragMove]);

  const handleMouseLeave = useCallback(() => { setMousePos(null); }, []);

  const hasRSI = activeIndicators.has("RSI");
  const hasVol = activeIndicators.has("VOL");
  const subPanelCount = (hasRSI ? 1 : 0) + (hasVol ? 1 : 0);

  // ═══ CANVAS RENDER ═══
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || displayCandles.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = container.clientWidth;
    const H = container.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, BG_TOP);
    bg.addColorStop(1, BG_BOTTOM);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Layout
    const rightPad = 76, leftPad = 8, topPad = 6, bottomTimeBar = 22;
    const minimapH = 28;
    const subPanelH = subPanelCount > 0 ? 60 * subPanelCount : 0;
    const mainChartBottom = H - bottomTimeBar - subPanelH - minimapH;
    const mainChartH = mainChartBottom - topPad;
    const chartW = W - rightPad - leftPad;
    const numDisplayed = displayCandles.length;
    const cw = Math.max(2, chartW / Math.max(20, numDisplayed) * 0.75);
    const gap = Math.max(1, cw * 0.25);
    const fw = cw + gap;
    const ox = W - rightPad - numDisplayed * fw;

    const closes = displayCandles.map(c => c.close);
    const allPrices = displayCandles.flatMap(c => [c.high, c.low]);
    if (isAtLatest) allPrices.push(currentPrice);
    if (entryPrice != null) allPrices.push(entryPrice);

    let bollData: ReturnType<typeof calcBollinger> | null = null;
    if (activeIndicators.has("BOLL")) {
      bollData = calcBollinger(closes, 20, 2);
      bollData.upper.forEach(v => { if (v !== null) allPrices.push(v); });
      bollData.lower.forEach(v => { if (v !== null) allPrices.push(v); });
    }

    const hi = Math.max(...allPrices) * 1.001;
    const lo = Math.min(...allPrices) * 0.999;
    const range = hi - lo || 1;

    const priceToY = (p: number) => topPad + mainChartH - ((p - lo) / range) * mainChartH;
    const yToPrice = (y: number) => hi - ((y - topPad) / mainChartH) * range;
    const xForCandle = (i: number) => ox + i * fw;

    // ── Watermark ──
    ctx.fillStyle = `rgba(${GRID_COLOR},0.03)`;
    ctx.font = "900 48px 'Inter', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("BINARYPRO", W / 2, H / 2 - 20);
    ctx.font = "600 16px 'Inter', sans-serif";
    ctx.fillText("TRADING TERMINAL", W / 2, H / 2 + 12);

    // ── History label ──
    if (!isAtLatest) {
      ctx.font = "700 11px 'Inter', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(251,191,36,0.35)";
      ctx.fillText(`⏪ VIEWING HISTORY  (${clampedOffset} candles back)`, W / 2, topPad + 6);
    }

    // ── Grid ──
    ctx.strokeStyle = `rgba(${GRID_COLOR},0.04)`;
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 8; i++) {
      const y = topPad + (mainChartH / 8) * i;
      ctx.beginPath(); ctx.moveTo(leftPad, y); ctx.lineTo(W - rightPad, y); ctx.stroke();
    }
    for (let i = 1; i < 12; i++) {
      const x = leftPad + (chartW / 12) * i;
      ctx.beginPath(); ctx.moveTo(x, topPad); ctx.lineTo(x, mainChartBottom); ctx.stroke();
    }

    // ── Bollinger ──
    if (bollData) {
      ctx.fillStyle = INDICATOR_COLORS.BOLL_BAND;
      ctx.beginPath(); let started = false;
      for (let i = 0; i < numDisplayed; i++) {
        if (bollData.upper[i] === null) continue;
        const x = xForCandle(i) + cw / 2;
        if (!started) { ctx.moveTo(x, priceToY(bollData.upper[i]!)); started = true; } else ctx.lineTo(x, priceToY(bollData.upper[i]!));
      }
      for (let i = numDisplayed - 1; i >= 0; i--) {
        if (bollData.lower[i] === null) continue;
        ctx.lineTo(xForCandle(i) + cw / 2, priceToY(bollData.lower[i]!));
      }
      ctx.closePath(); ctx.fill();
      for (const [arr, dash] of [[bollData.upper, [2, 2]], [bollData.lower, [2, 2]], [bollData.mid, []]] as [((number | null)[]), number[]][]) {
        ctx.strokeStyle = INDICATOR_COLORS.BOLL_MID; ctx.setLineDash(dash); ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
        ctx.beginPath(); let s = false;
        for (let i = 0; i < numDisplayed; i++) { if (arr[i] === null) continue; const x = xForCandle(i) + cw / 2; if (!s) { ctx.moveTo(x, priceToY(arr[i]!)); s = true; } else ctx.lineTo(x, priceToY(arr[i]!)); }
        ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
    }

    // ── SMA ──
    if (activeIndicators.has("SMA")) {
      const sma = calcSMA(closes, 20);
      ctx.strokeStyle = INDICATOR_COLORS.SMA; ctx.lineWidth = 1.5; ctx.beginPath(); let s = false;
      for (let i = 0; i < numDisplayed; i++) { if (sma[i] === null) continue; const x = xForCandle(i) + cw / 2; if (!s) { ctx.moveTo(x, priceToY(sma[i]!)); s = true; } else ctx.lineTo(x, priceToY(sma[i]!)); }
      ctx.stroke();
    }

    // ── EMA ──
    if (activeIndicators.has("EMA")) {
      const ema = calcEMA(closes, 12);
      ctx.strokeStyle = INDICATOR_COLORS.EMA; ctx.lineWidth = 1.5; ctx.beginPath(); let s = false;
      for (let i = 0; i < numDisplayed; i++) { if (ema[i] === null) continue; const x = xForCandle(i) + cw / 2; if (!s) { ctx.moveTo(x, priceToY(ema[i]!)); s = true; } else ctx.lineTo(x, priceToY(ema[i]!)); }
      ctx.stroke();
    }

    // ── Main chart ──
    if (chartType === "candle") {
      displayCandles.forEach((c, i) => {
        const x = xForCandle(i);
        const oY = priceToY(c.open); const cY = priceToY(c.close);
        const hY = priceToY(c.high); const lY = priceToY(c.low);
        const bull = c.close >= c.open;
        const color = bull ? BULL_COLOR : BEAR_COLOR;
        if (i > numDisplayed - 4 && isAtLatest) { ctx.shadowColor = color; ctx.shadowBlur = 4; }
        ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, cw * 0.1);
        ctx.beginPath(); ctx.moveTo(x + cw / 2, hY); ctx.lineTo(x + cw / 2, lY); ctx.stroke();
        const top = Math.min(oY, cY); const bh = Math.max(1, Math.abs(oY - cY));
        ctx.fillStyle = color;
        ctx.globalAlpha = bull ? 0.9 : 0.85;
        ctx.fillRect(x, top, cw, bh);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      });
    } else if (chartType === "line") {
      ctx.strokeStyle = LINE_COLOR; ctx.lineWidth = 2; ctx.beginPath();
      displayCandles.forEach((c, i) => { const x = xForCandle(i) + cw / 2; const y = priceToY(c.close); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.stroke();
      const gr = ctx.createLinearGradient(0, topPad, 0, mainChartBottom);
      gr.addColorStop(0, LINE_COLOR + "25"); gr.addColorStop(1, LINE_COLOR + "00");
      ctx.fillStyle = gr;
      ctx.lineTo(xForCandle(numDisplayed - 1) + cw / 2, mainChartBottom);
      ctx.lineTo(xForCandle(0) + cw / 2, mainChartBottom); ctx.closePath(); ctx.fill();
      const lx = xForCandle(numDisplayed - 1) + cw / 2;
      const ly = priceToY(displayCandles[numDisplayed - 1].close);
      ctx.fillStyle = LINE_COLOR; ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(lx, ly, 2, 0, Math.PI * 2); ctx.fill();
    } else {
      displayCandles.forEach((c, i) => {
        const x = xForCandle(i) + cw / 2;
        const oY = priceToY(c.open); const cY = priceToY(c.close);
        const hY = priceToY(c.high); const lY = priceToY(c.low);
        const bull = c.close >= c.open;
        const color = bull ? BULL_COLOR : BEAR_COLOR;
        const tw = Math.max(2, cw * 0.4);
        ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, cw * 0.15);
        ctx.beginPath(); ctx.moveTo(x, hY); ctx.lineTo(x, lY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - tw, oY); ctx.lineTo(x, oY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, cY); ctx.lineTo(x + tw, cY); ctx.stroke();
      });
    }

    // ── Entry price line ──
    if (entryPrice != null) {
      const eY = priceToY(entryPrice);
      ctx.strokeStyle = "rgba(251,191,36,0.5)"; ctx.setLineDash([6, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(leftPad, eY); ctx.lineTo(W - rightPad, eY); ctx.stroke(); ctx.setLineDash([]);
      const eLY = Math.min(Math.max(4, eY - 10), mainChartBottom - 22);
      ctx.fillStyle = "rgba(251,191,36,0.12)"; ctx.beginPath(); ctx.roundRect(W - 74, eLY, 72, 20, 4); ctx.fill();
      ctx.fillStyle = "#fbbf24"; ctx.font = "500 10px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(entryPrice.toFixed(currentPrice < 10 ? 5 : 2), W - 38, eLY + 10);
    }

    // ── Current price line (live only) ──
    if (isAtLatest) {
      const curY = priceToY(currentPrice);
      ctx.strokeStyle = LINE_COLOR + "80"; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(leftPad, curY); ctx.lineTo(W - rightPad, curY); ctx.stroke(); ctx.setLineDash([]);
      const lw = 72, lh = 22; const lx = W - lw - 2;
      const ly = Math.min(Math.max(2, curY - lh / 2), mainChartBottom - lh - 2);
      ctx.fillStyle = "#0f172a"; ctx.strokeStyle = LINE_COLOR; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(lx, ly, lw, lh, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#93c5fd"; ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.textBaseline = "middle"; ctx.textAlign = "center";
      ctx.fillText(currentPrice.toFixed(currentPrice < 10 ? 5 : 2), lx + lw / 2, ly + lh / 2);
    }

    // ── Y-axis ──
    ctx.fillStyle = `rgba(${GRID_COLOR},0.25)`; ctx.font = "400 9px 'JetBrains Mono', monospace"; ctx.textAlign = "right";
    for (let i = 0; i <= 6; i++) {
      const py = topPad + (mainChartH / 6) * i;
      const pv = hi - (i / 6) * range;
      ctx.fillText(pv.toFixed(currentPrice < 10 ? 4 : 1), W - 6, py + 3);
    }

    // ── Time labels ──
    ctx.fillStyle = `rgba(${GRID_COLOR},0.3)`; ctx.font = "400 8px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "top";
    const timeY = mainChartBottom + 4;
    const lblInt = Math.max(1, Math.floor(numDisplayed / 10));
    for (let i = 0; i < numDisplayed; i += lblInt) {
      const c = displayCandles[i]; const x = xForCandle(i) + cw / 2;
      const d = new Date(c.time);
      const label = tfSec >= 300
        ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      ctx.fillText(label, x, timeY);
    }

    ctx.fillStyle = `rgba(${GRID_COLOR},0.15)`; ctx.font = "400 8px 'Inter', sans-serif"; ctx.textAlign = "left";
    const dl = tfSec < 60 ? `${tfSec}s candles` : tfSec < 3600 ? `${tfSec / 60}m candles` : `${tfSec / 3600}h candles`;
    ctx.fillText(dl, leftPad + 4, mainChartBottom + 10);

    // ── Sub panels ──
    let subY = mainChartBottom + bottomTimeBar;
    if (hasVol) {
      const pH = 60;
      ctx.strokeStyle = `rgba(${GRID_COLOR},0.08)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(leftPad, subY); ctx.lineTo(W - rightPad, subY); ctx.stroke();
      ctx.fillStyle = `rgba(${GRID_COLOR},0.2)`; ctx.font = "500 8px 'Inter', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("VOL", leftPad + 4, subY + 3);
      const vols = displayCandles.map(c => Math.abs(c.high - c.low) * 1000);
      const mx = Math.max(...vols, 0.001);
      for (let i = 0; i < numDisplayed; i++) {
        const x = xForCandle(i); const bH = (vols[i] / mx) * (pH - 10);
        ctx.fillStyle = displayCandles[i].close >= displayCandles[i].open ? INDICATOR_COLORS.VOL_UP : INDICATOR_COLORS.VOL_DOWN;
        ctx.fillRect(x, subY + pH - bH, cw, bH);
      }
      subY += pH;
    }
    if (hasRSI) {
      const pH = 60;
      ctx.strokeStyle = `rgba(${GRID_COLOR},0.08)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(leftPad, subY); ctx.lineTo(W - rightPad, subY); ctx.stroke();
      ctx.fillStyle = `rgba(${GRID_COLOR},0.2)`; ctx.font = "500 8px 'Inter', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("RSI(14)", leftPad + 4, subY + 3);
      const rToY = (v: number) => subY + pH - (v / 100) * pH;
      ctx.fillStyle = "rgba(239,68,68,0.04)"; ctx.fillRect(leftPad, rToY(100), chartW, rToY(70) - rToY(100));
      ctx.fillStyle = "rgba(34,197,94,0.04)"; ctx.fillRect(leftPad, rToY(30), chartW, rToY(0) - rToY(30));
      ctx.strokeStyle = `rgba(${GRID_COLOR},0.08)`; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(leftPad, rToY(70)); ctx.lineTo(W - rightPad, rToY(70)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(leftPad, rToY(30)); ctx.lineTo(W - rightPad, rToY(30)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${GRID_COLOR},0.15)`; ctx.font = "400 7px 'JetBrains Mono', monospace"; ctx.textAlign = "right";
      ctx.fillText("70", W - 6, rToY(70) + 3); ctx.fillText("30", W - 6, rToY(30) + 3);
      const rsiData = calcRSI(closes, 14);
      ctx.strokeStyle = INDICATOR_COLORS.RSI; ctx.lineWidth = 1.5; ctx.beginPath(); let s = false;
      for (let i = 0; i < numDisplayed; i++) { if (rsiData[i] === null) continue; const x = xForCandle(i) + cw / 2; if (!s) { ctx.moveTo(x, rToY(rsiData[i]!)); s = true; } else ctx.lineTo(x, rToY(rsiData[i]!)); }
      ctx.stroke();
      subY += pH;
    }

    // ═══ MINIMAP ═══
    const minimapY = H - minimapH;
    ctx.fillStyle = `rgba(${GRID_COLOR},0.03)`;
    ctx.fillRect(leftPad, minimapY, chartW, minimapH);
    ctx.strokeStyle = `rgba(${GRID_COLOR},0.08)`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(leftPad, minimapY); ctx.lineTo(W - rightPad, minimapY); ctx.stroke();

    if (totalCandles > 0) {
      const mmPad = 3;
      const allCloses = candles.map(c => c.close);
      const allHi = Math.max(...candles.map(c => c.high));
      const allLo = Math.min(...candles.map(c => c.low));
      const allRange = allHi - allLo || 1;
      const mmW = chartW;
      const mmH = minimapH - mmPad * 2;
      const barW = Math.max(0.5, mmW / totalCandles);

      ctx.strokeStyle = `rgba(${GRID_COLOR},0.2)`; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < totalCandles; i++) {
        const x = leftPad + (i / totalCandles) * mmW;
        const y = minimapY + mmPad + mmH - ((allCloses[i] - allLo) / allRange) * mmH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const viewStart = totalCandles - clampedOffset - visibleCount;
      const viewEnd = totalCandles - clampedOffset;
      for (let i = Math.max(0, viewStart); i < Math.min(totalCandles, viewEnd); i++) {
        const x = leftPad + (i / totalCandles) * mmW;
        const c = candles[i];
        const bull = c.close >= c.open;
        const y1 = minimapY + mmPad + mmH - ((c.high - allLo) / allRange) * mmH;
        const y2 = minimapY + mmPad + mmH - ((c.low - allLo) / allRange) * mmH;
        ctx.strokeStyle = bull ? BULL_COLOR + "80" : BEAR_COLOR + "80";
        ctx.lineWidth = Math.max(0.5, barW * 0.6);
        ctx.beginPath(); ctx.moveTo(x + barW / 2, y1); ctx.lineTo(x + barW / 2, y2); ctx.stroke();
      }

      const vpX = leftPad + (Math.max(0, viewStart) / totalCandles) * mmW;
      const vpW = (Math.min(totalCandles, viewEnd) - Math.max(0, viewStart)) / totalCandles * mmW;
      ctx.fillStyle = isAtLatest ? "rgba(16,185,129,0.08)" : "rgba(251,191,36,0.08)";
      ctx.fillRect(vpX, minimapY + 1, vpW, minimapH - 2);
      ctx.strokeStyle = isAtLatest ? "rgba(16,185,129,0.4)" : "rgba(251,191,36,0.4)"; ctx.lineWidth = 1;
      ctx.strokeRect(vpX, minimapY + 1, vpW, minimapH - 2);

      ctx.font = "600 7px 'JetBrains Mono', monospace"; ctx.textAlign = "right"; ctx.textBaseline = "bottom";
      if (isAtLatest) { ctx.fillStyle = "rgba(16,185,129,0.5)"; ctx.fillText("● LIVE", W - rightPad - 4, H - 3); }
      else { ctx.fillStyle = "rgba(251,191,36,0.5)"; ctx.fillText(`◀ ${clampedOffset} back`, W - rightPad - 4, H - 3); }

      ctx.font = "400 7px 'JetBrains Mono', monospace"; ctx.textAlign = "left";
      ctx.fillStyle = `rgba(${GRID_COLOR},0.2)`;
      ctx.fillText(`${totalCandles} total candles`, leftPad + 4, H - 3);
    }

    // ── Crosshair + OHLC Tooltip ──
    if (mousePos && !isDragging) {
      const mx = mousePos.x, my = mousePos.y;
      if (mx > leftPad && mx < W - rightPad && my > topPad && my < mainChartBottom) {
        ctx.strokeStyle = `rgba(${GRID_COLOR},0.2)`; ctx.setLineDash([4, 4]); ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(mx, topPad); ctx.lineTo(mx, mainChartBottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(leftPad, my); ctx.lineTo(W - rightPad, my); ctx.stroke();
        ctx.setLineDash([]);

        const price = yToPrice(my);
        const lw2 = 68, lh2 = 18;
        ctx.fillStyle = `rgba(${GRID_COLOR},0.1)`; ctx.beginPath(); ctx.roundRect(W - rightPad + 2, my - lh2 / 2, lw2, lh2, 3); ctx.fill();
        ctx.fillStyle = `rgba(${GRID_COLOR},0.8)`; ctx.font = "500 9px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(price.toFixed(currentPrice < 10 ? 5 : 2), W - rightPad + 2 + lw2 / 2, my);

        const candleIdx = Math.round((mx - ox) / fw);
        if (candleIdx >= 0 && candleIdx < numDisplayed) {
          const cd = displayCandles[candleIdx];
          const tLabel = new Date(cd.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const tw2 = 56;
          ctx.fillStyle = `rgba(${GRID_COLOR},0.1)`; ctx.beginPath(); ctx.roundRect(mx - tw2 / 2, mainChartBottom + 2, tw2, 16, 3); ctx.fill();
          ctx.fillStyle = `rgba(${GRID_COLOR},0.8)`; ctx.font = "500 8px 'JetBrains Mono', monospace";
          ctx.fillText(tLabel, mx, mainChartBottom + 10);

          // OHLC tooltip
          const tooltipX = Math.min(mx + 12, W - rightPad - 130);
          const tooltipY = Math.max(topPad + 10, Math.min(my - 40, mainChartBottom - 80));
          ctx.fillStyle = "rgba(15,23,42,0.92)";
          ctx.beginPath(); ctx.roundRect(tooltipX, tooltipY, 120, 68, 6); ctx.fill();
          ctx.strokeStyle = `rgba(${GRID_COLOR},0.15)`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(tooltipX, tooltipY, 120, 68, 6); ctx.stroke();
          ctx.font = "600 8px 'JetBrains Mono', monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
          const dec = currentPrice < 10 ? 5 : 2;
          const isBull = cd.close >= cd.open;
          const lines = [
            { label: "O", val: cd.open.toFixed(dec), color: `rgba(${GRID_COLOR},0.7)` },
            { label: "H", val: cd.high.toFixed(dec), color: `rgba(${GRID_COLOR},0.7)` },
            { label: "L", val: cd.low.toFixed(dec), color: `rgba(${GRID_COLOR},0.7)` },
            { label: "C", val: cd.close.toFixed(dec), color: isBull ? BULL_COLOR : BEAR_COLOR },
          ];
          lines.forEach((l, idx) => {
            ctx.fillStyle = `rgba(${GRID_COLOR},0.4)`;
            ctx.fillText(l.label + ":", tooltipX + 8, tooltipY + 8 + idx * 14);
            ctx.fillStyle = l.color;
            ctx.fillText(l.val, tooltipX + 28, tooltipY + 8 + idx * 14);
          });
          ctx.fillStyle = `rgba(${GRID_COLOR},0.3)`;
          ctx.font = "400 7px 'JetBrains Mono', monospace";
          ctx.fillText(new Date(cd.time).toLocaleString(), tooltipX + 8, tooltipY + 58);
        }
      }
    }

    // ── Drag overlay ──
    if (isDragging) {
      ctx.fillStyle = "rgba(251,191,36,0.04)";
      ctx.fillRect(0, 0, W, H);
    }

    // ── Trade progress bar ──
    if (timeLeftPercent > 0 && isAtLatest) {
      const bH = 3; const bW = W * Math.min(1, timeLeftPercent);
      const g2 = ctx.createLinearGradient(0, 0, bW, 0);
      g2.addColorStop(0, BULL_COLOR); g2.addColorStop(0.5, "#3b82f6"); g2.addColorStop(1, "#8b5cf6");
      ctx.fillStyle = g2; ctx.fillRect(0, minimapY - bH, bW, bH);
    }
  }, [displayCandles, currentPrice, entryPrice, timeLeftPercent, chartType, activeIndicators, subPanelCount, hasRSI, hasVol, tfSec, mousePos, isAtLatest, clampedOffset, candles, totalCandles, visibleCount, isDragging]);

  const chartHeight = 340 + subPanelCount * 60 + 28;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#0c1018] relative">
      {/* ═══ Header Bar ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 px-3 py-2">
        <div className="flex items-center gap-2 text-[11px]">
          {isAtLatest ? (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          )}
          <span className="font-semibold text-slate-300">
            {isAtLatest ? "Live Chart" : "History"}
          </span>
          <span className="rounded-md bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400 ring-1 ring-slate-700/60">
            {currentPrice.toFixed(currentPrice < 10 ? 5 : 2)}
          </span>
          {!isAtLatest && (
            <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
              ⏪ {clampedOffset} back
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Chart Type */}
          <div className="flex rounded-lg bg-slate-800/60 p-0.5">
            {([
              { type: "candle" as ChartType, icon: "🕯️" },
              { type: "line" as ChartType, icon: "📈" },
              { type: "bar" as ChartType, icon: "📊" },
            ]).map(({ type, icon }) => (
              <button key={type} onClick={() => setChartType(type)} title={type}
                className={`rounded-md px-1.5 py-0.5 text-[10px] transition cursor-pointer ${chartType === type ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40" : "text-slate-500 hover:bg-slate-700 hover:text-slate-300"}`}>{icon}</button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700/50" />

          {/* Timeframe */}
          <div className="flex gap-0.5">
            {TF_OPTIONS.map(tf => (
              <button key={tf} onClick={() => { onTimeframeChange(tf); setScrollOffset(0); }}
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition cursor-pointer ${timeframe === tf ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"}`}>{tf}</button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700/50" />

          {/* Zoom */}
          <div className="flex items-center gap-0.5">
            <button onClick={handleZoomIn} disabled={zoomIndex === 0} title="Zoom In"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800/60 text-[12px] font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 cursor-pointer">+</button>
            <span className="text-[9px] text-slate-600 font-mono min-w-[22px] text-center">{visibleCount}</span>
            <button onClick={handleZoomOut} disabled={zoomIndex === ZOOM_LEVELS.length - 1} title="Zoom Out"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800/60 text-[12px] font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 cursor-pointer">−</button>
          </div>

          <div className="h-4 w-px bg-slate-700/50" />

          {/* History Navigation */}
          <div className="flex items-center gap-0.5">
            <button onClick={goToOldest} disabled={clampedOffset >= maxOffset} title="Go to oldest (Home)"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800/60 text-[10px] text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 cursor-pointer">⏮</button>
            <button onClick={() => scrollBy(Math.max(1, Math.floor(visibleCount * 0.5)))} disabled={clampedOffset >= maxOffset} title="Scroll left"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800/60 text-[10px] text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 cursor-pointer">◀</button>
            <button onClick={() => scrollBy(-Math.max(1, Math.floor(visibleCount * 0.5)))} disabled={isAtLatest} title="Scroll right"
              className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800/60 text-[10px] text-slate-400 hover:bg-slate-700 hover:text-white transition disabled:opacity-30 cursor-pointer">▶</button>
            <button onClick={goToLatest} disabled={isAtLatest} title="Go to latest / live"
              className={`flex h-6 items-center justify-center rounded-md px-1.5 text-[10px] font-bold transition cursor-pointer ${isAtLatest ? "bg-emerald-500/10 text-emerald-500/40" : "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40 hover:bg-emerald-500/30"}`}>
              ⏭ LIVE
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Indicator Bar + Date Range ═══ */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-800/40 px-3 py-1.5">
        <span className="text-[9px] text-slate-600 font-medium mr-1">Indicators:</span>
        {([
          { id: "SMA" as IndicatorType, label: "SMA(20)", color: "text-amber-400 bg-amber-500/10 ring-amber-500/30" },
          { id: "EMA" as IndicatorType, label: "EMA(12)", color: "text-violet-400 bg-violet-500/10 ring-violet-500/30" },
          { id: "BOLL" as IndicatorType, label: "Bollinger", color: "text-cyan-400 bg-cyan-500/10 ring-cyan-500/30" },
          { id: "VOL" as IndicatorType, label: "Volume", color: "text-green-400 bg-green-500/10 ring-green-500/30" },
          { id: "RSI" as IndicatorType, label: "RSI(14)", color: "text-pink-400 bg-pink-500/10 ring-pink-500/30" },
        ]).map(({ id, label, color }) => (
          <button key={id} onClick={() => toggleIndicator(id)}
            className={`rounded-md px-2 py-0.5 text-[9px] font-bold transition cursor-pointer ring-1 ${activeIndicators.has(id) ? color : "text-slate-600 bg-transparent ring-slate-800 hover:ring-slate-700 hover:text-slate-400"}`}>
            {activeIndicators.has(id) ? "✓ " : ""}{label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5 text-[9px] text-slate-600">
          {dateRange.start && (
            <>
              <span className="font-mono text-slate-500">{dateRange.start}</span>
              <span className="text-slate-700">→</span>
              <span className="font-mono text-slate-500">{dateRange.end}</span>
              <span className="rounded bg-slate-800 px-1 py-0.5 text-[8px] font-bold text-slate-500">{dateRange.duration}</span>
              <span className="text-slate-700">•</span>
            </>
          )}
          <span className="font-mono">{displayCandles.length} / {totalCandles}</span>
          <span>•</span>
          <span className="font-mono">{tfSec < 60 ? `${tfSec}s` : tfSec < 3600 ? `${tfSec / 60}min` : `${tfSec / 3600}hr`} each</span>
        </div>
      </div>

      {/* ═══ "Jump to Live" floating button ═══ */}
      {!isAtLatest && (
        <button
          onClick={goToLatest}
          className="absolute bottom-12 right-20 z-20 flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-bold text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-400 transition cursor-pointer animate-fade-in ring-2 ring-emerald-400/30"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          Jump to Live ⏭
        </button>
      )}

      {/* ═══ Canvas ═══ */}
      <div
        ref={containerRef}
        className={`relative w-full ${isDragging ? "cursor-grabbing" : "cursor-crosshair"}`}
        style={{ height: `${chartHeight}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
};
