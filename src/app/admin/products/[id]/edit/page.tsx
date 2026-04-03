"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Variant {
  id: string;
  name: string;
  value: string;
  sku: string;
  stock: number;
  priceDiff: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  variants: Variant[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    imageUrl: "",
    active: true,
  });

  const [newVariant, setNewVariant] = useState({
    name: "",
    value: "",
    sku: "",
    stock: "0",
    priceDiff: "0",
  });

  useEffect(() => {
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        setForm({
          name: data.name,
          slug: data.slug,
          description: data.description,
          price: (data.price / 100).toFixed(2),
          imageUrl: data.imageUrl,
          active: data.active,
        });
        setLoading(false);
      });
  }, [productId]);

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/admin/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Math.round(parseFloat(form.price) * 100),
      }),
    });
    setSaving(false);
    router.push("/admin/products");
  };

  const addVariant = async () => {
    const res = await fetch(`/api/admin/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newVariant,
        stock: parseInt(newVariant.stock),
        priceDiff: Math.round(parseFloat(newVariant.priceDiff) * 100),
      }),
    });
    if (res.ok) {
      const variant = await res.json();
      setProduct((prev) =>
        prev ? { ...prev, variants: [...prev.variants, variant] } : prev
      );
      setNewVariant({ name: "", value: "", sku: "", stock: "0", priceDiff: "0" });
    }
  };

  const deleteVariant = async (variantId: string) => {
    await fetch(`/api/admin/products/${productId}/variants?variantId=${variantId}`, {
      method: "DELETE",
    });
    setProduct((prev) =>
      prev
        ? { ...prev, variants: prev.variants.filter((v) => v.id !== variantId) }
        : prev
    );
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!product) return <p className="text-gray-500">Product not found</p>;

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>

      <form onSubmit={handleSave} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
          <input type="text" required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea required rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Price (USD)</label>
          <input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => update("price", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
          <input type="text" required value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
          <label htmlFor="active" className="text-sm text-gray-700">Active</label>
        </div>
        <button type="submit" disabled={saving} className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-gray-900">Variants</h2>
        {product.variants.length > 0 && (
          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="pb-2">Name</th>
                <th className="pb-2">Value</th>
                <th className="pb-2">SKU</th>
                <th className="pb-2">Stock</th>
                <th className="pb-2">Price Diff</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {product.variants.map((v) => (
                <tr key={v.id}>
                  <td className="py-2">{v.name}</td>
                  <td className="py-2">{v.value}</td>
                  <td className="py-2">{v.sku}</td>
                  <td className="py-2">{v.stock}</td>
                  <td className="py-2">{v.priceDiff > 0 ? `+$${(v.priceDiff / 100).toFixed(2)}` : "$0.00"}</td>
                  <td className="py-2">
                    <button onClick={() => deleteVariant(v.id)} className="text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="grid grid-cols-5 gap-2">
          <input placeholder="Name (e.g. Size)" value={newVariant.name} onChange={(e) => setNewVariant((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
          <input placeholder="Value (e.g. Large)" value={newVariant.value} onChange={(e) => setNewVariant((p) => ({ ...p, value: e.target.value }))} className={inputClass} />
          <input placeholder="SKU" value={newVariant.sku} onChange={(e) => setNewVariant((p) => ({ ...p, sku: e.target.value }))} className={inputClass} />
          <input type="number" placeholder="Stock" value={newVariant.stock} onChange={(e) => setNewVariant((p) => ({ ...p, stock: e.target.value }))} className={inputClass} />
          <input type="number" step="0.01" placeholder="Price diff ($)" value={newVariant.priceDiff} onChange={(e) => setNewVariant((p) => ({ ...p, priceDiff: e.target.value }))} className={inputClass} />
        </div>
        <button
          onClick={addVariant}
          className="mt-2 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Add Variant
        </button>
      </div>
    </div>
  );
}
