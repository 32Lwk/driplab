import { NextResponse } from "next/server";
import { recommend, normalizeCatalog } from "@driplab/recommender";
import type { RecommendRequest } from "@driplab/recommender";
import catalogData from "@/data/beans.json";

const beans = normalizeCatalog(
  (catalogData as { beans: Record<string, unknown>[] }).beans,
);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendRequest;

    if (!body.mood || !Array.isArray(body.equipment)) {
      return NextResponse.json(
        { error: "mood と equipment が必要です" },
        { status: 400 },
      );
    }

    const response = recommend(beans, body);
    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
