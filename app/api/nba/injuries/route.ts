import { NextResponse } from "next/server";

export type InjuryEntry = {
  playerId: string;
  name: string;
  team: string;
  status: string;
  type: string;
  details: string;
  date: string;
};

export async function GET() {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ injuries: [] });

    const raw = await res.json();
    const injuries: InjuryEntry[] = [];

    // ESPN structure: { injuries: [ { id, displayName, injuries: [...] } ] }
    const teamEntries: any[] = raw?.injuries ?? [];
    for (const teamEntry of teamEntries) {
      const teamName: string = teamEntry.displayName ?? "";
      const items: any[] = teamEntry.injuries ?? [];
      for (const item of items) {
        const athlete = item.athlete ?? {};
        const name: string =
          athlete.displayName ??
          `${athlete.firstName ?? ""} ${athlete.lastName ?? ""}`.trim();
        if (!name) continue;

        const status: string = item.status ?? "Questionable";
        const injType: string = item.shortComment ?? item.longComment ?? "Injury";
        const details: string = item.longComment ?? item.shortComment ?? "";
        const date: string = item.date ?? "";

        injuries.push({
          playerId: String(athlete.id ?? ""),
          name,
          team: teamName,
          status,
          type: injType,
          details,
          date,
        });
      }
    }

    return NextResponse.json({ injuries });
  } catch {
    return NextResponse.json({ injuries: [] });
  }
}
