import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NBA_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Connection: "keep-alive",
  Host: "stats.nba.com",
  Origin: "https://www.nba.com",
  Referer: "https://www.nba.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
};

const TEAM_ID_TO_ABBR: Record<number, string> = {
  1610612737: "ATL", 1610612738: "BOS", 1610612751: "BKN", 1610612766: "CHA", 1610612741: "CHI",
  1610612739: "CLE", 1610612742: "DAL", 1610612743: "DEN", 1610612765: "DET", 1610612744: "GSW",
  1610612745: "HOU", 1610612754: "IND", 1610612746: "LAC", 1610612747: "LAL", 1610612763: "MEM",
  1610612748: "MIA", 1610612749: "MIL", 1610612750: "MIN", 1610612740: "NOP", 1610612752: "NYK",
  1610612760: "OKC", 1610612753: "ORL", 1610612755: "PHI", 1610612756: "PHX", 1610612757: "POR",
  1610612758: "SAC", 1610612759: "SAS", 1610612761: "TOR", 1610612762: "UTA", 1610612764: "WAS",
};

export async function GET() {
  try {
    const url =
      "https://stats.nba.com/stats/leaguestandingsv3?LeagueID=00&Season=2025-26&SeasonType=Regular+Season";

    const res = await fetch(url, { headers: NBA_HEADERS });
    if (!res.ok) return NextResponse.json({ standings: [] });

    const json = await res.json();
    const resultSet = json.resultSets?.[0];
    if (!resultSet) return NextResponse.json({ standings: [] });

    const h: string[] = resultSet.headers;
    const rows: any[][] = resultSet.rowSet;

    const col = (n: string) => {
      const i = h.indexOf(n);
      return i >= 0 ? i : h.findIndex((x: string) => x.toUpperCase() === n.toUpperCase());
    };

    const standings = rows.map((row) => {
      const teamId = row[col("TeamID")] as number;
      return {
        teamId,
        abbr: TEAM_ID_TO_ABBR[teamId] ?? "",
        name: `${row[col("TeamCity")]} ${row[col("TeamName")]}`,
        conference: row[col("Conference")] as string,
        confRank: row[col("PlayoffRank")] as number,
        wins: row[col("WINS")] as number,
        losses: row[col("LOSSES")] as number,
        pct: parseFloat(((row[col("WinPCT")] ?? 0) as number).toFixed(3)),
        home: row[col("HOME")] as string,
        road: row[col("ROAD")] as string,
        last10: row[col("L10")] as string,
        streak: row[col("strCurrentStreak")] as string,
        ptsPG: parseFloat(((row[col("PointsPG")] ?? 0) as number).toFixed(1)),
        oppPtsPG: parseFloat(((row[col("OppPointsPG")] ?? 0) as number).toFixed(1)),
      };
    });

    standings.sort((a, b) => a.confRank - b.confRank);

    return NextResponse.json({ standings });
  } catch {
    return NextResponse.json({ standings: [] });
  }
}
