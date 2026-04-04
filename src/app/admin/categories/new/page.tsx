"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";

export default function NewCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name, slug: slugify(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) router.push("/admin/categories");
    else { setLoading(false); alert("Failed to create category"); }
  };

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">New Category</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input type="text" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
          <input type="text" required value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description (optional)</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} />
        </div>
        <button type="submit" disabled={loading} className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {loading ? "Creating..." : "Create Category"}
        </button>
      </form>
    </div>
  );
}
