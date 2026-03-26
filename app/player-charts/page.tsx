"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import NBANav from "../components/NBANav";
import { useScoring } from "../ScoringContext";
import {
  ComposedChart, Bar, Area, LabelList, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

// ── Player type (populated dynamically from API) ───────────────────────────────
type Player = {
  bdlId: number;
  nbaId?: number;        // NBA.com ID — used for headshot + stats.nba.com fallback
  name: string;
  team: string;
  pos: string;
  // Current-season per-game averages (fetched after selection)
  pts: number; reb: number; ast: number; stl: number; blk: number;
  tov: number; fgm: number; fga: number; tpm: number; ftm: number; fta: number;
};

// NBA.com player IDs — loaded dynamically from /api/nba/roster on mount
// This map is populated at runtime; no static list needed.

// ── Game log generator ─────────────────────────────────────────────────────────
const ALL_TEAMS = [
  "ATL","BOS","BKN","CHA","CHI","CLE","DAL","DEN","DET","GSW",
  "HOU","IND","LAC","LAL","MEM","MIA","MIL","MIN","NOP","NYK",
  "OKC","ORL","PHI","PHX","POR","SAC","SAS","TOR","UTA","WAS",
];

type GameLog = {
  game: number;
  label: string;   // short date for x-axis
  date: string;    // full date for tooltip
  opp: string;
  wl: string;      // "W" | "L" | ""
  score: string;   // "115-108" | ""
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  min: number;
  oreb: number;
  dreb: number;
};

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateGameLog(player: Player): GameLog[] {
  const rand = seededRand(player.bdlId * 31337);
  const opponents = ALL_TEAMS.filter(t => t !== player.team);

  // Shuffle opponents deterministically
  const shuffled = [...opponents];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const games: GameLog[] = [];
  const baseDate = new Date();

  for (let i = 0; i < 15; i++) {
    const v = () => (rand() - 0.5) * 0.5; // ±25% variance
    const d = new Date(baseDate);
    d.setDate(d.getDate() - (14 - i) * 2);
    const label = `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`;

    const fgm  = Math.max(0, parseFloat((player.fgm * (1 + v() * 0.6)).toFixed(1)));
    const fga  = Math.max(fgm, parseFloat((player.fga * (1 + v() * 0.4)).toFixed(1)));
    const tpm  = Math.max(0,   parseFloat((player.tpm * (1 + v())).toFixed(1)));
    const tpa  = Math.max(tpm, parseFloat((player.tpm * 2.5 * (1 + v() * 0.4)).toFixed(1)));
    games.push({
      game: i + 1,
      label,
      date:  label,   // simulated — no year context
      opp:   shuffled[i],
      wl:    "",
      score: "",
      pts:  Math.max(0,  parseFloat((player.pts  * (1 + v())).toFixed(1))),
      reb:  Math.max(0,  parseFloat((player.reb  * (1 + v() * 0.8)).toFixed(1))),
      ast:  Math.max(0,  parseFloat((player.ast  * (1 + v() * 1.1)).toFixed(1))),
      stl:  Math.max(0,  parseFloat((player.stl  * (1 + v())).toFixed(1))),
      blk:  Math.max(0,  parseFloat((player.blk  * (1 + v())).toFixed(1))),
      tov:  Math.max(0,  parseFloat((player.tov  * (1 + v())).toFixed(1))),
      fgm, fga, tpm, tpa,
      ftm:  Math.max(0,  parseFloat((player.ftm  * (1 + v() * 0.7)).toFixed(1))),
      fta:  Math.max(0,  parseFloat((player.fta  * (1 + v() * 0.5)).toFixed(1))),
      min:  Math.min(48, Math.max(18, Math.round(32 + (rand() - 0.5) * 12))),
      oreb: Math.max(0,  parseFloat((player.reb * 0.25 * (1 + v())).toFixed(1))),
      dreb: Math.max(0,  parseFloat((player.reb * 0.75 * (1 + v())).toFixed(1))),
    });
  }

  return games;
}

// ── Chart colours ──────────────────────────────────────────────────────────────
const C = {
  pts:  "#f97316",
  reb:  "#3b82f6",
  ast:  "#22c55e",
  stl:  "#facc15",
  blk:  "#06b6d4",
  tov:  "#ef4444",
  min:  "#a855f7",
  fp:   "#e879f9",
  grid: "#374151",
  text: "#9ca3af",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function yDomain(values: number[]): [number, number] {
  if (!values.length) return [0, 10];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || max * 0.2 || 2;
  const pad = range * 0.35;
  return [
    parseFloat(Math.max(0, min - pad).toFixed(1)),
    parseFloat((max + pad).toFixed(1)),
  ];
}

function pctChange(first: number, last: number): number | null {
  if (!first) return null;
  return ((last - first) / Math.abs(first)) * 100;
}

function PctBadge({ data, keys }: { data: any[]; keys: string[] }) {
  if (data.length < 2) return null;
  const sum = (row: any) => keys.reduce((acc, k) => acc + (row[k] ?? 0), 0);
  const first = sum(data[0]);
  const last  = sum(data[data.length - 1]);
  const pct   = pctChange(first, last);
  if (pct === null) return null;
  const positive = pct >= 0;
  return (
    <span className="text-xs font-bold ml-2" style={{ color: positive ? "#22c55e" : "#ef4444" }}>
      {positive ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

// ── Tooltip helpers ────────────────────────────────────────────────────────────
function pct(made: number, att: number): string {
  if (!att) return "—";
  return ((made / att) * 100).toFixed(1) + "%";
}

function TooltipHeader({ d }: { d: any }) {
  const result = d?.wl
    ? `${d.wl}${d.score ? " " + d.score : ""}`
    : null;
  return (
    <div className="mb-3 pb-2 border-b border-gray-700">
      <p className="text-white font-bold text-sm">{d?.date ?? d?.label}</p>
      <p className="text-gray-400 text-xs mt-0.5">
        vs {d?.opp ?? "—"}
        {result && <span className={`ml-2 font-semibold ${d.wl === "W" ? "text-green-400" : "text-red-400"}`}>{result}</span>}
      </p>
    </div>
  );
}

function TooltipRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between gap-6 text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="font-bold" style={{ color: color ?? "#fff" }}>{value}</span>
    </div>
  );
}

function ShootingLines({ d }: { d: any }) {
  return (
    <>
      <TooltipRow label="Field Goals" value={`${d.fgm}/${d.fga} (${pct(d.fgm, d.fga)})`} />
      <TooltipRow label="3-Pointers"  value={`${d.tpm}/${d.tpa} (${pct(d.tpm, d.tpa)})`} />
      <TooltipRow label="Free Throws" value={`${d.ftm}/${d.fta} (${pct(d.ftm, d.fta)})`} />
      <TooltipRow label="Minutes"     value={d.min} />
    </>
  );
}

// Generic single-stat tooltip
function ChartTooltip({ active, payload, statName, color, dataKey }: any) {
  if (!active || !payload?.length) return null;
  const d   = payload[0]?.payload;
  const val = payload[0]?.value;
  const isReb = dataKey === "reb";
  const isTov = dataKey === "tov";
  const isMin = dataKey === "min";
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl min-w-[190px]">
      <TooltipHeader d={d} />
      <div className="space-y-1.5">
        <TooltipRow label={statName} value={val ?? "—"} color={color} />
        {isReb && (
          <>
            <TooltipRow label="Offensive Reb" value={d?.oreb ?? "—"} />
            <TooltipRow label="Defensive Reb" value={d?.dreb ?? "—"} />
          </>
        )}
        {!isMin && <TooltipRow label="Minutes" value={d?.min ?? "—"} />}
        {!isTov && !isReb && !isMin && (
          <div className="border-t border-gray-800 pt-1.5 mt-1">
            <ShootingLines d={d} />
          </div>
        )}
        {isTov && (
          <div className="border-t border-gray-800 pt-1.5 mt-1">
            <TooltipRow label="Assists"  value={d?.ast ?? "—"} color={C.ast} />
            <TooltipRow label="AST/TOV"  value={d?.tov ? (d.ast / d.tov).toFixed(1) : "—"} />
          </div>
        )}
      </div>
    </div>
  );
}

const fmtLabel = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
};

// Custom X-axis tick — two-line for ≤7 games, rotated single-line for 8+
function makeXTick(data: any[]) {
  const compact = data.length > 7;
  return ({ x, y, payload, index }: any) => {
    const opp = data[index]?.opp ?? "";
    if (compact) {
      return (
        <g transform={`translate(${x},${y + 4})`}>
          <text
            transform="rotate(-38)"
            x={0} y={0} dy={4}
            textAnchor="end"
            fill={C.text} fontSize={10}
          >
            {payload.value} · {opp}
          </text>
        </g>
      );
    }
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={12} textAnchor="middle" fill={C.text} fontSize={11}>
          {payload.value}
        </text>
        <text x={0} y={0} dy={25} textAnchor="middle" fill="#4b5563" fontSize={10}>
          {opp}
        </text>
      </g>
    );
  };
}

function avgOf(data: any[], key: string): string {
  if (!data.length) return "—";
  const avg = data.reduce((s, d) => s + (d[key] ?? 0), 0) / data.length;
  return Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
}

// ── Single stat bar chart ──────────────────────────────────────────────────────
function StatChart({
  title, dataKey, color, data,
}: { title: string; dataKey: string; color: string; data: any[] }) {
  const values = data.map(d => d[dataKey] as number);
  const domain = yDomain(values);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4 flex items-center">
        {title}
        <span className="text-gray-400 text-xs font-normal ml-2 normal-case tracking-normal">avg {avgOf(data, dataKey)}</span>
        <PctBadge data={data} keys={[dataKey]} />
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} barCategoryGap="30%" margin={{ bottom: 10 }}>
          <CartesianGrid vertical={false} stroke={C.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={makeXTick(data)} axisLine={false} tickLine={false} height={data.length > 7 ? 58 : 42} />
          <YAxis tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={36} domain={domain} />
          <Tooltip content={<ChartTooltip statName={title} color={color} dataKey={dataKey} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Area
            type="monotone" dataKey={dataKey} dot={false}
            stroke="none" fill={color} fillOpacity={0.12}
            isAnimationActive={false}
          />
          <Bar dataKey={dataKey} name={title} fill={color} radius={[4, 4, 0, 0]}>
            <LabelList dataKey={dataKey} position="top" formatter={fmtLabel}
              style={{ fill: color, fontSize: 10, fontWeight: "bold" }} />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── PRA stacked tooltip ────────────────────────────────────────────────────────
function PRATooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d   = payload[0]?.payload;
  const get = (key: string) => payload.find((p: any) => p.dataKey === key)?.value ?? 0;
  const pts = get("pts"), reb = get("reb"), ast = get("ast");
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl min-w-[190px]">
      <TooltipHeader d={d} />
      <div className="space-y-1.5">
        <TooltipRow label="Points"   value={pts} color={C.pts} />
        <TooltipRow label="Rebounds" value={reb} color={C.reb} />
        <TooltipRow label="Assists"  value={ast} color={C.ast} />
        <TooltipRow label="PRA Total" value={parseFloat((pts + reb + ast).toFixed(1))} color="#fff" />
        <div className="border-t border-gray-800 pt-1.5 mt-1">
          <ShootingLines d={d} />
        </div>
      </div>
    </div>
  );
}

// ── PRA stacked chart ──────────────────────────────────────────────────────────
function PRAChart({ data }: { data: any[] }) {
  const totals = data.map(d => d.pra_total as number);
  const domain = yDomain(totals);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4 flex items-center">
        PRA
        <span className="text-gray-400 text-xs font-normal ml-2 normal-case tracking-normal">avg {avgOf(data, "pra_total")}</span>
        <PctBadge data={data} keys={["pts", "reb", "ast"]} />
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} barCategoryGap="30%" margin={{ bottom: 10 }}>
          <CartesianGrid vertical={false} stroke={C.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={makeXTick(data)} axisLine={false} tickLine={false} height={data.length > 7 ? 58 : 42} />
          <YAxis tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={36} domain={domain} />
          <Tooltip content={<PRATooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: C.text, fontSize: 12, paddingTop: 12 }} />
          <Area
            type="monotone" dataKey="pra_total" dot={false}
            stroke="none" fill="rgba(255,255,255,0.08)" fillOpacity={1}
            isAnimationActive={false}
          />
          <Bar dataKey="ast" name="AST" stackId="pra" fill={C.ast} />
          <Bar dataKey="reb" name="REB" stackId="pra" fill={C.reb} />
          <Bar dataKey="pts" name="PTS" stackId="pra" fill={C.pts} radius={[4, 4, 0, 0]}>
            {/* LabelList on topmost bar shows total PRA value */}
            <LabelList dataKey="pra_total" position="top" formatter={fmtLabel}
              style={{ fill: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "bold" }} />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── STL+BLK stacked tooltip ────────────────────────────────────────────────────
function STLBLKTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d   = payload[0]?.payload;
  const get = (key: string) => payload.find((p: any) => p.dataKey === key)?.value ?? 0;
  const stl = get("stl"), blk = get("blk");
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl min-w-[180px]">
      <TooltipHeader d={d} />
      <div className="space-y-1.5">
        <TooltipRow label="Steals" value={stl} color={C.stl} />
        <TooltipRow label="Blocks" value={blk} color={C.blk} />
        <TooltipRow label="Combined" value={parseFloat((stl + blk).toFixed(1))} color="#fff" />
        <div className="border-t border-gray-800 pt-1.5 mt-1">
          <TooltipRow label="Minutes" value={d?.min ?? "—"} />
        </div>
      </div>
    </div>
  );
}

// ── STL+BLK stacked chart ──────────────────────────────────────────────────────
function STLBLKChart({ data }: { data: any[] }) {
  const totals = data.map(d => d.sb_total as number);
  const domain = yDomain(totals);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4 flex items-center">
        STL+BLK
        <span className="text-gray-400 text-xs font-normal ml-2 normal-case tracking-normal">avg {avgOf(data, "sb_total")}</span>
        <PctBadge data={data} keys={["stl", "blk"]} />
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} barCategoryGap="30%" margin={{ bottom: 10 }}>
          <CartesianGrid vertical={false} stroke={C.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={makeXTick(data)} axisLine={false} tickLine={false} height={data.length > 7 ? 58 : 42} />
          <YAxis tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={36} domain={domain} />
          <Tooltip content={<STLBLKTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: C.text, fontSize: 12, paddingTop: 12 }} />
          <Area
            type="monotone" dataKey="sb_total" dot={false}
            stroke="none" fill="rgba(255,255,255,0.08)" fillOpacity={1}
            isAnimationActive={false}
          />
          <Bar dataKey="blk" name="BLK" stackId="sb" fill={C.blk} />
          <Bar dataKey="stl" name="STL" stackId="sb" fill={C.stl} radius={[4, 4, 0, 0]}>
            <LabelList dataKey="sb_total" position="top" formatter={fmtLabel}
              style={{ fill: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "bold" }} />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Fantasy Points tooltip ────────────────────────────────────────────────────
function FantasyTooltip({ active, payload, scoring }: any) {
  if (!active || !payload?.length) return null;
  const d  = payload[0]?.payload;
  const fp = payload[0]?.value;
  if (!d) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl min-w-[200px]">
      <TooltipHeader d={d} />
      <div className="space-y-1.5">
        <TooltipRow label="Fantasy Pts" value={fp} color={C.fp} />
        <div className="border-t border-gray-800 pt-1.5 mt-1 space-y-1">
          <TooltipRow label="Points"    value={`${d.pts} × ${scoring.pts}`} />
          <TooltipRow label="Rebounds"  value={`${d.reb} × ${scoring.reb}`} />
          <TooltipRow label="Assists"   value={`${d.ast} × ${scoring.ast}`} />
          <TooltipRow label="Steals"    value={`${d.stl} × ${scoring.stl}`} />
          <TooltipRow label="Blocks"    value={`${d.blk} × ${scoring.blk}`} />
          <TooltipRow label="Turnovers" value={`${d.tov} × ${scoring.tov}`} />
          <TooltipRow label="3-Pointers" value={`${d.tpm} × ${scoring.tpm}`} />
          {d.isTD && scoring.td !== 0 && (
            <TooltipRow label="Triple-Double" value={`+${scoring.td}`} color="#f97316" />
          )}
          {d.isDD && !d.isTD && scoring.dd !== 0 && (
            <TooltipRow label="Double-Double" value={`+${scoring.dd}`} color="#f97316" />
          )}
        </div>
        <div className="border-t border-gray-800 pt-1.5">
          <TooltipRow label="Minutes" value={d.min} />
        </div>
      </div>
    </div>
  );
}

// ── Fantasy Points chart ───────────────────────────────────────────────────────
function FantasyChart({ data, scoring }: { data: (GameLog & { fp: number })[]; scoring: any }) {
  const values = data.map(d => d.fp);
  const domain = yDomain(values);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4 flex items-center">
        Fantasy Pts
        <span className="text-gray-400 text-xs font-normal ml-2 normal-case tracking-normal">avg {avgOf(data, "fp")}</span>
        <PctBadge data={data} keys={["fp"]} />
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} barCategoryGap="30%" margin={{ bottom: 10 }}>
          <CartesianGrid vertical={false} stroke={C.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={makeXTick(data)} axisLine={false} tickLine={false} height={data.length > 7 ? 58 : 42} />
          <YAxis tick={{ fill: C.text, fontSize: 11 }} axisLine={false} tickLine={false} width={36} domain={domain} />
          <Tooltip content={<FantasyTooltip scoring={scoring} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Area
            type="monotone" dataKey="fp" dot={false}
            stroke="none" fill={C.fp} fillOpacity={0.12}
            isAnimationActive={false}
          />
          <Bar dataKey="fp" name="Fantasy Pts" fill={C.fp} radius={[4, 4, 0, 0]}>
            <LabelList dataKey="fp" position="top" formatter={fmtLabel}
              style={{ fill: C.fp, fontSize: 10, fontWeight: "bold" }} />
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PlayerChartsPage() {
  const { scoring } = useScoring();
  const [query, setQuery]               = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected]         = useState<Player | null>(null);
  const [teamFilter, setTeamFilter]     = useState("ALL");
  const [gameRange, setGameRange]       = useState<5 | 10 | 15>(15);
  const [imgError, setImgError]         = useState(false);
  const [realLog, setRealLog]           = useState<GameLog[] | null>(null);
  const [loadingLog, setLoadingLog]     = useState(false);
  const [usingReal, setUsingReal]       = useState(false);
  const [avgLoaded, setAvgLoaded]       = useState(false);
  // NBA.com player ID map — fetched once from /api/nba/roster
  const [nbaIdMap, setNbaIdMap] = useState<Record<string, number>>({});
  // Dynamic player search results
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  // Multi-season history for vs-team filter
  const [historyLog, setHistoryLog]     = useState<GameLog[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyFetchedFor               = useRef<string | null>(null);

  // Fetch full current-season roster (name → NBA ID) once on mount
  useEffect(() => {
    fetch("/api/nba/roster")
      .then(r => r.json())
      .then(data => { if (data.nameToId) setNbaIdMap(data.nameToId); })
      .catch(() => {});
  }, []);

  // Debounced player search
  useEffect(() => {
    if (query.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      setSearchLoading(true);
      fetch(`/api/nba/players?search=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => setSearchResults(data.data ?? []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch current-season game log when a player is picked
  useEffect(() => {
    if (!selected) { setRealLog(null); return; }
    setLoadingLog(true);
    setRealLog(null);
    setUsingReal(false);

    fetch(
      `/api/nba/gamelog?playerName=${encodeURIComponent(selected.name)}&teamAbbr=${encodeURIComponent(selected.team)}`
    )
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (data.games?.length > 0) { setRealLog(data.games); setUsingReal(true); }
      })
      .catch(() => {})
      .finally(() => setLoadingLog(false));
  }, [selected]);

  // Lazy-load multi-season history the first time a team filter is set
  useEffect(() => {
    if (!selected || teamFilter === "ALL") return;
    if (historyFetchedFor.current === selected.name) return;

    historyFetchedFor.current = selected.name;
    setHistoryLoading(true);

    fetch(
      `/api/nba/gamelog?playerName=${encodeURIComponent(selected.name)}&teamAbbr=${encodeURIComponent(selected.team)}&multi=true`
    )
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (data.games?.length > 0) setHistoryLog(data.games);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [selected, teamFilter]);

  // Source for "All games" view
  const currentLog = useMemo(
    () => realLog ?? (selected ? generateGameLog(selected) : []),
    [realLog, selected]
  );

  // Opponents list derived from history (multi-season) or current log
  const opponents = useMemo(
    () => [...new Set((historyLog ?? currentLog).map(g => g.opp))].sort(),
    [historyLog, currentLog]
  );

  const chartData = useMemo(() => {
    let source: GameLog[];
    if (teamFilter === "ALL") {
      source = currentLog;
    } else {
      // Use multi-season history; exclude games where the player was on that team
      const base = historyLog ?? currentLog;
      source = base.filter(g => g.opp === teamFilter);
    }

    return source.slice(-gameRange).map(g => {
      const doubleCategories = [g.pts, g.reb, g.ast, g.stl, g.blk].filter(v => v >= 10).length;
      const isDD = doubleCategories >= 2;
      const isTD = doubleCategories >= 3;
      const bonus = isTD ? scoring.td : isDD ? scoring.dd : 0;
      return {
        ...g,
        pra_total: parseFloat((g.pts + g.reb + g.ast).toFixed(1)),
        sb_total:  parseFloat((g.stl + g.blk).toFixed(1)),
        isDD,
        isTD,
        fp: parseFloat((
          g.pts  * scoring.pts +
          g.reb  * scoring.reb +
          g.ast  * scoring.ast +
          g.stl  * scoring.stl +
          g.blk  * scoring.blk +
          g.tov  * scoring.tov +
          g.fgm  * scoring.fgm +
          g.fga  * scoring.fga +
          g.tpm  * scoring.tpm +
          g.ftm  * scoring.ftm +
          g.fta  * scoring.fta +
          bonus
        ).toFixed(1)),
      };
    });
  }, [currentLog, historyLog, teamFilter, gameRange, scoring]);

  // Called when user clicks a result from the dropdown
  const pick = (raw: any) => {
    const name  = `${raw.first_name} ${raw.last_name}`;
    const nbaId = nbaIdMap[name];
    const player: Player = {
      bdlId: raw.id,
      nbaId,
      name,
      team: raw.team?.abbreviation ?? "???",
      pos:  raw.position || "—",
      pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
      tov: 0, fgm: 0, fga: 0, tpm: 0, ftm: 0, fta: 0,
    };
    setSelected(player);
    setQuery(name);
    setShowDropdown(false);
    setTeamFilter("ALL");
    setGameRange(15);
    setImgError(false);
    setRealLog(null);
    setUsingReal(false);
    setAvgLoaded(false);
    setHistoryLog(null);
    setHistoryLoading(false);
    historyFetchedFor.current = null;

    // Fetch current-season averages to power the simulated fallback
    fetch(`/api/nba/season-averages?bdlId=${raw.id}`)
      .then(r => r.json())
      .then(data => {
        const a = data.data;
        if (!a) return;
        setSelected(prev => prev?.bdlId !== raw.id ? prev : {
          ...prev!,
          pts: a.pts      ?? 0, reb: a.reb      ?? 0, ast: a.ast      ?? 0,
          stl: a.stl      ?? 0, blk: a.blk      ?? 0, tov: a.turnover ?? 0,
          fgm: a.fgm      ?? 0, fga: a.fga      ?? 0, tpm: a.fg3m     ?? 0,
          ftm: a.ftm      ?? 0, fta: a.fta      ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setAvgLoaded(true));
  };

  const photoUrl = selected?.nbaId
    ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${selected.nbaId}.png`
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NBANav />

      {/* ── Search ── */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <h1 className="text-2xl font-extrabold tracking-widest uppercase mb-6">Player Charts</h1>
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search player..."
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-xl px-5 py-3 text-white placeholder-gray-500 outline-none transition-colors text-sm"
          />
          {showDropdown && query.length >= 2 && (searchLoading || searchResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden z-50 shadow-2xl">
              {searchLoading && (
                <div className="px-5 py-3 text-sm text-gray-500 animate-pulse">Searching…</div>
              )}
              {!searchLoading && searchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => pick(p)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-800 text-left text-sm border-b border-gray-800 last:border-0 transition-colors"
                >
                  <span className="text-white font-semibold">{p.first_name} {p.last_name}</span>
                  <span className="text-gray-500 ml-auto">{p.team?.abbreviation ?? "—"}</span>
                  <span className="text-gray-600 text-xs">{p.position || "—"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Player selected ── */}
      {selected && (
        <div className="max-w-6xl mx-auto px-4 pb-16">

          {/* Player header */}
          <div className="flex items-center gap-5 mb-6 bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4">
            {photoUrl && !imgError ? (
              <img
                src={photoUrl}
                alt={selected.name}
                onError={() => setImgError(true)}
                className="h-16 w-16 object-cover rounded-full bg-gray-800"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center">
                <svg viewBox="0 0 100 140" className="h-10 text-gray-600 fill-current">
                  <circle cx="50" cy="35" r="22" />
                  <ellipse cx="50" cy="110" rx="38" ry="30" />
                </svg>
              </div>
            )}
            <div>
              <p className="text-xl font-extrabold">{selected.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-gray-400 text-sm">{selected.pos} · {selected.team}</p>
                {(loadingLog || (!usingReal && !avgLoaded)) && (
                  <span className="text-xs text-gray-500 animate-pulse">fetching live data…</span>
                )}
                {!loadingLog && avgLoaded && usingReal && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-900 text-green-400">
                    LIVE
                  </span>
                )}
                {!loadingLog && avgLoaded && !usingReal && selected.pts > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">
                    SIMULATED
                  </span>
                )}
                {!loadingLog && avgLoaded && !usingReal && selected.pts === 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-950 text-red-500">
                    NO 2025-26 DATA
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="ml-auto flex items-center gap-4">
              {/* Game range toggle */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                {([5, 10, 15] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setGameRange(n)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                      gameRange === n
                        ? "bg-orange-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    L{n}
                  </button>
                ))}
              </div>

              {/* Team filter */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">vs.</span>
                <select
                  value={teamFilter}
                  onChange={e => setTeamFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500 transition-colors cursor-pointer"
                >
                  <option value="ALL">All Games</option>
                  {opponents.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {(loadingLog || (!usingReal && !avgLoaded)) ? (
            <div className="text-center text-gray-500 py-20 animate-pulse">
              Loading player data…
            </div>
          ) : !usingReal && selected.pts === 0 ? (
            <div className="text-center text-gray-500 py-20">
              <p className="text-lg font-semibold mb-2">No data available for this season</p>
              <p className="text-sm text-gray-600">{selected.name} has no 2025-26 stats on record.</p>
            </div>
          ) : teamFilter !== "ALL" && historyLoading ? (
            <div className="text-center text-gray-500 py-20 animate-pulse">
              Loading historical matchups vs {teamFilter}…
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              No games found vs {teamFilter}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <StatChart title="Minutes"    dataKey="min" color={C.min} data={chartData} />
              <StatChart title="Points"     dataKey="pts" color={C.pts} data={chartData} />
              <StatChart title="Rebounds"   dataKey="reb" color={C.reb} data={chartData} />
              <StatChart title="Assists"    dataKey="ast" color={C.ast} data={chartData} />
              <STLBLKChart data={chartData} />
              <StatChart title="Turnovers"  dataKey="tov" color={C.tov} data={chartData} />
              <PRAChart data={chartData} />
              <FantasyChart data={chartData} scoring={scoring} />
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {!selected && (
        <div className="flex flex-col items-center justify-center py-32 text-gray-600">
          <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-semibold">Search for a player to see their charts</p>
        </div>
      )}
    </div>
  );
}
