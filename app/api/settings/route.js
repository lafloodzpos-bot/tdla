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
  return NextResponse.json({ pins, logs, adminLogs, siteEnabled: enabled !== false, publicAccess: pub === true });
}

export async function POST(request) {
  if (!(await checkAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  
  if (body.action === "set_pins") {
    await kv.set("user_pins", body.pins);
    return NextResponse.json({ success: true });
  }
  if (body.action === "toggle_site") {
    const current = await kv.get("site_enabled");
    const newVal = current === false ? true : false;
    await kv.set("site_enabled", newVal);
    return NextResponse.json({ siteEnabled: newVal });
  }
  if (body.action === "toggle_public") {
    const current = await kv.get("public_access");
    const newVal = current === true ? false : true;
    await kv.set("public_access", newVal);
    return NextResponse.json({ publicAccess: newVal });
  }
  if (body.action === "change_password") {
    if (!body.newPassword || body.newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    await kv.set("admin_password", body.newPassword);
    return NextResponse.json({ success: true });
  }
  if (body.action === "log_admin") {
    const adminLogs = (await kv.get("admin_logs")) || [];
    adminLogs.unshift({ ip, date: new Date().toISOString() });
    if (adminLogs.length > 200) adminLogs.length = 200;
    await kv.set("admin_logs", adminLogs);
    return NextResponse.json({ success: true });
  }
  if (body.action === "clear_logs") {
    await kv.set("access_logs", []);
    return NextResponse.json({ success: true });
  }
  if (body.action === "clear_admin_logs") {
    await kv.set("admin_logs", []);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}