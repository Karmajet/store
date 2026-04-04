"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import ShippingForm from "@/components/ShippingForm";
import CouponInput from "@/components/CouponInput";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, total, loaded } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState<{
    couponId: string;
    code: string;
    discount: number;
  } | null>(null);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  const finalTotal = total - (coupon?.discount || 0);

  const handleSubmit = async (shipping: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          shipping,
          couponCode: coupon?.code || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Checkout</h1>

      {/* Order Summary */}
      <div className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
          <span className="text-gray-900">{formatPrice(total)}</span>
        </div>
        <CouponInput
          subtotal={total}
          onApply={setCoupon}
        />
        {coupon && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Discount</span>
            <span className="text-green-600">-{formatPrice(coupon.discount)}</span>
          </div>
        )}
        <div className="border-t pt-3">
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(finalTotal)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-gray-900">
          Shipping Information
        </h2>
        <ShippingForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
