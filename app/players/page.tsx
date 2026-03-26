"use client";
import NBANav from "../components/NBANav";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type SearchResult = {
  id: number;
  first_name: string;
  last_name: string;
  team?: { abbreviation: string };
  position?: string;
};

type Player = {
  id: number;
  name: string;
  team: string;
  pos: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  tpm: number;
  loading: boolean;
};

const STATS = [
  { key: "pts", label: "Points Per Game", max: 40 },
  { key: "reb", label: "Rebounds Per Game", max: 15 },
  { key: "ast", label: "Assists Per Game", max: 12 },
  { key: "stl", label: "Steals Per Game", max: 3 },
  { key: "blk", label: "Blocks Per Game", max: 3 },
  { key: "tpm", label: "3-Pointers Per Game", max: 6 },
];

function VSStatRow({ label, valA, valB, max }: { label: string; valA: number; valB: number; max: number }) {
  const aWins = valA >= valB;
  const bWins = valB >= valA;
  const pctA = Math.min((valA / max) * 100, 100);
  const pctB = Math.min((valB / max) * 100, 100);

  return (
    <div className="mb-6">
      <div className="text-center text-sm text-gray-400 mb-2">{label}</div>
      <div className="flex items-center gap-3">
        <span className={`w-10 text-right text-sm font-bold ${aWins ? "text-orange-400" : "text-gray-600"}`}>{valA}</span>
        <div className="flex-1 flex justify-end">
          <div className="w-full bg-gray-800 rounded-full h-3 flex justify-end overflow-hidden">
            <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${pctA}%`, backgroundColor: aWins ? "#f97316" : "#7c2d12" }} />
          </div>
        </div>
        <div className="w-px h-5 bg-gray-600 shrink-0" />
        <div className="flex-1">
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${pctB}%`, backgroundColor: bWins ? "#3b82f6" : "#1e3a5f" }} />
          </div>
        </div>
        <span className={`w-10 text-sm font-bold ${bWins ? "text-blue-400" : "text-gray-600"}`}>{valB}</span>
      </div>
    </div>
  );
}

function PlayerSearchBox({
  onSelect,
  disabled,
  placeholder,
}: {
  onSelect: (result: SearchResult) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/nba/players?search=${encodeURIComponent(search)}`);
        const json = await res.json();
        setResults(json.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [search]);

  return (
    <div className="relative max-w-md mb-10">
      <input
        type="text"
        placeholder={placeholder ?? "Search NBA players..."}
        value={search}
        onChange={e => setSearch(e.target.value)}
        disabled={disabled}
        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 disabled:opacity-50"
      />
      {search && (
        <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl mt-2 z-10 overflow-hidden shadow-2xl">
          {searching && <div className="px-5 py-4 text-gray-500 text-sm">Searching...</div>}
          {!searching && results.length === 0 && <div className="px-5 py-4 text-gray-500 text-sm">No players found</div>}
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => { onSelect(r); setSearch(""); setResults([]); }}
              className="w-full text-left px-5 py-3 hover:bg-gray-800 flex justify-between items-center border-b border-gray-800 last:border-0"
            >
              <span className="font-semibold">{r.first_name} {r.last_name}</span>
              <span className="text-orange-500 text-sm">{r.team?.abbreviation ?? "—"} · {r.position ?? "—"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

async function loadPlayerStats(result: SearchResult): Promise<Player> {
  const name = `${result.first_name} ${result.last_name}`;
  const teamAbbr = result.team?.abbreviation ?? "";
  const base: Player = {
    id: result.id,
    name,
    team: teamAbbr || "—",
    pos: result.position ?? "—",
    pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0,
    fgm: 0, fga: 0, tpm: 0,
    loading: false,
  };

  if (!teamAbbr) return base;

  try {
    const res = await fetch(
      `/api/nba/gamelog?playerName=${encodeURIComponent(name)}&teamAbbr=${encodeURIComponent(teamAbbr)}`
    );
    const json = await res.json();
    const games: any[] = json.games ?? [];
    if (games.length > 0) {
      const avg = (key: string) =>
        parseFloat((games.reduce((s: number, g: any) => s + (g[key] ?? 0), 0) / games.length).toFixed(1));
      return {
        ...base,
        pts: avg("pts"), reb: avg("reb"), ast: avg("ast"),
        stl: avg("stl"), blk: avg("blk"), tov: avg("tov"),
        fgm: avg("fgm"), fga: avg("fga"), tpm: avg("tpm"),
      };
    }
  } catch { /* fall through */ }

  return base;
}

function PlayersInner() {
  const [playerA, setPlayerA] = useState<Player | null>(null);
  const [playerB, setPlayerB] = useState<Player | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const name = searchParams.get("compare");
    if (!name) return;
    const decoded = decodeURIComponent(name);
    // Try to find the player via search
    fetch(`/api/nba/players?search=${encodeURIComponent(decoded)}`)
      .then(r => r.json())
      .then(async json => {
        const match = (json.data ?? []).find((p: SearchResult) =>
          `${p.first_name} ${p.last_name}`.toLowerCase() === decoded.toLowerCase()
        );
        if (match) {
          setLoadingA(true);
          const player = await loadPlayerStats(match);
          setPlayerA(player);
          setLoadingA(false);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectA = async (result: SearchResult) => {
    setLoadingA(true);
    setPlayerA(null);
    const player = await loadPlayerStats(result);
    setPlayerA(player);
    setLoadingA(false);
  };

  const handleSelectB = async (result: SearchResult) => {
    setLoadingB(true);
    setPlayerB(null);
    const player = await loadPlayerStats(result);
    setPlayerB(player);
    setLoadingB(false);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <NBANav />

      <div className="px-8 py-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2">Player Comparison</h1>
        <p className="text-gray-400 mb-8">Search for up to 2 players to compare their stats head to head.</p>

        {!playerA && !loadingA && (
          <PlayerSearchBox onSelect={handleSelectA} placeholder="Search for Player A..." />
        )}

        {loadingA && (
          <div className="flex items-center gap-3 mb-10 text-gray-400">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            Loading player stats...
          </div>
        )}

        {playerA && (
          <>
            <div className="bg-gray-900 rounded-2xl p-5 flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-orange-400">{playerA.name}</h2>
                <p className="text-gray-400 text-sm">{playerA.team} · {playerA.pos}</p>
              </div>
              <button
                onClick={() => { setPlayerA(null); setPlayerB(null); }}
                className="text-gray-600 hover:text-red-400 text-xl"
              >✕</button>
            </div>

            {!playerB && !loadingB && (
              <PlayerSearchBox onSelect={handleSelectB} placeholder="Search for Player B..." />
            )}

            {loadingB && (
              <div className="flex items-center gap-3 mb-10 text-gray-400">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading player stats...
              </div>
            )}
          </>
        )}

        {playerA && playerB && (
          <div className="bg-gray-900 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-extrabold text-orange-400">{playerA.name}</h2>
                <p className="text-gray-400">{playerA.team} · {playerA.pos}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-extrabold text-blue-400">{playerB.name}</h2>
                <p className="text-gray-400">{playerB.team} · {playerB.pos}</p>
              </div>
            </div>
            {STATS.map(stat => (
              <VSStatRow
                key={stat.key}
                label={stat.label}
                valA={(playerA as any)[stat.key]}
                valB={(playerB as any)[stat.key]}
                max={stat.max}
              />
            ))}
            <div className="text-center mt-8">
              <button
                onClick={() => { setPlayerA(null); setPlayerB(null); }}
                className="px-6 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:border-orange-500 hover:text-orange-500"
              >
                Compare Different Players
              </button>
            </div>
          </div>
        )}

        {!playerA && !loadingA && (
          <div className="text-center py-20 text-gray-600">
            <div className="text-6xl mb-4">🏀</div>
            <p className="text-xl">Search and select 2 players to compare</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PlayersPage() {
  return (
    <Suspense>
      <PlayersInner />
    </Suspense>
  );
}
