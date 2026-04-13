import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const P = "tdla:";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const telegramLink = (await kv.get(P + "telegram_link")) || "";
  const signalLink = (await kv.get(P + "signal_link")) || "";
  const res = NextResponse.json({ telegramLink, signalLink });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}
