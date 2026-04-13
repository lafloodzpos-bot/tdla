import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { ADMIN_PASSWORD } from "@/lib/config";

async function checkAdmin(request) {
  const pw = request.headers.get("x-admin-password");
  const customPw = await kv.get("admin_password");
  return pw === (customPw || ADMIN_PASSWORD);
}

export async function GET(request) {
  if (!(await checkAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pins = (await kv.get("user_pins")) || [];
  const logs = (await kv.get("access_logs")) || [];
  const adminLogs = (await kv.get("admin_logs")) || [];
  const enabled = await kv.get("site_enabled");
  const pub = await kv.get("public_access");
  const telegramLink = (await kv.get("telegram_link")) || "";
  const signalLink = (await kv.get("signal_link")) || "";
  return NextResponse.json({ pins, logs, adminLogs, siteEnabled: enabled !== false, publicAccess: pub === true, telegramLink, signalLink });
}

export async function POST(request) {
  if (!(await checkAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  
  if (body.action === "set_pins") { await kv.set("user_pins", body.pins); return NextResponse.json({ success: true }); }
  if (body.action === "toggle_site") { const c = await kv.get("site_enabled"); const n = c === false; await kv.set("site_enabled", n); return NextResponse.json({ siteEnabled: n }); }
  if (body.action === "toggle_public") { const c = await kv.get("public_access"); const n = c !== true; await kv.set("public_access", n); return NextResponse.json({ publicAccess: n }); }
  if (body.action === "change_password") { if (!body.newPassword || body.newPassword.length < 6) return NextResponse.json({ error: "Min 6 chars" }, { status: 400 }); await kv.set("admin_password", body.newPassword); return NextResponse.json({ success: true }); }
  if (body.action === "set_telegram") { const link = (body.link || "").trim(); await kv.set("telegram_link", link); return NextResponse.json({ success: true, telegramLink: link }); }
  if (body.action === "set_signal") { const link = (body.link || "").trim(); await kv.set("signal_link", link); return NextResponse.json({ success: true, signalLink: link }); }
  if (body.action === "log_admin") { const al = (await kv.get("admin_logs")) || []; al.unshift({ ip, date: new Date().toISOString() }); if (al.length > 200) al.length = 200; await kv.set("admin_logs", al); return NextResponse.json({ success: true }); }
  if (body.action === "clear_logs") { await kv.set("access_logs", []); return NextResponse.json({ success: true }); }
  if (body.action === "clear_admin_logs") { await kv.set("admin_logs", []); return NextResponse.json({ success: true }); }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}