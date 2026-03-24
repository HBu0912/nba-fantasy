import { NextRequest, NextResponse } from "next/server";

const TEAM_NAMES: Record<number, string> = {
  1: "Atlanta Hawks",
  2: "Boston Celtics",
  3: "New Orleans Pelicans",
  4: "Chicago Bulls",
  5: "Cleveland Cavaliers",
  6: "Dallas Mavericks",
  7: "Denver Nuggets",
  8: "Golden State Warriors",
  9: "Houston Rockets",
  10: "Indiana Pacers",
  11: "Los Angeles Clippers",
  12: "Los Angeles Lakers",
  13: "Miami Heat",
  14: "Milwaukee Bucks",
  15: "Minnesota Timberwolves",
  16: "Brooklyn Nets",
  17: "New York Knicks",
  18: "Orlando Magic",
  19: "Philadelphia 76ers",
  20: "Phoenix Suns",
  21: "Portland Trail Blazers",
  22: "Sacramento Kings",
  23: "San Antonio Spurs",
  24: "Oklahoma City Thunder",
  25: "Memphis Grizzlies",
  26: "Utah Jazz",
  27: "Washington Wizards",
  28: "Toronto Raptors",
  29: "Detroit Pistons",
  30: "Charlotte Hornets",
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

export type GameEntry = {
  id: number;
  date: string;
  status: string;
  homeTeam: { abbr: string; name: string; score: number | null; nbaId: number | null };
  awayTeam: { abbr: string; name: string; score: number | null; nbaId: number | null };
  time: string;
};

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const key = process.env.BALLDONTLIE_API_KEY;

  if (!key || !date) return NextResponse.json({ games: [] });

  try {
    const res = await fetch(
      `https://api.balldontlie.io/v1/games?dates[]=${date}&per_page=15`,
      { headers: { Authorization: key }, next: { revalidate: 300 } }
    );
    if (!res.ok) return NextResponse.json({ games: [] });

    const { data } = await res.json();

    const games: GameEntry[] = (data ?? []).map((g: any) => {
      const homeAbbr: string = g.home_team?.abbreviation ?? "";
      const visitorAbbr: string = g.visitor_team?.abbreviation ?? "";
      const homeNbaId = NBA_TEAM_IDS[homeAbbr] ?? null;
      const visitorNbaId = NBA_TEAM_IDS[visitorAbbr] ?? null;

      const rawStatus: string = g.status ?? "";
      let status = "Scheduled";
      let time = "";

      if (/^\d/.test(rawStatus)) {
        // Looks like a time string, e.g. "7:30 pm ET"
        status = "Scheduled";
        time = rawStatus;
      } else if (rawStatus === "Final" || rawStatus === "Final/OT") {
        status = rawStatus;
      } else {
        status = rawStatus;
      }

      const homeScore =
        g.home_team_score != null && g.home_team_score !== 0
          ? g.home_team_score
          : null;
      const visitorScore =
        g.visitor_team_score != null && g.visitor_team_score !== 0
          ? g.visitor_team_score
          : null;

      return {
        id: g.id,
        date: g.date?.slice(0, 10) ?? date,
        status,
        time,
        homeTeam: {
          abbr: homeAbbr,
          name: g.home_team?.full_name ?? TEAM_NAMES[g.home_team?.id] ?? homeAbbr,
          score: homeScore,
          nbaId: homeNbaId,
        },
        awayTeam: {
          abbr: visitorAbbr,
          name: g.visitor_team?.full_name ?? TEAM_NAMES[g.visitor_team?.id] ?? visitorAbbr,
          score: visitorScore,
          nbaId: visitorNbaId,
        },
      };
    });

    return NextResponse.json({ games });
  } catch {
    return NextResponse.json({ games: [] });
  }
}
