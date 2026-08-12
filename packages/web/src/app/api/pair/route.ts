import { NextResponse } from "next/server";
import { pair } from "@driplab/recommender";
import type { PairingRequest } from "@driplab/recommender";
import { getAvailableBeans } from "@/lib/catalog";

const beans = getAvailableBeans();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PairingRequest;

    if (!body.food_preset_id && !body.food_text?.trim()) {
      return NextResponse.json(
        { error: "food_preset_id または food_text が必要です" },
        { status: 400 },
      );
    }

    const response = pair(beans, body);
    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
