"use client";
import NBANav from "../components/NBANav";
import { useState, useEffect, useRef } from "react";

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
  pts: number; reb: number; ast: number; stl: number; blk: number; tov: number;
  fgm: number; fga: number; tpm: number;
  loading: boolean;
};

const STAT_KEYS = ["pts", "reb", "ast", "stl", "blk", "tov", "fgm", "fga", "tpm"] as const;
const STAT_LABELS: Record<string, string> = {
  pts: "PTS", reb: "REB", ast: "AST", stl: "STL",
  blk: "BLK", tov: "TOV", fgm: "FGM", fga: "FGA", tpm: "3PM",
};

const NBA_TEAM_IDS: Record<string, number> = {
  ATL: 1610612737, BOS: 1610612738, BKN: 1610612751,
  CHA: 1610612766, CHI: 1610612741, CLE: 1610612739,
  DAL: 1610612742, DEN: 1610612743, DET: 1610612765,
  GSW: 1610612744, HOU: 1610612745, IND: 1610612754,
  LAC: 1610612746, LAL: 1610612747, MEM: 1610612763,
  MIA: 1610612748, MIL: 1610612749, MIN: 1610612750,
  NOP: 1610612740, NYK: 1610612752, OKC: 1610612760,
  ORL: 1610612753, PHI: 1610612755, PHX: 1610612756,
  POR: 1610612757, SAC: 1610612758, SAS: 1610612759,
  TOR: 1610612761, UTA: 1610612762, WAS: 1610612764,
};

function PlayerCard({
  player, players, onRemove, single,
}: {
  player: Player;
  players: Player[];
  onRemove: () => void;
  single?: boolean;
}) {
  const teamId = NBA_TEAM_IDS[player.team];

  const isLeader = (key: string) => {
    if (players.length <= 1) return true;
    const max = Math.max(...players.map(p => (p as any)[key]));
    return (player as any)[key] === max;
  };

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden relative flex flex-col ${single ? "max-w-sm w-full" : "w-full"}`}>
      <button
        onClick={onRemove}
        className="absolute top-2 left-2 z-10 w-6 h-6 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center text-xs text-gray-400 hover:text-white transition-colors"
      >
        ✕
      </button>

      <div className={`relative bg-gray-800 ${single ? "h-28" : "h-20"} flex items-center justify-end pr-3`}>
        {teamId && (
          <img
            src={`https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`}
            alt={player.team}
            className={`object-contain ${single ? "w-16 h-16" : "w-10 h-10"}`}
          />
        )}
      </div>

      <div className="p-3 flex-1">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className={`font-extrabold leading-tight ${single ? "text-xl" : "text-sm"}`}>{player.name}</h3>
            <p className="text-gray-500 text-xs">{player.team} · {player.pos || "—"}</p>
          </div>
        </div>

        {player.loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-xs text-gray-500">Loading stats…</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {STAT_KEYS.map(key => {
              const leader = isLeader(key);
              return (
                <div
                  key={key}
                  className="rounded-lg p-1.5 text-center"
                  style={{ backgroundColor: leader ? "rgba(34,197,94,0.15)" : "rgba(31,41,55,1)" }}
                >
                  <p className="text-gray-500 uppercase" style={{ fontSize: "9px" }}>{STAT_LABELS[key]}</p>
                  <p className="font-bold text-xs" style={{ color: leader ? "#22c55e" : "#6b7280" }}>
                    {(player as any)[key]}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AddMoreSlot() {
  return (
    <div className="w-full bg-gray-900/40 border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center min-h-48">
      <p className="text-gray-600 font-semibold text-sm tracking-wide">Add One More!</p>
    </div>
  );
}

export default function NBAPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/nba/players?search=${encodeURIComponent(search)}`);
        const json = await res.json();
        const already = new Set(players.map(p => p.id));
        setResults((json.data ?? []).filter((p: SearchResult) => !already.has(p.id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [search, players]);

  const addPlayer = async (result: SearchResult) => {
    if (players.length >= 4) return;
    const name = `${result.first_name} ${result.last_name}`;
    const teamAbbr = result.team?.abbreviation ?? "";
    const placeholder: Player = {
      id: result.id,
      name,
      team: teamAbbr || "—",
      pos: result.position ?? "—",
      pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0,
      fgm: 0, fga: 0, tpm: 0,
      loading: true,
    };
    setPlayers(prev => [...prev, placeholder]);
    setSearch("");
    setResults([]);

    if (!teamAbbr) {
      setPlayers(prev => prev.map(p => p.id === result.id ? { ...p, loading: false } : p));
      return;
    }

    try {
      const glRes = await fetch(
        `/api/nba/gamelog?playerName=${encodeURIComponent(name)}&teamAbbr=${encodeURIComponent(teamAbbr)}`
      );
      const glJson = await glRes.json();
      const games: any[] = glJson.games ?? [];

      if (games.length > 0) {
        const avg = (key: string) =>
          parseFloat((games.reduce((s: number, g: any) => s + (g[key] ?? 0), 0) / games.length).toFixed(1));
        setPlayers(prev => prev.map(p => p.id === result.id ? {
          ...p,
          pts: avg("pts"), reb: avg("reb"), ast: avg("ast"),
          stl: avg("stl"), blk: avg("blk"), tov: avg("tov"),
          fgm: avg("fgm"), fga: avg("fga"), tpm: avg("tpm"),
          loading: false,
        } : p));
        return;
      }
    } catch { /* fall through */ }

    setPlayers(prev => prev.map(p => p.id === result.id ? { ...p, loading: false } : p));
  };

  const removePlayer = (id: number) => setPlayers(prev => prev.filter(p => p.id !== id));

  const renderGrid = () => {
    if (players.length === 0) {
      return (
        <div className="text-center py-24 text-gray-700">
          <div className="text-6xl mb-4">🏀</div>
          <p className="text-xl">Search a player to get started</p>
        </div>
      );
    }

    if (players.length === 1) {
      return (
        <div className="flex justify-center">
          <PlayerCard
            player={players[0]}
            players={players}
            onRemove={() => removePlayer(players[0].id)}
            single
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {players.map(p => (
          <PlayerCard
            key={p.id}
            player={p}
            players={players}
            onRemove={() => removePlayer(p.id)}
          />
        ))}
        {players.length === 3 && <AddMoreSlot />}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <NBANav />

      <div className="flex min-h-[calc(100vh-73px)]">

        {/* Left — Search */}
        <div className="w-80 shrink-0 flex flex-col justify-center px-8 py-12 border-r border-gray-800">
          <h1 className="text-2xl font-extrabold mb-1">Player Search</h1>
          <p className="text-gray-500 text-sm mb-6">Compare up to 4 players.</p>

          <div className="relative">
            <input
              type="text"
              placeholder={players.length >= 4 ? "Max 4 players" : "Search players..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={players.length >= 4}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 disabled:opacity-40"
            />
            {search && (
              <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl mt-2 z-10 overflow-hidden shadow-2xl">
                {searching && (
                  <div className="px-4 py-3 text-gray-500 text-sm">Searching…</div>
                )}
                {!searching && results.length === 0 && (
                  <div className="px-4 py-3 text-gray-500 text-sm">No players found</div>
                )}
                {results.map(result => (
                  <button
                    key={result.id}
                    onClick={() => addPlayer(result)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-800 flex justify-between items-center border-b border-gray-800 last:border-0"
                  >
                    <span className="font-semibold text-sm">{result.first_name} {result.last_name}</span>
                    <span className="text-orange-500 text-xs">{result.team?.abbreviation ?? "—"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Comparison Grid */}
        <div className="flex-1 p-8">
          {renderGrid()}
        </div>

      </div>
    </main>
  );
}
