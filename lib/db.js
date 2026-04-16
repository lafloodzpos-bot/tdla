import { kv } from "@vercel/kv";

const P = "tdla:";
const PRODUCTS_KEY = P + "products";
const ANNOUNCEMENTS_KEY = P + "announcements";

export async function getProducts() {
  try {
    const products = await kv.get(PRODUCTS_KEY);
    return products || [];
  } catch (err) {
    console.error("DB error (getProducts):", err);
    return [];
  }
}

export async function getProduct(id) {
  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

export async function addProduct(product) {
  const products = await getProducts();
  const newProduct = {
    ...product,
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  await kv.set(PRODUCTS_KEY, products);
  return newProduct;
}

export async function updateProduct(id, updates) {
  const products = await getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
  await kv.set(PRODUCTS_KEY, products);
  return products[index];
}

export async function deleteProduct(id) {
  const products = await getProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  await kv.set(PRODUCTS_KEY, filtered);
  return true;
}

export async function getAnnouncements() {
  try {
    const list = await kv.get(ANNOUNCEMENTS_KEY);
    return list || [];
  } catch (err) {
    console.error("DB error (getAnnouncements):", err);
    return [];
  }
}

export async function getActiveAnnouncements() {
  const all = await getAnnouncements();
  const now = new Date();
  return all.filter((a) => {
    if (!a.active) return false;
    if (!a.expiresAt) return true;
    return new Date(a.expiresAt) > now;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addAnnouncement(ann) {
  const list = await getAnnouncements();
  const newAnn = { ...ann, id: "ann_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6), active: ann.active !== false, createdAt: new Date().toISOString() };
  list.push(newAnn);
  await kv.set(ANNOUNCEMENTS_KEY, list);
  return newAnn;
}

export async function updateAnnouncement(id, updates) {
  const list = await getAnnouncements();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) return null;
  list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
  await kv.set(ANNOUNCEMENTS_KEY, list);
  return list[index];
}

export async function deleteAnnouncement(id) {
  const list = await getAnnouncements();
  const filtered = list.filter((a) => a.id !== id);
  if (filtered.length === list.length) return false;
  await kv.set(ANNOUNCEMENTS_KEY, filtered);
  return true;
}