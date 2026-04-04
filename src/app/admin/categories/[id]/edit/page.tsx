"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  useEffect(() => {
    fetch(`/api/admin/categories`)
      .then((r) => r.json())
      .then((cats) => {
        const cat = cats.find((c: { id: string }) => c.id === categoryId);
        if (cat) setForm({ name: cat.name, slug: cat.slug, description: cat.description || "" });
        setLoading(false);
      });
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/admin/categories/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/admin/categories");
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Category</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input type="text" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
          <input type="text" required value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} />
        </div>
        <button type="submit" disabled={saving} className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
