import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/lib/db";
import { ADMIN_PASSWORD as DEFAULT_PASSWORD } from "@/lib/config";

function isAuthed(request) {
  const pw = request.headers.get("x-admin-password");
  return pw === ADMIN_PASSWORD;
}

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  if (!body.name || body._test) {
    return NextResponse.json({ error: "Valid product name required" }, { status: 400 });
  }
  const product = await addProduct(body);
  return NextResponse.json(product, { status: 201 });
}

export async function PUT(request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { id, ...updates } = body;
  const product = await updateProduct(id, updates);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function DELETE(request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const success = await deleteProduct(id);
  if (!success) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}