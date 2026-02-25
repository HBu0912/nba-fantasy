"use client";
import { useState } from "react";
import { useScoring } from "../ScoringContext";

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
  "LeBron James": 2544,
  "Stephen Curry": 201939,
  "Kevin Durant": 201142,
  "Giannis Antetokounmpo": 203507,
  "Nikola Jokic": 203999,
  "Luka Doncic": 1629029,
  "Joel Embiid": 203954,
  "Jayson Tatum": 1628369,
  "Devin Booker": 1626164,
  "Anthony Edwards": 1630162,
  "Shai Gilgeous-Alexander": 1628983,
  "Damian Lillard": 203081,
  "Donovan Mitchell": 1628378,
  "Kawhi Leonard": 202695,
  "Tyrese Haliburton": 1630169,
  "Bam Adebayo": 1628389,
  "Karl-Anthony Towns": 1626157,
  "Trae Young": 1629027,
  "Zion Williamson": 1629627,
  "Ja Morant": 1629630,
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
  ftm: number;
  fta: number;
};

function calcFantasy(player: Player, scoring: Record<string, number>) {
  return Object.keys(scoring).reduce((total, key) => {
    return total + ((player as any)[key] ?? 0) * scoring[key];
  }, 0);
}

export default function PlayerHoverCard({ player }: { player: Player }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { scoring } = useScoring();

  const injury = INJURY_DATA[player.name] || { injury: "None", status: "Healthy" };
  const fantasyScore = calcFantasy(player, scoring).toFixed(1);
  const playerId = NBA_PLAYER_IDS[player.name];
  const teamId = NBA_TEAM_IDS[player.team];
  const photoUrl = playerId
    ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`
    : null;

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="font-semibold text-white hover:text-orange-400 transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
      >
        {player.name}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

            <div className="relative bg-gray-800 h-28 flex items-end">
              {photoUrl && !imgError ? (
                <img
                  src={photoUrl}
                  alt={player.name}
                  onError={() => setImgError(true)}
                  className="absolute bottom-0 left-4 h-28 object-contain"
                />
              ) : (
                <div className="absolute bottom-0 left-4 h-28 w-20 flex items-end justify-center">
                  <svg viewBox="0 0 100 140" className="h-24 text-gray-600 fill-current">
                    <circle cx="50" cy="35" r="22" />
                    <ellipse cx="50" cy="110" rx="38" ry="30" />
                  </svg>
                </div>
              )}
              {teamId && (
                <img
                  src={`https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`}
                  alt={player.team}
                  className="absolute top-3 right-3 w-10 h-10 object-contain"
                />
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-extrabold text-lg leading-tight">{player.name}</h3>
                  <p className="text-gray-400 text-xs">{player.team} · {player.pos}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full text-white font-semibold ${STATUS_COLORS[injury.status]}`}>
                  {injury.status}
                </span>
              </div>

              {injury.status !== "Healthy" && (
                <p className="text-xs text-gray-500 mb-3">🩹 {injury.injury}</p>
              )}

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "PTS", val: player.pts },
                  { label: "REB", val: player.reb },
                  { label: "AST", val: player.ast },
                  { label: "STL", val: player.stl },
                  { label: "BLK", val: player.blk },
                  { label: "TOV", val: player.tov },
                ].map(s => (
                  <div key={s.label} className="bg-gray-800 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="font-bold text-white">{s.val}</p>
                  </div>
                ))}
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center mb-3">
                <p className="text-xs text-orange-400">⭐ Fantasy Score</p>
                <p className="text-xl font-extrabold text-orange-400">{fantasyScore}</p>
              </div>

              
                <a
                href={`/players?compare=${encodeURIComponent(player.name)}`}
                className="block w-full text-center text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition-colors"
                onClick={() => setOpen(false)}
              >
                Add to Comparison
              </a>
            </div>
          </div>
        </>
      )}
    </span>
  );
}