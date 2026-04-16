import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getAnnouncements, getActiveAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/db";
import { ADMIN_PASSWORD as DEFAULT_PASSWORD, DEV_PASSWORD } from "@/lib/config";

export const dynamic = "force-dynamic";
const P = "tdla:";

async function checkAdmin(request) {
  const pw = request.headers.get("x-admin-password");
  if (pw === DEV_PASSWORD) return true;
  const customPw = await kv.get(P + "admin_password");
  return pw === (customPw || DEFAULT_PASSWORD);
}

export async function GET(request) {
  if (await checkAdmin(request)) {
    const all = await getAnnouncements();
    return NextResponse.json(all);
  }
  const active = await getActiveAnnouncements();
  return NextResponse.json(active);
}

export async function POST(request) {
  if (!(await checkAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.title || !body.body) return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  const ann = await addAnnouncement({ title: body.title, body: body.body, expiresAt: body.expiresAt || null, active: body.active !== false });
  return NextResponse.json(ann, { status: 201 });
}

export async function PUT(request) {
  if (!(await checkAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, ...updates } = body;
  const ann = await updateAnnouncement(id, updates);
  if (!ann) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ann);
}

export async function DELETE(request) {
  if (!(await checkAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const ok = await deleteAnnouncement(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}