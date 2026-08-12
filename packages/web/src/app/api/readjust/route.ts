import { NextResponse } from "next/server";
import { readjust } from "@driplab/recommender";
import type { ReadjustRequest } from "@driplab/recommender";
import { getAvailableBeans } from "@/lib/catalog";

const beans = getAvailableBeans();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReadjustRequest;

    if (!body.mode || !body.direction) {
      return NextResponse.json(
        { error: "mode と direction が必要です" },
        { status: 400 },
      );
    }

    const response = readjust(beans, body);
    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
