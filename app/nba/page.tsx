"use client";
import NBANav from "../components/NBANav";
import { useState } from "react";

const NBA_PLAYERS = [
  { id: 1, name: "LeBron James", team: "LAL", pos: "SF", pts: 23.2, reb: 8.4, ast: 9.0, stl: 1.1, blk: 0.5, tov: 3.5, fgm: 8.4, fga: 15.5, tpm: 1.5, ftm: 4.9, fta: 6.5 },
  { id: 2, name: "Stephen Curry", team: "GSW", pos: "PG", pts: 22.5, reb: 3.8, ast: 6.1, stl: 1.2, blk: 0.3, tov: 3.1, fgm: 8.1, fga: 17.0, tpm: 4.8, ftm: 3.9, fta: 4.3 },
  { id: 3, name: "Kevin Durant", team: "PHX", pos: "SF", pts: 26.9, reb: 6.9, ast: 4.0, stl: 0.9, blk: 1.0, tov: 3.3, fgm: 10.2, fga: 18.6, tpm: 1.8, ftm: 6.1, fta: 7.0 },
  { id: 4, name: "Giannis Antetokounmpo", team: "MIL", pos: "PF", pts: 32.7, reb: 11.5, ast: 5.8, stl: 1.2, blk: 1.1, tov: 3.8, fgm: 12.4, fga: 20.1, tpm: 0.5, ftm: 7.3, fta: 11.2 },
  { id: 5, name: "Nikola Jokic", team: "DEN", pos: "C", pts: 29.6, reb: 12.7, ast: 10.2, stl: 1.8, blk: 0.8, tov: 3.6, fgm: 11.3, fga: 18.4, tpm: 0.6, ftm: 6.4, fta: 7.8 },
  { id: 6, name: "Luka Doncic", team: "DAL", pos: "PG", pts: 28.6, reb: 9.2, ast: 8.0, stl: 1.4, blk: 0.5, tov: 4.0, fgm: 10.1, fga: 21.2, tpm: 3.2, ftm: 7.8, fta: 9.5 },
  { id: 7, name: "Joel Embiid", team: "PHI", pos: "C", pts: 24.7, reb: 8.4, ast: 4.4, stl: 0.8, blk: 1.4, tov: 3.2, fgm: 9.1, fga: 17.0, tpm: 0.4, ftm: 7.5, fta: 9.8 },
  { id: 8, name: "Jayson Tatum", team: "BOS", pos: "SF", pts: 26.0, reb: 8.5, ast: 5.3, stl: 1.1, blk: 0.5, tov: 2.9, fgm: 9.5, fga: 20.4, tpm: 3.1, ftm: 5.4, fta: 6.6 },
  { id: 9, name: "Devin Booker", team: "PHX", pos: "SG", pts: 25.8, reb: 4.4, ast: 6.5, stl: 1.1, blk: 0.3, tov: 3.0, fgm: 9.3, fga: 19.1, tpm: 2.6, ftm: 6.3, fta: 7.4 },
  { id: 10, name: "Anthony Edwards", team: "MIN", pos: "SG", pts: 25.6, reb: 5.3, ast: 5.0, stl: 1.3, blk: 0.5, tov: 2.8, fgm: 9.2, fga: 20.3, tpm: 3.4, ftm: 4.8, fta: 5.9 },
  { id: 11, name: "Shai Gilgeous-Alexander", team: "OKC", pos: "PG", pts: 32.7, reb: 5.5, ast: 6.4, stl: 2.1, blk: 1.0, tov: 2.5, fgm: 11.5, fga: 20.8, tpm: 1.9, ftm: 9.8, fta: 11.4 },
  { id: 12, name: "Damian Lillard", team: "MIL", pos: "PG", pts: 24.3, reb: 4.4, ast: 7.1, stl: 0.9, blk: 0.3, tov: 2.9, fgm: 8.2, fga: 18.9, tpm: 4.1, ftm: 5.8, fta: 6.7 },
  { id: 13, name: "Donovan Mitchell", team: "CLE", pos: "SG", pts: 24.5, reb: 4.5, ast: 6.1, stl: 1.5, blk: 0.3, tov: 2.7, fgm: 8.9, fga: 19.4, tpm: 2.8, ftm: 5.5, fta: 6.8 },
  { id: 14, name: "Kawhi Leonard", team: "LAC", pos: "SF", pts: 23.7, reb: 6.3, ast: 3.6, stl: 1.6, blk: 0.8, tov: 1.9, fgm: 8.8, fga: 17.1, tpm: 1.7, ftm: 5.1, fta: 6.2 },
  { id: 15, name: "Tyrese Haliburton", team: "IND", pos: "PG", pts: 20.1, reb: 3.9, ast: 10.9, stl: 1.5, blk: 0.4, tov: 3.3, fgm: 7.1, fga: 15.8, tpm: 3.2, ftm: 2.6, fta: 3.1 },
  { id: 16, name: "Bam Adebayo", team: "MIA", pos: "C", pts: 19.3, reb: 10.4, ast: 3.6, stl: 1.1, blk: 0.9, tov: 2.4, fgm: 7.8, fga: 13.9, tpm: 0.1, ftm: 3.6, fta: 5.1 },
  { id: 17, name: "Karl-Anthony Towns", team: "NYK", pos: "C", pts: 24.3, reb: 13.2, ast: 3.1, stl: 0.8, blk: 0.9, tov: 2.6, fgm: 9.0, fga: 17.5, tpm: 2.3, ftm: 4.0, fta: 4.9 },
  { id: 18, name: "Trae Young", team: "ATL", pos: "PG", pts: 23.5, reb: 3.2, ast: 11.5, stl: 1.1, blk: 0.1, tov: 4.1, fgm: 7.9, fga: 18.2, tpm: 2.9, ftm: 6.8, fta: 8.3 },
  { id: 19, name: "Zion Williamson", team: "NOP", pos: "PF", pts: 22.9, reb: 5.8, ast: 5.0, stl: 1.1, blk: 0.6, tov: 2.8, fgm: 9.5, fga: 16.5, tpm: 0.2, ftm: 3.7, fta: 5.8 },
  { id: 20, name: "Ja Morant", team: "MEM", pos: "PG", pts: 22.8, reb: 5.8, ast: 9.5, stl: 1.4, blk: 0.5, tov: 3.1, fgm: 8.6, fga: 17.9, tpm: 1.4, ftm: 5.2, fta: 6.8 },
];

type Player = typeof NBA_PLAYERS[0];

const STAT_KEYS = ["pts", "reb", "ast", "stl", "blk", "tov", "fgm", "fga", "tpm"] as const;
const STAT_LABELS: Record<string, string> = {
  pts: "PTS", reb: "REB", ast: "AST", stl: "STL",
  blk: "BLK", tov: "TOV", fgm: "FGM", fga: "FGA", tpm: "3PM",
};

const INJURY_DATA: Record<string, { injury: string; status: string }> = {
  "LeBron James": { injury: "Left Ankle Sprain", status: "Day-To-Day" },
  "Joel Embiid": { injury: "Left Knee Inflammation", status: "Out" },
  "Ja Morant": { injury: "Right Shoulder Soreness", status: "Questionable" },
  "Kawhi Leonard": { injury: "Load Management", status: "Out" },
  "Zion Williamson": { injury: "Hamstring Strain", status: "Out 2-3 Weeks" },
  "Damian Lillard": { injury: "Achilles Soreness", status: "Questionable" },
  "Anthony Edwards": { injury: "Ankle Contusion", status: "Day-To-Day" },
  "Karl-Anthony Towns": { injury: "Knee Soreness", status: "Day-To-Day" },
};

const STATUS_COLORS: Record<string, string> = {
  "Day-To-Day": "bg-yellow-500",
  "Questionable": "bg-orange-500",
  "Out": "bg-red-600",
  "Out 2-3 Weeks": "bg-red-800",
  "Healthy": "bg-green-600",
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

const NBA_PLAYER_IDS: Record<string, number> = {
  "LeBron James": 2544, "Stephen Curry": 201939, "Kevin Durant": 201142,
  "Giannis Antetokounmpo": 203507, "Nikola Jokic": 203999, "Luka Doncic": 1629029,
  "Joel Embiid": 203954, "Jayson Tatum": 1628369, "Devin Booker": 1626164,
  "Anthony Edwards": 1630162, "Shai Gilgeous-Alexander": 1628983, "Damian Lillard": 203081,
  "Donovan Mitchell": 1628378, "Kawhi Leonard": 202695, "Tyrese Haliburton": 1630169,
  "Bam Adebayo": 1628389, "Karl-Anthony Towns": 1626157, "Trae Young": 1629027,
  "Zion Williamson": 1629627, "Ja Morant": 1629630,
};

function PlayerCard({ player, players, onRemove, single }: { player: Player; players: Player[]; onRemove: () => void; single?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const injury = INJURY_DATA[player.name] || { injury: "None", status: "Healthy" };
  const playerId = NBA_PLAYER_IDS[player.name];
  const teamId = NBA_TEAM_IDS[player.team];
  const photoUrl = playerId ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png` : null;

  const isLeader = (key: string) => {
    if (players.length <= 1) return true;
    const max = Math.max(...players.map(p => (p as any)[key]));
    return (player as any)[key] === max;
  };

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden relative flex flex-col ${single ? "max-w-sm w-full" : "w-full"}`}>

      {/* X Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 left-2 z-10 w-6 h-6 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center text-xs text-gray-400 hover:text-white transition-colors"
      >
        ✕
      </button>

      {/* Photo Header */}
      <div className={`relative bg-gray-800 ${single ? "h-40" : "h-28"}`}>
        {photoUrl && !imgError ? (
          <img
            src={photoUrl}
            alt={player.name}
            onError={() => setImgError(true)}
            className={`absolute bottom-0 left-4 object-contain ${single ? "h-40" : "h-28"}`}
          />
        ) : (
          <div className={`absolute bottom-0 left-4 flex items-end ${single ? "h-40 w-24" : "h-28 w-16"}`}>
            <svg viewBox="0 0 100 140" className="h-full text-gray-600 fill-current">
              <circle cx="50" cy="35" r="22" />
              <ellipse cx="50" cy="110" rx="38" ry="30" />
            </svg>
          </div>
        )}
        {teamId && (
          <img
            src={`https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`}
            alt={player.team}
            className={`absolute top-2 right-2 object-contain ${single ? "w-12 h-12" : "w-8 h-8"}`}
          />
        )}
      </div>

      <div className="p-3 flex-1">
        {/* Name + Status */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className={`font-extrabold leading-tight ${single ? "text-xl" : "text-sm"}`}>{player.name}</h3>
            <p className="text-gray-500 text-xs">{player.team} · {player.pos}</p>
          </div>
          <span className={`text-xs px-1.5 py-0.5 rounded-full text-white font-semibold ${STATUS_COLORS[injury.status]}`} style={{ fontSize: "9px" }}>
            {injury.status}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1">
          {STAT_KEYS.map(key => {
            const leader = isLeader(key);
            return (
              <div
                key={key}
                className="rounded-lg p-1.5 text-center"
                style={{ backgroundColor: leader ? "rgba(249,115,22,0.15)" : "rgba(31,41,55,1)" }}
              >
                <p className="text-gray-500 uppercase" style={{ fontSize: "9px" }}>{STAT_LABELS[key]}</p>
                <p className="font-bold text-xs" style={{ color: leader ? "#f97316" : "#6b7280" }}>
                  {(player as any)[key]}
                </p>
              </div>
            );
          })}
        </div>
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
  const [players, setPlayers] = useState<Player[]>([]);

  const filtered = NBA_PLAYERS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    !players.find(s => s.id === p.id)
  );

  const addPlayer = (player: Player) => {
    if (players.length < 4) {
      setPlayers([...players, player]);
      setSearch("");
    }
  };

  const removePlayer = (id: number) => setPlayers(players.filter(p => p.id !== id));

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
          <PlayerCard player={players[0]} players={players} onRemove={() => removePlayer(players[0].id)} single />
        </div>
      );
    }

    if (players.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {players.map(p => (
            <PlayerCard key={p.id} player={p} players={players} onRemove={() => removePlayer(p.id)} />
          ))}
        </div>
      );
    }

    if (players.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {players.map(p => (
            <PlayerCard key={p.id} player={p} players={players} onRemove={() => removePlayer(p.id)} />
          ))}
          <AddMoreSlot />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {players.map(p => (
          <PlayerCard key={p.id} player={p} players={players} onRemove={() => removePlayer(p.id)} />
        ))}
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
                {filtered.length === 0 && (
                  <div className="px-4 py-3 text-gray-500 text-sm">No players found</div>
                )}
                {filtered.map(player => (
                  <button
                    key={player.id}
                    onClick={() => addPlayer(player)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-800 flex justify-between items-center border-b border-gray-800 last:border-0"
                  >
                    <span className="font-semibold text-sm">{player.name}</span>
                    <span className="text-orange-500 text-xs">{player.team}</span>
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