import { NextResponse } from "next/server";
import { sendTelegram } from "@/lib/telegram";
import { ADMIN_PASSWORD } from "@/lib/config";

export async function POST(request) {
  const pw = request.headers.get("x-admin-password");
  if (pw !== ADMIN_PASSWORD) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.message || typeof body.message !== "string") return NextResponse.json({ error: "Message required" }, { status: 400 });
  const result = await sendTelegram(body.message);
  return NextResponse.json(result);
}