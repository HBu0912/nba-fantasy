import { NextRequest, NextResponse } from "next/server";

// balldontlie team ID → abbreviation
const BDL_TEAMS: Record<number, string> = {
  1:"ATL",2:"BOS",3:"BKN",4:"CHA",5:"CHI",6:"CLE",7:"DAL",8:"DEN",9:"DET",10:"GSW",
  11:"HOU",12:"IND",13:"LAC",14:"LAL",15:"MEM",16:"MIA",17:"MIL",18:"MIN",19:"NOP",20:"NYK",
  21:"OKC",22:"ORL",23:"PHI",24:"PHX",25:"POR",26:"SAC",27:"SAS",28:"TOR",29:"UTA",30:"WAS",
};

const ABBR_TO_BDL: Record<string, number> = Object.fromEntries(
  Object.entries(BDL_TEAMS).map(([id, abbr]) => [abbr, Number(id)])
);

const NBA_TEAM_IDS: Record<string, number> = {
  ATL:1610612737,BOS:1610612738,BKN:1610612751,CHA:1610612766,CHI:1610612741,
  CLE:1610612739,DAL:1610612742,DEN:1610612743,DET:1610612765,GSW:1610612744,
  HOU:1610612745,IND:1610612754,LAC:1610612746,LAL:1610612747,MEM:1610612763,
  MIA:1610612748,MIL:1610612749,MIN:1610612750,NOP:1610612740,NYK:1610612752,
  OKC:1610612760,ORL:1610612753,PHI:1610612755,PHX:1610612756,POR:1610612757,
  SAC:1610612758,SAS:1610612759,TOR:1610612761,UTA:1610612762,WAS:1610612764,
};

export type RecentGame = {
  date: string;
  wl: "W" | "L";
  oppAbbr: string;
  oppNbaId: number | null;
  myScore: number;
  oppScore: number;
};

export async function GET(req: NextRequest) {
  const abbr = (req.nextUrl.searchParams.get("abbr") ?? "").toUpperCase();
  const key = process.env.BALLDONTLIE_API_KEY;
  if (!abbr || !key) return NextResponse.json({ games: [] });

  const bdlId = ABBR_TO_BDL[abbr];
  if (!bdlId) return NextResponse.json({ games: [] });

  try {
    // Fetch recent games across current and previous season
    const res = await fetch(
      `https://api.balldontlie.io/v1/games?team_ids[]=${bdlId}&seasons[]=2026&seasons[]=2025&per_page=100`,
      { headers: { Authorization: key }, next: { revalidate: 900 } }
    );
    if (!res.ok) return NextResponse.json({ games: [] });

    const { data } = await res.json();
    if (!data?.length) return NextResponse.json({ games: [] });

    // Sort by date descending, keep completed games (have scores), take 5
    const played = (data as any[])
      .filter((g: any) =>
        (g.status === "Final" || g.status === "Final/OT") ||
        ((g.home_team_score ?? 0) > 0 && (g.visitor_team_score ?? 0) > 0)
      )
      .sort((a: any, b: any) =>
        new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
      )
      .slice(0, 5);

    const games: RecentGame[] = played.map((g: any) => {
      const isHome = g.home_team?.id === bdlId;
      const myScore = isHome ? (g.home_team_score ?? 0) : (g.visitor_team_score ?? 0);
      const oppScore = isHome ? (g.visitor_team_score ?? 0) : (g.home_team_score ?? 0);
      const oppTeam = isHome ? g.visitor_team : g.home_team;
      const oppAbbr: string = oppTeam?.abbreviation ?? "";
      return {
        date: (g.date ?? "").slice(0, 10),
        wl: myScore > oppScore ? "W" : "L",
        oppAbbr,
        oppNbaId: NBA_TEAM_IDS[oppAbbr] ?? null,
        myScore,
        oppScore,
      };
    });

    return NextResponse.json({ games });
  } catch {
    return NextResponse.json({ games: [] });
  }
}
