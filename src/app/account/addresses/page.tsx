"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Address {
  id: string;
  label: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    label: "Home", name: "", address: "", city: "", state: "", zip: "", country: "US", isDefault: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/addresses").then((r) => r.json()).then((data) => { setAddresses(data); setLoading(false); });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const addr = await res.json();
      setAddresses((prev) => [addr, ...prev]);
      setShowForm(false);
      setForm({ label: "Home", name: "", address: "", city: "", state: "", zip: "", country: "US", isDefault: false });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            Add Address
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Label</label>
              <select value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} className={inputClass}>
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <input type="text" required value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">City</label><input type="text" required value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inputClass} /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">State</label><input type="text" required value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} className={inputClass} /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">ZIP</label><input type="text" required value={form.zip} onChange={(e) => setForm((p) => ({ ...p, zip: e.target.value }))} className={inputClass} /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="default" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} />
            <label htmlFor="default" className="text-sm text-gray-700">Set as default</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{saving ? "Saving..." : "Save Address"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <p className="text-sm text-gray-500">No saved addresses.</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{addr.label}</span>
                  {addr.isDefault && <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">Default</span>}
                </div>
                <p className="mt-1 text-sm text-gray-600">{addr.name}</p>
                <p className="text-sm text-gray-500">{addr.address}, {addr.city}, {addr.state} {addr.zip}</p>
              </div>
              <button onClick={() => handleDelete(addr.id)} className="text-sm text-red-600 hover:text-red-800">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
