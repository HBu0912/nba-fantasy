import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type GameEntry = {
  game: number; label: string; date: string; opp: string; wl: string; score: string;
  pts: number; reb: number; ast: number; stl: number; blk: number;
  tov: number; fgm: number; fga: number; tpm: number; tpa: number;
  ftm: number; fta: number; min: number; oreb: number; dreb: number;
};

const ESPN_TEAM_IDS: Record<string, number> = {
  ATL:1, BOS:2, BKN:17, CHA:30, CHI:4,  CLE:5,  DAL:6,  DEN:7,  DET:8,  GSW:9,
  HOU:10,IND:11,LAC:12, LAL:13, MEM:29, MIA:14, MIL:15, MIN:16, NOP:3,  NYK:18,
  OKC:25,ORL:19,PHI:20, PHX:21, POR:22, SAC:23, SAS:24, TOR:28, UTA:26, WAS:27,
};
const ESPN_TO_STD: Record<string, string> = { GS:"GSW", NY:"NYK", NO:"NOP", SA:"SAS", GOS:"GSW" };
const normalize = (a: string) => ESPN_TO_STD[a] ?? a;

function parseMin(raw: string | number | null | undefined): number {
  if (!raw) return 0;
  if (typeof raw === "number") return Math.round(raw);
  return parseInt(String(raw).split(":")[0]) || 0;
}

function fmtDate(raw: string): { label: string; date: string } {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { label: raw, date: raw };
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[d.getUTCMonth()];
  const day   = d.getUTCDate();
  const year  = d.getUTCFullYear();
  return { label: `${month} ${day}`, date: `${month} ${day}, ${year}` };
}

async function fromESPN(playerName: string, teamAbbr: string, multi: boolean): Promise<GameEntry[] | null> {
  const espnTeamId = ESPN_TEAM_IDS[teamAbbr];
  if (!espnTeamId) return null;

  // 1. Get ESPN athlete ID from roster
  const rosterRes = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnTeamId}/roster`,
    { next: { revalidate: 86400 } }
  );
  if (!rosterRes.ok) return null;
  const roster = await rosterRes.json();

  const nameLower = playerName.toLowerCase();
  const lastNameLower = nameLower.split(" ").pop() ?? nameLower;
  const athletes: any[] = roster.athletes ?? [];
  const athlete =
    athletes.find((a: any) => (a.displayName ?? "").toLowerCase() === nameLower) ??
    athletes.find((a: any) => (a.displayName ?? "").toLowerCase().endsWith(lastNameLower));
  if (!athlete) return null;
  const espnAthleteId = String(athlete.id);

  // 2. Fetch team schedule(s)
  const seasons = multi ? [2025, 2026] : [2026];
  const schedDatas = await Promise.all(
    seasons.map(s =>
      fetch(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnTeamId}/schedule?season=${s}`,
        { next: { revalidate: 1800 } }
      ).then(r => r.ok ? r.json() : { events: [] }).catch(() => ({ events: [] }))
    )
  );

  // 3. Collect completed events
  type Ev = { id: string; date: string; myScore: number; oppScore: number; oppAbbr: string };
  const evs: Ev[] = [];
  for (const sched of schedDatas) {
    for (const ev of sched.events ?? []) {
      const comp = ev.competitions?.[0];
      const st = comp?.status?.type?.name ?? "";
      if (!st.startsWith("STATUS_FINAL")) continue;
      const comps: any[] = comp?.competitors ?? [];
      const mine = comps.find((c: any) => normalize(c.team?.abbreviation ?? "") === teamAbbr);
      const opp  = comps.find((c: any) => normalize(c.team?.abbreviation ?? "") !== teamAbbr);
      if (!mine || !opp) continue;
      evs.push({
        id: ev.id,
        date: ev.date ?? "",
        myScore:  Number(mine.score?.value ?? 0),
        oppScore: Number(opp.score?.value  ?? 0),
        oppAbbr:  normalize(opp.team?.abbreviation ?? ""),
      });
    }
  }
  if (!evs.length) return null;
  evs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const toFetch = multi ? evs.slice(-60) : evs.slice(-20);

  // 4. Fetch game summaries in parallel
  const summaries = await Promise.all(
    toFetch.map(ev =>
      fetch(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${ev.id}`,
        { next: { revalidate: 86400 } }
      )
        .then(r => r.ok ? r.json().then((d: any) => ({ ev, d })) : null)
        .catch(() => null)
    )
  );

  // 5. Extract player stats from each box score
  const games: GameEntry[] = [];
  for (const item of summaries) {
    if (!item) continue;
    const { ev, d } = item;

    let stats: string[] | null = null;
    let names: string[] | null = null;
    for (const teamData of d.boxscore?.players ?? []) {
      for (const grp of teamData.statistics ?? []) {
        const entry = (grp.athletes ?? []).find(
          (a: any) => String(a.athlete?.id) === espnAthleteId
        );
        if (entry) { stats = entry.stats; names = grp.names ?? grp.labels; break; }
      }
      if (stats) break;
    }
    if (!stats || !names) continue;

    const s   = (n: string) => { const i = names!.indexOf(n); return i >= 0 ? (stats![i] ?? "0") : "0"; };
    const num = (v: string) => parseInt(v) || 0;
    const frc = (v: string): [number, number] => { const p = v.split("-"); return [parseInt(p[0])||0, parseInt(p[1])||0]; };

    const [fgm, fga] = frc(s("FG"));
    const [tpm, tpa] = frc(s("3PT"));
    const [ftm, fta] = frc(s("FT"));
    const wl    = ev.myScore > ev.oppScore ? "W" : "L";
    const score = ev.myScore > 0 && ev.oppScore > 0 ? `${ev.myScore}-${ev.oppScore}` : "";
    const { label, date } = fmtDate(ev.date);

    games.push({
      game: games.length + 1, label, date,
      opp: ev.oppAbbr, wl, score,
      pts: num(s("PTS")), reb: num(s("REB")), ast: num(s("AST")),
      stl: num(s("STL")), blk: num(s("BLK")), tov: num(s("TO")),
      fgm, fga, tpm, tpa, ftm, fta,
      min: parseMin(s("MIN")), oreb: num(s("OREB")), dreb: num(s("DREB")),
    });
  }

  return games.length > 0 ? games : null;
}

export async function GET(request: NextRequest) {
  const playerName = request.nextUrl.searchParams.get("playerName") ?? "";
  const teamAbbr   = (request.nextUrl.searchParams.get("teamAbbr") ?? "").toUpperCase();
  const multi      = request.nextUrl.searchParams.get("multi") === "true";

  if (!playerName || !teamAbbr) {
    return NextResponse.json({ error: "playerName and teamAbbr required" }, { status: 400 });
  }

  const games = await fromESPN(playerName, teamAbbr, multi);
  if (games?.length) return NextResponse.json({ source: "espn", games });
  return NextResponse.json({ error: "no_data" }, { status: 502 });
}
