import { NextResponse } from "next/server";
import { recommend } from "@driplab/recommender";
import type { RecommendRequest } from "@driplab/recommender";
import { getAvailableBeans } from "@/lib/catalog";

const beans = getAvailableBeans();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendRequest;

    if (!body.mood) {
      return NextResponse.json(
        { error: "mood が必要です" },
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
