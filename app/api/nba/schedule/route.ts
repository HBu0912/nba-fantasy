import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const NBA_TEAM_IDS: Record<string, number> = {
  ATL:1610612737, BOS:1610612738, BKN:1610612751, CHA:1610612766, CHI:1610612741,
  CLE:1610612739, DAL:1610612742, DEN:1610612743, DET:1610612765, GSW:1610612744,
  HOU:1610612745, IND:1610612754, LAC:1610612746, LAL:1610612747, MEM:1610612763,
  MIA:1610612748, MIL:1610612749, MIN:1610612750, NOP:1610612740, NYK:1610612752,
  OKC:1610612760, ORL:1610612753, PHI:1610612755, PHX:1610612756, POR:1610612757,
  SAC:1610612758, SAS:1610612759, TOR:1610612761, UTA:1610612762, WAS:1610612764,
};
const ESPN_TO_STD: Record<string, string> = { GS:"GSW", NY:"NYK", NO:"NOP", SA:"SAS" };
const norm = (a: string) => ESPN_TO_STD[a] ?? a;

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!date) return NextResponse.json({ games: [] });

  // ESPN uses YYYYMMDD
  const espnDate = date.replace(/-/g, "");

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${espnDate}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return NextResponse.json({ games: [] });
    const json = await res.json();

    const games = (json.events ?? []).map((ev: any) => {
      const comp   = ev.competitions?.[0];
      const comps: any[] = comp?.competitors ?? [];
      const home   = comps.find((c: any) => c.homeAway === "home");
      const away   = comps.find((c: any) => c.homeAway === "away");

      const homeAbbr = norm(home?.team?.abbreviation ?? "");
      const awayAbbr = norm(away?.team?.abbreviation ?? "");

      const statusType = comp?.status?.type?.name ?? "";
      const isFinished = statusType.startsWith("STATUS_FINAL");
      const isLive     = statusType === "STATUS_IN_PROGRESS" || statusType === "STATUS_HALFTIME";

      let status = "Scheduled";
      if (isFinished) status = statusType === "STATUS_FINAL_OT" ? "Final/OT" : "Final";
      else if (isLive) {
        const clock  = comp?.status?.displayClock ?? "";
        const period = comp?.status?.period ?? "";
        status = period && clock ? `Q${period} ${clock}` : "Live";
      }

      const homeScore = (isFinished || isLive) ? (parseInt(home?.score ?? "") || null) : null;
      const awayScore = (isFinished || isLive) ? (parseInt(away?.score ?? "") || null) : null;

      const time = (!isFinished && !isLive) ? (ev.date ?? "") : "";

      return {
        id:     ev.id,   // ESPN event ID — used for box score popup
        date,
        status,
        time,
        homeTeam: {
          abbr:  homeAbbr,
          name:  home?.team?.displayName ?? homeAbbr,
          score: homeScore,
          nbaId: NBA_TEAM_IDS[homeAbbr] ?? null,
        },
        awayTeam: {
          abbr:  awayAbbr,
          name:  away?.team?.displayName ?? awayAbbr,
          score: awayScore,
          nbaId: NBA_TEAM_IDS[awayAbbr] ?? null,
        },
      };
    });

    return NextResponse.json({ games });
  } catch {
    return NextResponse.json({ games: [] });
  }
}
