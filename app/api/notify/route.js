import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { sendTelegram } from "@/lib/telegram";
import { ADMIN_PASSWORD as DEFAULT_PASSWORD, DEV_PASSWORD } from "@/lib/config";

export const dynamic = "force-dynamic";
const P = "tdla:";

async function checkAdmin(request) {
  const pw = request.headers.get("x-admin-password");
  if (pw === DEV_PASSWORD) return true;
  const customPw = await kv.get(P + "admin_password");
  return pw === (customPw || DEFAULT_PASSWORD);
}

export async function POST(request) {
  if (!(await checkAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.message || typeof body.message !== "string") return NextResponse.json({ error: "Message required" }, { status: 400 });
  const result = await sendTelegram(body.message);
  return NextResponse.json(result);
}