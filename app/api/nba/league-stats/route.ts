import { NextResponse } from "next/server";

export const revalidate = 3600;

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

export async function GET() {
  try {
    const url =
      "https://stats.nba.com/stats/leaguedashplayerstats?MeasureType=Base&PerMode=PerGame&PlusMinus=N&PaceAdjust=N&Rank=N&LeagueID=00&Season=2025-26&SeasonType=Regular+Season&Month=0&OpponentTeamID=0&DateFrom=&DateTo=&GameScope=&LastNGames=0&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PlayerExperience=&PlayerPosition=&StarterBench=&GameSegment=&Period=0";

    const res = await fetch(url, { headers: NBA_HEADERS });
    if (!res.ok) return NextResponse.json({ players: [] });

    const json = await res.json();
    const resultSet = json.resultSets?.[0];
    if (!resultSet) return NextResponse.json({ players: [] });

    const h: string[] = resultSet.headers;
    const rows: any[][] = resultSet.rowSet;

    const col = (n: string) => h.indexOf(n);

    const players = rows
      .filter((row) => (row[col("GP")] ?? 0) >= 10)
      .map((row) => {
        const f = (n: string) => parseFloat(((row[col(n)] ?? 0) as number).toFixed(1));
        return {
          id: row[col("PLAYER_ID")] as number,
          name: row[col("PLAYER_NAME")] as string,
          team: row[col("TEAM_ABBREVIATION")] as string,
          pos: (row[col("PLAYER_POSITION")] as string) ?? "",
          gp: row[col("GP")] as number,
          pts: f("PTS"),
          reb: f("REB"),
          ast: f("AST"),
          stl: f("STL"),
          blk: f("BLK"),
          tov: f("TOV"),
          fgm: f("FGM"),
          fga: f("FGA"),
          tpm: f("FG3M"),
          ftm: f("FTM"),
          fta: f("FTA"),
        };
      });

    return NextResponse.json({ players });
  } catch {
    return NextResponse.json({ players: [] });
  }
}
