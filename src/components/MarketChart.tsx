import { useMarketCandles, type Candle } from "@/lib/market-analytics";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const PADDING_X = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 22;
const HEIGHT = 200;

export function MarketChart() {
  const { lang } = useI18n();
  const { data: candles = [], isLoading } = useMarketCandles(14);
  const [hover, setHover] = useState<number | null>(null);

  const stats = useMemo(() => {
    const valid = candles.filter((c) => c.close > 0);
    if (valid.length < 2) return { last: 0, change: 0, pct: 0, high: 0, low: 0, vol: 0 };
    const first = valid[0].close;
    const last = valid[valid.length - 1].close;
    const high = Math.max(...valid.map((c) => c.high));
    const low = Math.min(...valid.map((c) => c.low));
    const vol = candles.reduce((a, c) => a + c.volume, 0);
    return { last, change: last - first, pct: ((last - first) / first) * 100, high, low, vol };
  }, [candles]);

  const up = stats.change >= 0;
  const upColor = "oklch(0.62 0.16 145)";
  const downColor = "oklch(0.58 0.20 25)";

  return (
    <div className="rounded-3xl glass p-5 overflow-hidden">
      {/* Header — ticker style */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
            UMRQ · {lang === "ar" ? "مؤشر سوق المقاعد" : "Seat Market Index"}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-[1.85rem] font-medium tracking-tight tabular-nums">
              {Math.round(stats.last).toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">DZD</span>
          </div>
          <div
            className="mt-1 flex items-center gap-1 text-[12px] font-medium tabular-nums"
            style={{ color: up ? upColor : downColor }}
          >
            {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {up ? "+" : ""}{Math.round(stats.change).toLocaleString()} ({up ? "+" : ""}{stats.pct.toFixed(2)}%)
          </div>
        </div>
        <div className="text-end space-y-0.5">
          <Mini label={lang === "ar" ? "أعلى" : "High"} value={Math.round(stats.high).toLocaleString()} />
          <Mini label={lang === "ar" ? "أدنى" : "Low"} value={Math.round(stats.low).toLocaleString()} />
          <Mini label={lang === "ar" ? "حجم" : "Vol"} value={String(stats.vol)} />
        </div>
      </div>

      {/* Chart */}
      <div className="relative" dir="ltr">
        {isLoading ? (
          <div className="h-[200px] rounded-xl shimmer" />
        ) : (
          <Candles candles={candles} onHover={setHover} hover={hover} upColor={upColor} downColor={downColor} />
        )}
        {hover !== null && candles[hover] && (
          <div className="absolute top-1 right-2 text-[10px] tabular-nums font-medium bg-foreground/90 text-background rounded-md px-2 py-1 shadow-lg">
            O {Math.round(candles[hover].open)} · H {Math.round(candles[hover].high)} · L {Math.round(candles[hover].low)} · C {Math.round(candles[hover].close)}
          </div>
        )}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-end gap-1.5 text-[10px]">
      <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Candles({
  candles,
  hover,
  onHover,
  upColor,
  downColor,
}: {
  candles: Candle[];
  hover: number | null;
  onHover: (i: number | null) => void;
  upColor: string;
  downColor: string;
}) {
  const width = 600; // viewBox; SVG scales responsively
  const valid = candles.filter((c) => c.high > 0);
  const max = valid.length ? Math.max(...valid.map((c) => c.high)) : 1;
  const min = valid.length ? Math.min(...valid.map((c) => c.low)) : 0;
  const range = Math.max(max - min, 1);
  const innerH = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const innerW = width - PADDING_X * 2;
  const slot = innerW / candles.length;
  const cw = Math.max(2, slot * 0.55);

  const yOf = (v: number) => PADDING_TOP + (1 - (v - min) / range) * innerH;

  // line path of closes for smooth backdrop
  const linePath = candles
    .map((c, i) => `${i === 0 ? "M" : "L"} ${PADDING_X + slot * i + slot / 2} ${yOf(c.close)}`)
    .join(" ");
  const areaPath = `${linePath} L ${PADDING_X + slot * (candles.length - 1) + slot / 2} ${HEIGHT - PADDING_BOTTOM} L ${PADDING_X + slot / 2} ${HEIGHT - PADDING_BOTTOM} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      className="w-full h-[200px]"
      preserveAspectRatio="none"
      onMouseLeave={() => onHover(null)}
    >
      <defs>
        <linearGradient id="areaG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--emerald)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--emerald)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1={PADDING_X}
          x2={width - PADDING_X}
          y1={PADDING_TOP + innerH * p}
          y2={PADDING_TOP + innerH * p}
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeDasharray="2 4"
        />
      ))}

      {/* area + line */}
      <path d={areaPath} fill="url(#areaG)" />
      <path d={linePath} fill="none" stroke="var(--emerald)" strokeWidth="1.25" strokeOpacity="0.55" />

      {/* candles */}
      {candles.map((c, i) => {
        const x = PADDING_X + slot * i + slot / 2;
        const isUp = c.close >= c.open;
        const color = isUp ? upColor : downColor;
        const bodyTop = yOf(Math.max(c.open, c.close));
        const bodyBottom = yOf(Math.min(c.open, c.close));
        const bodyH = Math.max(1, bodyBottom - bodyTop);
        const isHover = hover === i;
        return (
          <motion.g
            key={c.date}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            onMouseEnter={() => onHover(i)}
            style={{ cursor: "pointer" }}
          >
            {/* hit area */}
            <rect x={x - slot / 2} y={0} width={slot} height={HEIGHT} fill="transparent" />
            {/* wick */}
            <line x1={x} x2={x} y1={yOf(c.high)} y2={yOf(c.low)} stroke={color} strokeWidth={isHover ? 1.5 : 1} />
            {/* body */}
            <rect
              x={x - cw / 2}
              y={bodyTop}
              width={cw}
              height={bodyH}
              fill={color}
              opacity={isHover ? 1 : 0.92}
              rx={1}
            />
          </motion.g>
        );
      })}
    </svg>
  );
}
