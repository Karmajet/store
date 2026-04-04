"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import ShippingForm from "@/components/ShippingForm";
import CouponInput from "@/components/CouponInput";
import { formatPrice } from "@/lib/utils";
import {
  getShippingOptions,
  type ShippingMethod,
} from "@/lib/shipping";
import { getTaxRate } from "@/lib/tax";

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
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [state, setState] = useState("");

  const shippingOptions = useMemo(() => getShippingOptions(total), [total]);
  const shippingCost = useMemo(() => {
    const option = shippingOptions.find((o) => o.id === shippingMethod);
    return option?.cost ?? 599;
  }, [shippingOptions, shippingMethod]);

  const subtotalAfterDiscount = total - (coupon?.discount || 0);
  const taxAmount = useMemo(
    () => (state ? Math.round(subtotalAfterDiscount * getTaxRate(state)) : 0),
    [subtotalAfterDiscount, state]
  );
  const grandTotal = subtotalAfterDiscount + shippingCost + taxAmount;

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

  // Auto-select free shipping if available
  const freeAvailable = shippingOptions.some((o) => o.id === "free");
  if (freeAvailable && shippingMethod === "standard") {
    setShippingMethod("free");
  }

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
          shippingMethod,
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Left: Form */}
        <div className="lg:col-span-3">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Shipping Method */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">
              Shipping Method
            </h2>
            <div className="space-y-3">
              {shippingOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                    shippingMethod === option.id
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      value={option.id}
                      checked={shippingMethod === option.id}
                      onChange={() => setShippingMethod(option.id)}
                      className="h-4 w-4 accent-black"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {option.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {option.estimatedDays}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {option.cost === 0 ? "Free" : formatPrice(option.cost)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">
              Shipping Address
            </h2>
            <ShippingForm
              onSubmit={handleSubmit}
              loading={loading}
              onStateChange={setState}
            />
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-4 space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-medium text-gray-900">
              Order Summary
            </h2>

            {/* Items */}
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-600">
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>

              {/* Coupon */}
              <div className="mt-3">
                <CouponInput subtotal={total} onApply={setCoupon} />
              </div>

              {coupon && (
                <div className="mt-2 flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">
                    -{formatPrice(coupon.discount)}
                  </span>
                </div>
              )}

              <div className="mt-2 flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>
                  {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                </span>
              </div>

              <div className="mt-2 flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>{taxAmount > 0 ? formatPrice(taxAmount) : "--"}</span>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
