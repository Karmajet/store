"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

interface Props {
  subtotal: number;
  onApply: (coupon: { couponId: string; code: string; discount: number } | null) => void;
}

export default function CouponInput({ subtotal, onApply }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim(), subtotal }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    setApplied({ code: data.code, discount: data.discount });
    onApply({ couponId: data.couponId, code: data.code, discount: data.discount });
    setLoading(false);
  };

  const handleRemove = () => {
    setApplied(null);
    setCode("");
    setError("");
    onApply(null);
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-sm">
        <div>
          <span className="font-medium text-green-800">{applied.code}</span>
          <span className="ml-2 text-green-600">
            -{formatPrice(applied.discount)}
          </span>
        </div>
        <button
          onClick={handleRemove}
          className="text-green-600 hover:text-green-800"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Coupon code"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "..." : "Apply"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
