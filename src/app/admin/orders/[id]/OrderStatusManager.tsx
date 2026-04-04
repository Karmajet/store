"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-800",
};

interface Props {
  orderId: string;
  currentStatus: string;
  trackingNumber: string | null;
  notes: string | null;
  hasPaymentId: boolean;
}

export default function OrderStatusManager({
  orderId,
  currentStatus,
  trackingNumber: initialTracking,
  notes: initialNotes,
  hasPaymentId,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(initialTracking || "");
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refunding, setRefunding] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: status !== currentStatus ? status : undefined,
        trackingNumber: tracking || null,
        notes: notes || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update");
    } else {
      router.refresh();
    }
    setSaving(false);
  };

  const handleRefund = async () => {
    if (!confirm("Issue a full refund for this order? This cannot be undone.")) return;
    setRefunding(true);
    setError("");
    const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Refund failed");
    } else {
      router.refresh();
    }
    setRefunding(false);
  };

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Status & Actions</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            STATUS_COLORS[currentStatus] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {currentStatus}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tracking Number
          </label>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. 9400111899223..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Internal Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {hasPaymentId &&
            currentStatus !== "refunded" &&
            currentStatus !== "cancelled" && (
              <button
                onClick={handleRefund}
                disabled={refunding}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {refunding ? "Processing..." : "Issue Refund"}
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
