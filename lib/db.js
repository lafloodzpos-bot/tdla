import { kv } from "@vercel/kv";

const PRODUCTS_KEY = "products";

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