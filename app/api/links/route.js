import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const P = "tdla:";

export async function GET() {
  const telegramLink = (await kv.get(P + "telegram_link")) || "";
  const signalLink = (await kv.get(P + "signal_link")) || "";
  return NextResponse.json({ telegramLink, signalLink });
}
