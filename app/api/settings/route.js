import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { ADMIN_PASSWORD, DEV_PASSWORD } from "@/lib/config";

export const dynamic = "force-dynamic";
const P = "tdla:";

async function checkAdmin(request) {
  const pw = request.headers.get("x-admin-password");
  if (pw === DEV_PASSWORD) return "dev";
  const customPw = await kv.get(P + "admin_password");
  if (pw === (customPw || ADMIN_PASSWORD)) return "admin";
  return false;
}

export async function GET(request) {
  const role = await checkAdmin(request);
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pins = (await kv.get(P + "user_pins")) || [];
  const logs = (await kv.get(P + "access_logs")) || [];
  const adminLogs = (await kv.get(P + "admin_logs")) || [];
  const enabled = await kv.get(P + "site_enabled");
  const pub = await kv.get(P + "public_access");
  const telegramLink = (await kv.get(P + "telegram_link")) || "";
  const signalLink = (await kv.get(P + "signal_link")) || "";
  return NextResponse.json({ pins, logs, adminLogs, siteEnabled: enabled !== false, publicAccess: pub === true, telegramLink, signalLink, role });
}

export async function POST(request) {
  const role = await checkAdmin(request);
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  
  if (body.action === "set_pins") { await kv.set(P + "user_pins", body.pins); return NextResponse.json({ success: true }); }
  if (body.action === "toggle_site") { const c = await kv.get(P + "site_enabled"); const n = c === false; await kv.set(P + "site_enabled", n); return NextResponse.json({ siteEnabled: n }); }
  if (body.action === "toggle_public") { const c = await kv.get(P + "public_access"); const n = c !== true; await kv.set(P + "public_access", n); return NextResponse.json({ publicAccess: n }); }
  if (body.action === "change_password") {
    if (role !== "dev" && role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!body.newPassword || body.newPassword.length < 6) return NextResponse.json({ error: "Min 6 chars" }, { status: 400 });
    await kv.set(P + "admin_password", body.newPassword);
    return NextResponse.json({ success: true });
  }
  if (body.action === "set_telegram") { const link = (body.link || "").trim(); await kv.set(P + "telegram_link", link); return NextResponse.json({ success: true, telegramLink: link }); }
  if (body.action === "set_signal") { const link = (body.link || "").trim(); await kv.set(P + "signal_link", link); return NextResponse.json({ success: true, signalLink: link }); }
  if (body.action === "log_admin") {
    const al = (await kv.get(P + "admin_logs")) || [];
    al.unshift({ ip, date: new Date().toISOString(), type: role === "dev" ? "Developer" : "Admin" });
    if (al.length > 200) al.length = 200;
    await kv.set(P + "admin_logs", al);
    return NextResponse.json({ success: true });
  }
  if (body.action === "clear_logs") { await kv.set(P + "access_logs", []); return NextResponse.json({ success: true }); }
  if (body.action === "clear_admin_logs") { await kv.set(P + "admin_logs", []); return NextResponse.json({ success: true }); }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
