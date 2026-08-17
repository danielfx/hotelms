"use client";

import { useMemo, useState } from "react";
import type { PricePoint } from "@/lib/types";
import { formatCompactDate, money } from "@/lib/format";

const ranges = [
  { id: "3m", label: "3M", weeks: 13 },
  { id: "6m", label: "6M", weeks: 26 },
  { id: "1y", label: "1Y", weeks: 52 },
  { id: "all", label: "ALL", weeks: 999 },
] as const;

export function PriceChart({ history }: { history: PricePoint[] }) {
  const [range, setRange] = useState<(typeof ranges)[number]["id"]>("1y");
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo(() => {
    const weeks = ranges.find((r) => r.id === range)?.weeks ?? 52;
    return history.slice(-Math.min(weeks + 1, history.length));
  }, [history, range]);

  const width = 720;
  const height = 240;
  const pad = { t: 16, r: 12, b: 28, l: 52 };
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices) * 0.94;
  const max = Math.max(...prices) * 1.04;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const coords = points.map((point, i) => {
    const x = pad.l + (i / Math.max(points.length - 1, 1)) * innerW;
    const y = pad.t + (1 - (point.price - min) / (max - min || 1)) * innerH;
    return { ...point, x, y };
  });

  const d = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const area = `${d} L ${coords[coords.length - 1]?.x ?? 0} ${height - pad.b} L ${pad.l} ${height - pad.b} Z`;
  const active = hover !== null ? coords[hover] : coords[coords.length - 1];
  const first = coords[0];
  const change = first ? ((active.price - first.price) / first.price) * 100 : 0;
  const up = change >= 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">Last print</p>
          <p className="mt-1 font-mono text-2xl text-bone">{money(active.price)}</p>
          <p className={`font-mono text-xs ${up ? "text-mint" : "text-warn"}`}>
            {up ? "+" : ""}
            {change.toFixed(1)}% · {ranges.find((r) => r.id === range)?.label}
            {hover !== null ? ` · ${formatCompactDate(active.date)}` : ""}
          </p>
        </div>
        <div className="flex border border-line">
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`h-8 px-3 font-mono text-[10px] tracking-[0.14em] ${
                range === r.id ? "bg-candy text-white" : "text-fog hover:text-bone"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full"
        onMouseLeave={() => setHover(null)}
      >
        {[0, 1, 2, 3].map((i) => {
          const y = pad.t + (i / 3) * innerH;
          const val = max - (i / 3) * (max - min);
          return (
            <g key={i}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="#2a2a32" />
              <text
                x={pad.l - 8}
                y={y + 3}
                textAnchor="end"
                fill="#9a9388"
                fontSize="10"
                fontFamily="var(--font-ibm)"
              >
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
              </text>
            </g>
          );
        })}
        <path d={area} fill={up ? "rgba(125,255,179,0.08)" : "rgba(255,138,122,0.08)"} />
        <path d={d} fill="none" stroke={up ? "#7dffb3" : "#ff8a7a"} strokeWidth="2" />
        {coords.map((c, i) => (
          <rect
            key={c.date}
            x={c.x - innerW / coords.length / 2}
            y={pad.t}
            width={innerW / coords.length}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
        <circle cx={active.x} cy={active.y} r="4" fill="#ff2f6d" />
        <text x={coords[0].x} y={height - 8} fill="#9a9388" fontSize="10" fontFamily="var(--font-ibm)">
          {formatCompactDate(coords[0].date)}
        </text>
        <text
          x={coords[coords.length - 1].x}
          y={height - 8}
          textAnchor="end"
          fill="#9a9388"
          fontSize="10"
          fontFamily="var(--font-ibm)"
        >
          {formatCompactDate(coords[coords.length - 1].date)}
        </text>
      </svg>
    </div>
  );
}
