import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  const telegramLink = (await kv.get("telegram_link")) || "";
  const signalLink = (await kv.get("signal_link")) || "";
  return NextResponse.json({ telegramLink, signalLink });
}