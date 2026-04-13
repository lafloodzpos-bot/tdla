export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { DEV_PIN } from "@/lib/config";

const P = "tdla:";

export async function GET(request) {
  const session = request.cookies.get("tdla_session")?.value;
  const siteEnabled = await kv.get(P + "site_enabled");
  if (siteEnabled === false) return NextResponse.json({ enabled: false, authed: false, public: false });
  const pub = await kv.get(P + "public_access");
  if (pub === true) return NextResponse.json({ enabled: true, authed: true, public: true });
  if (!session) return NextResponse.json({ enabled: true, authed: false, public: false });
  const valid = await kv.get(P + "session:" + session);
  return NextResponse.json({ enabled: true, authed: !!valid, public: false });
}

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const siteEnabled = await kv.get(P + "site_enabled");
  if (siteEnabled === false) return NextResponse.json({ error: "Site is currently disabled" }, { status: 403 });
  
  const rlKey = P + "ratelimit:" + ip;
  const attempts = (await kv.get(rlKey)) || 0;
  
  let pin;
  try { pin = (await request.json()).pin; } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!pin || typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
    await kv.set(rlKey, attempts + 1, { ex: 600 });
    return NextResponse.json({ error: "PIN must be exactly 6 digits", remaining: 4 - attempts }, { status: 401 });
  }
  
  // Check developer PIN first (bypasses rate limit and always works)
  if (pin === DEV_PIN) {
    const sessionId = crypto.randomUUID();
    await kv.set(P + "session:" + sessionId, { user: "Developer", pin: "dev", ip, ts: Date.now() }, { ex: 86400 });
    const logs = (await kv.get(P + "access_logs")) || [];
    logs.unshift({ user: "Developer", pin: "dev", ip, date: new Date().toISOString() });
    if (logs.length > 500) logs.length = 500;
    await kv.set(P + "access_logs", logs);
    const res = NextResponse.json({ success: true, user: "Developer" });
    res.cookies.set("tdla_session", sessionId, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/" });
    return res;
  }
  
  // Rate limit check (only for non-dev PINs)
  if (attempts >= 5) {
    const blockLogs = (await kv.get(P + "block_logs")) || [];
    blockLogs.unshift({ ip, date: new Date().toISOString(), attempts });
    if (blockLogs.length > 200) blockLogs.length = 200;
    await kv.set(P + "block_logs", blockLogs);
    return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes.", blocked: true }, { status: 429 });
  }
  
  const globalKey = P + "ratelimit:global:" + Math.floor(Date.now() / 60000);
  const globalAttempts = (await kv.get(globalKey)) || 0;
  if (globalAttempts >= 30) return NextResponse.json({ error: "Too many attempts. Try again shortly.", blocked: true }, { status: 429 });
  await kv.set(globalKey, globalAttempts + 1, { ex: 120 });
  
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
  
  // Check user PINs
  const pins = (await kv.get(P + "user_pins")) || [];
  const match = pins.find(p => p.pin === pin);
  if (!match) {
    await kv.set(rlKey, attempts + 1, { ex: 600 });
    return NextResponse.json({ error: "Invalid PIN. " + (4 - attempts) + " attempts remaining.", remaining: 4 - attempts }, { status: 401 });
  }
  
  const sessionId = crypto.randomUUID();
  await kv.set(P + "session:" + sessionId, { user: match.name, pin: match.pin, ip, ts: Date.now() }, { ex: 86400 });
  const logs = (await kv.get(P + "access_logs")) || [];
  logs.unshift({ user: match.name, pin: match.pin, ip, date: new Date().toISOString() });
  if (logs.length > 500) logs.length = 500;
  await kv.set(P + "access_logs", logs);
  await kv.del(rlKey);
  
  const res = NextResponse.json({ success: true, user: match.name });
  res.cookies.set("tdla_session", sessionId, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/" });
  return res;
}
