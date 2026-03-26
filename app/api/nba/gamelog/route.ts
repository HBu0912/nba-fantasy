import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Normalised shape returned to the client regardless of source
type GameEntry = {
  game:  number;
  label: string;   // short date for x-axis: "Mar 15"
  date:  string;   // full date for tooltip: "Mar 15, 2026"
  opp:   string;
  wl:    string;   // "W" | "L" | ""
  score: string;   // "115-108" | ""
  pts: number; reb: number; ast: number; stl: number; blk: number;
  tov: number; fgm: number; fga: number; tpm: number; tpa: number;
  ftm: number; fta: number; min: number; oreb: number; dreb: number;
};

// ── Shared helpers ─────────────────────────────────────────────────────────────
function parseMin(raw: string | number | null | undefined): number {
  if (!raw) return 0;
  if (typeof raw === "number") return Math.round(raw);
  return parseInt(String(raw).split(":")[0]) || 0;
}

function fmtDate(raw: string): { label: string; date: string } {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { label: raw, date: raw };
  const month = d.toLocaleString("en-US", { month: "short" });
  const day   = d.getDate();
  const year  = d.getFullYear();
  return {
    label: `${month} ${day}`,
    date:  `${month} ${day}, ${year}`,
  };
}

// Balldontlie team IDs → abbreviations (stable across seasons)
const BDL_TEAMS: Record<number, string> = {
  1:"ATL", 2:"BOS", 3:"BKN", 4:"CHA", 5:"CHI",
  6:"CLE", 7:"DAL", 8:"DEN", 9:"DET", 10:"GSW",
  11:"HOU", 12:"IND", 13:"LAC", 14:"LAL", 15:"MEM",
  16:"MIA", 17:"MIL", 18:"MIN", 19:"NOP", 20:"NYK",
  21:"OKC", 22:"ORL", 23:"PHI", 24:"PHX", 25:"POR",
  26:"SAC", 27:"SAS", 28:"TOR", 29:"UTA", 30:"WAS",
};

// ── Source 1: balldontlie.io ───────────────────────────────────────────────────
async function fromBalldontlie(
  playerName: string,
  multi: boolean,
  bdlId?: string,
): Promise<GameEntry[] | null> {
  const key = process.env.BALLDONTLIE_API_KEY;
  if (!key) return null;

  try {
    let resolvedId: string | number;

    if (bdlId) {
      resolvedId = bdlId;
    } else {
      const searchRes = await fetch(
        `https://api.balldontlie.io/v1/players?search=${encodeURIComponent(playerName)}&per_page=5`,
        { headers: { Authorization: key }, next: { revalidate: 86400 } }
      );
      if (!searchRes.ok) return null;
      const { data: players } = await searchRes.json();
      const player = players?.[0];
      if (!player) return null;
      resolvedId = player.id;
    }

    // Include season=2026 in case balldontlie uses end-year naming for 2025-26
    const seasonParams = multi
      ? "seasons[]=2026&seasons[]=2025&seasons[]=2024&seasons[]=2023&seasons[]=2022"
      : "seasons[]=2026&seasons[]=2025&seasons[]=2024";
    const statsRes = await fetch(
      `https://api.balldontlie.io/v1/stats?player_ids[]=${resolvedId}&${seasonParams}&per_page=100`,
      { headers: { Authorization: key }, next: { revalidate: multi ? 3600 : 1800 } }
    );
    if (!statsRes.ok) return null;
    const { data: stats } = await statsRes.json();
    if (!stats?.length) return null;

    const played = stats
      .filter((g: any) => parseMin(g.min) > 0)
      .sort((a: any, b: any) =>
        new Date(a.game?.date ?? 0).getTime() - new Date(b.game?.date ?? 0).getTime()
      );

    // Fetch final game scores using the player's team season games
    // (the /v1/stats endpoint omits scores; /v1/games with team_ids[] includes them)
    const gameScoreMap = new Map<number, { home: number; visitor: number }>();
    // Use the most-recent game's team ID so trades don't cause misses on current games
    const latestTeamId = played[played.length - 1]?.team?.id ?? played[0]?.team?.id;
    if (latestTeamId) {
      try {
        // Non-multi: only current season (≤82 games, fits in per_page=100, no pagination needed)
        // Multi: fetch each season independently in parallel to avoid overflow
        if (!multi) {
          const teamGamesRes = await fetch(
            `https://api.balldontlie.io/v1/games?team_ids[]=${latestTeamId}&seasons[]=2026&per_page=100`,
            { headers: { Authorization: key }, next: { revalidate: 1800 } }
          );
          if (teamGamesRes.ok) {
            const { data: teamGames } = await teamGamesRes.json();
            for (const gm of teamGames ?? []) {
              const hs = gm.home_team_score ?? 0;
              const vs = gm.visitor_team_score ?? 0;
              if (hs > 0 || vs > 0) gameScoreMap.set(gm.id, { home: hs, visitor: vs });
            }
          }
        } else {
          // Multi-season: fetch each season in parallel so 82-game limit per call is safe
          await Promise.all(["2026","2025","2024"].map(async (s) => {
            const r = await fetch(
              `https://api.balldontlie.io/v1/games?team_ids[]=${latestTeamId}&seasons[]=${s}&per_page=100`,
              { headers: { Authorization: key }, next: { revalidate: 3600 } }
            );
            if (!r.ok) return;
            const { data: gms } = await r.json();
            for (const gm of gms ?? []) {
              const hs = gm.home_team_score ?? 0;
              const vs = gm.visitor_team_score ?? 0;
              if (hs > 0 || vs > 0) gameScoreMap.set(gm.id, { home: hs, visitor: vs });
            }
          }));
        }
      } catch { /* scores optional */ }
    }

    return played.map((g: any, i: number) => {
      const playerTeamId = g.team?.id;
      const homeId       = g.game?.home_team_id;
      const visitorId    = g.game?.visitor_team_id;
      const oppId        = playerTeamId === homeId ? visitorId : homeId;

      const fetched      = gameScoreMap.get(g.game?.id);
      const homeScore    = fetched?.home    ?? g.game?.home_team_score    ?? 0;
      const visitorScore = fetched?.visitor ?? g.game?.visitor_team_score ?? 0;
      const playerIsHome = playerTeamId === homeId;
      const myScore      = playerIsHome ? homeScore : visitorScore;
      const oppScore     = playerIsHome ? visitorScore : homeScore;
      const wl           = (myScore > 0 && oppScore > 0) ? (myScore > oppScore ? "W" : "L") : "";
      const score        = (myScore > 0 && oppScore > 0 && myScore !== oppScore) ? `${myScore}-${oppScore}` : "";

      const { label, date } = fmtDate(g.game?.date ?? "");
      return {
        game:  i + 1,
        label,
        date,
        opp:   BDL_TEAMS[oppId] ?? "UNK",
        wl,
        score,
        pts:   g.pts      ?? 0,
        reb:   g.reb      ?? 0,
        ast:   g.ast      ?? 0,
        stl:   g.stl      ?? 0,
        blk:   g.blk      ?? 0,
        tov:   g.turnover ?? 0,
        fgm:   g.fgm      ?? 0,
        fga:   g.fga      ?? 0,
        tpm:   g.fg3m     ?? 0,
        tpa:   g.fg3a     ?? 0,
        ftm:   g.ftm      ?? 0,
        fta:   g.fta      ?? 0,
        min:   parseMin(g.min),
        oreb:  g.oreb     ?? 0,
        dreb:  g.dreb     ?? 0,
      };
    });
  } catch (err) {
    console.error("[gamelog] balldontlie error:", err);
    return null;
  }
}

// ── Source 2: stats.nba.com ────────────────────────────────────────────────────

// Team abbreviation → NBA.com team ID
const NBA_TEAM_IDS: Record<string, number> = {
  ATL: 1610612737, BOS: 1610612738, BKN: 1610612751, CHA: 1610612766, CHI: 1610612741,
  CLE: 1610612739, DAL: 1610612742, DEN: 1610612743, DET: 1610612765, GSW: 1610612744,
  HOU: 1610612745, IND: 1610612754, LAC: 1610612746, LAL: 1610612747, MEM: 1610612763,
  MIA: 1610612748, MIL: 1610612749, MIN: 1610612750, NOP: 1610612740, NYK: 1610612752,
  OKC: 1610612760, ORL: 1610612753, PHI: 1610612755, PHX: 1610612756, POR: 1610612757,
  SAC: 1610612758, SAS: 1610612759, TOR: 1610612761, UTA: 1610612762, WAS: 1610612764,
};

const NBA_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Connection: "keep-alive",
  Host: "stats.nba.com",
  Origin: "https://www.nba.com",
  Referer: "https://www.nba.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
};

// Fetches gameId → {my, opp} score map for a team using the team game log.
// team_pts - plus_minus = opp_pts (plus_minus = final margin)
async function fetchTeamScores(
  teamAbbr: string,
  season: string,
): Promise<Map<string, { my: number; opp: number }>> {
  const teamId = NBA_TEAM_IDS[teamAbbr];
  if (!teamId) return new Map();
  const url =
    `https://stats.nba.com/stats/teamgamelog` +
    `?TeamID=${teamId}&Season=${season}&SeasonType=Regular+Season`;
  try {
    const res = await fetch(url, { headers: NBA_HEADERS, next: { revalidate: 1800 } });
    if (!res.ok) return new Map();
    const raw = await res.json();
    const rs  = raw?.resultSets?.[0];
    if (!rs) return new Map();
    const h    = rs.headers as string[];
    const rows = rs.rowSet as any[][];
    // Case-insensitive column lookup — NBA API has inconsistent casing (Game_ID, PLUS_MINUS, etc.)
    const col  = (n: string) => {
      const i = h.indexOf(n);
      return i >= 0 ? i : h.findIndex((x: string) => x.toUpperCase() === n.toUpperCase());
    };
    const map  = new Map<string, { my: number; opp: number }>();
    for (const row of rows) {
      const gameId    = String(row[col("Game_ID")] ?? "");
      const myPts     = Number(row[col("PTS")]        ?? 0);
      const plusMinus = Number(row[col("PLUS_MINUS")] ?? 0);
      const opp       = myPts - plusMinus;
      // Only store if we have valid, non-tied scores (ties impossible in NBA = PLUS_MINUS was missing)
      if (gameId && myPts > 0 && opp > 0 && myPts !== opp) {
        map.set(gameId, { my: myPts, opp });
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

async function fetchNBAStatsSeason(
  playerId: string,
  season: string,
  lastN: number,
): Promise<GameEntry[]> {
  const lastNParam = lastN > 0 ? `&LastNGames=${lastN}` : "";
  const url =
    `https://stats.nba.com/stats/playergamelog` +
    `?PlayerID=${playerId}&Season=${season}&SeasonType=Regular+Season${lastNParam}`;

  try {
    const res = await fetch(url, { headers: NBA_HEADERS, next: { revalidate: 1800 } });
    if (!res.ok) return [];

    const raw  = await res.json();
    const rs   = raw?.resultSets?.[0];
    if (!rs) return [];
    const h: string[]   = rs.headers;
    const rows: any[][] = rs.rowSet;
    if (!rows?.length) return [];

    // Case-insensitive column lookup
    const col = (name: string) => {
      const i = h.indexOf(name);
      return i >= 0 ? i : h.findIndex((x: string) => x.toUpperCase() === name.toUpperCase());
    };
    const parseTeam = (matchup: string) => matchup.split(" ")[0]; // "LAC vs. MIL" → "LAC"
    const parseOpp  = (matchup: string) => {
      const m = matchup.match(/(?:vs\.|@)\s+(\w+)$/);
      return m?.[1] ?? matchup;
    };

    // Fetch team-level game scores via team gamelog (PLUS_MINUS there = point differential)
    const teamAbbr = parseTeam(rows[0][col("MATCHUP")] ?? "");
    const scoreMap = await fetchTeamScores(teamAbbr, season);

    return rows
      .map((row, i) => {
        const gameId     = String(row[col("Game_ID")] ?? "");
        const scoreEntry = scoreMap.get(gameId);
        const wl         = String(row[col("WL")] ?? "");
        const score      = scoreEntry ? `${scoreEntry.my}-${scoreEntry.opp}` : "";
        const { label, date } = fmtDate(row[col("GAME_DATE")]);
        return {
          game:  i + 1,
          label,
          date,
          opp:   parseOpp(row[col("MATCHUP")] ?? ""),
          wl,
          score,
          pts:   row[col("PTS")]  ?? 0,
          reb:   row[col("REB")]  ?? 0,
          ast:   row[col("AST")]  ?? 0,
          stl:   row[col("STL")]  ?? 0,
          blk:   row[col("BLK")]  ?? 0,
          tov:   row[col("TOV")]  ?? 0,
          fgm:   row[col("FGM")]  ?? 0,
          fga:   row[col("FGA")]  ?? 0,
          tpm:   row[col("FG3M")] ?? 0,
          tpa:   row[col("FG3A")] ?? 0,
          ftm:   row[col("FTM")]  ?? 0,
          fta:   row[col("FTA")]  ?? 0,
          min:   parseMin(row[col("MIN")] ?? 0),
          oreb:  row[col("OREB")] ?? 0,
          dreb:  row[col("DREB")] ?? 0,
        };
      })
      .reverse();
  } catch {
    return [];
  }
}

async function fromNBAStats(playerId: string, multi: boolean): Promise<GameEntry[] | null> {
  if (!multi) {
    const games = await fetchNBAStatsSeason(playerId, "2025-26", 20);
    if (games.length > 0) return games;
    const prev = await fetchNBAStatsSeason(playerId, "2024-25", 20);
    return prev.length > 0 ? prev : null;
  }

  const [s1, s2, s3] = await Promise.all([
    fetchNBAStatsSeason(playerId, "2023-24", 0),
    fetchNBAStatsSeason(playerId, "2024-25", 0),
    fetchNBAStatsSeason(playerId, "2025-26", 0),
  ]);

  const all = [...s1, ...s2, ...s3].map((g, i) => ({ ...g, game: i + 1 }));
  return all.length > 0 ? all : null;
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const playerId   = request.nextUrl.searchParams.get("playerId")   ?? "";
  const playerName = request.nextUrl.searchParams.get("playerName") ?? "";
  const bdlId      = request.nextUrl.searchParams.get("bdlId")      ?? "";
  const multi      = request.nextUrl.searchParams.get("multi") === "true";

  if (!playerId && !playerName && !bdlId) {
    return NextResponse.json({ error: "playerId, bdlId, or playerName required" }, { status: 400 });
  }

  // 1️⃣ balldontlie — use bdlId directly if available, else search by name
  if (bdlId || playerName) {
    const games = await fromBalldontlie(playerName, multi, bdlId || undefined);
    if (games?.length) return NextResponse.json({ source: "balldontlie", games });
  }

  // 2️⃣ stats.nba.com (no key, may be blocked on cloud hosts)
  if (playerId) {
    const games = await fromNBAStats(playerId, multi);
    if (games?.length) return NextResponse.json({ source: "nba", games });
  }

  return NextResponse.json({ error: "no_data" }, { status: 502 });
}
