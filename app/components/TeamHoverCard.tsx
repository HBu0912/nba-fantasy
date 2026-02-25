"use client";
import { useState } from "react";

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

type TeamData = {
  abbr: string;
  name: string;
  wins: number;
  losses: number;
  seed: number;
  last10: string;
  homeRecord: string;
  awayRecord: string;
  nextGame: string;
  leaders: {
    pts: { name: string; val: number };
    reb: { name: string; val: number };
    ast: { name: string; val: number };
  };
  roster: string[];
};

export default function TeamHoverCard({ team }: { team: TeamData }) {
  const [open, setOpen] = useState(false);
  const teamId = NBA_TEAM_IDS[team.abbr];

  const last10Wins = parseInt(team.last10.split("-")[0]);
  const last10Color = last10Wins >= 7 ? "text-green-400" : last10Wins >= 5 ? "text-yellow-400" : "text-red-400";

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="font-bold text-white hover:text-orange-400 transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
      >
        {team.name}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Card */}
          <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gray-800 px-5 py-4 flex items-center gap-4">
              {teamId && (
                <img
                  src={`https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`}
                  alt={team.name}
                  className="w-14 h-14 object-contain"
                />
              )}
              <div>
                <h3 className="font-extrabold text-lg">{team.name}</h3>
                <p className="text-gray-400 text-sm">#{team.seed} seed · {team.wins}–{team.losses}</p>
              </div>
            </div>

            <div className="p-4">

              {/* Record Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Last 10</p>
                  <p className={`font-bold ${last10Color}`}>{team.last10}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Home</p>
                  <p className="font-bold text-white">{team.homeRecord}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Away</p>
                  <p className="font-bold text-white">{team.awayRecord}</p>
                </div>
              </div>

              {/* Next Game */}
              <div className="bg-gray-800 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">Next Game</p>
                <p className="text-xs text-white font-semibold">{team.nextGame}</p>
              </div>

              {/* Stat Leaders */}
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Team Leaders</p>
              <div className="space-y-2 mb-4">
                {[
                  { label: "PTS", leader: team.leaders.pts, color: "text-orange-400" },
                  { label: "REB", leader: team.leaders.reb, color: "text-blue-400" },
                  { label: "AST", leader: team.leaders.ast, color: "text-green-400" },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
                    <span className={`text-xs font-bold ${s.color}`}>{s.label}</span>
                    <span className="text-white text-sm font-semibold">{s.leader.name}</span>
                    <span className={`text-sm font-bold ${s.color}`}>{s.leader.val}</span>
                  </div>
                ))}
              </div>

              {/* Roster */}
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Roster</p>
              <div className="flex flex-wrap gap-1">
                {team.roster.map(name => (
                  <span key={name} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                    {name}
                  </span>
                ))}
              </div>

            </div>
          </div>
        </>
      )}
    </span>
  );
}