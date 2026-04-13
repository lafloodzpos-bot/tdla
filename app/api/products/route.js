import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { ADMIN_PASSWORD as DEFAULT_PASSWORD, DEV_PASSWORD } from "@/lib/config";
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/lib/db";

export const dynamic = "force-dynamic";
const P = "tdla:";

async function checkAdmin(request) {
  const pw = request.headers.get("x-admin-password");
  if (pw === DEV_PASSWORD) return true;
  const customPw = await kv.get(P + "admin_password");
  return pw === (customPw || DEFAULT_PASSWORD);
}

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request) {
  if (!(await checkAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const product = await addProduct(body);
  return NextResponse.json(product);
}

export async function PUT(request) {
  if (!(await checkAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, ...updates } = body;
  const product = await updateProduct(id, updates);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function DELETE(request) {
  if (!(await checkAdmin(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const result = await deleteProduct(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
