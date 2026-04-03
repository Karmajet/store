"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

interface OrderData {
  id: string;
  email: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  totalAmount: number;
  status: string;
  items: {
    quantity: number;
    unitPrice: number;
    product: { name: string };
    variant: { name: string; value: string } | null;
  }[];
}

export default function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/order?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data.order);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Thank you for your order!
        </h1>
        <p className="mt-4 text-gray-500">Your payment has been received.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        Order Confirmed!
      </h1>
      <p className="mb-8 text-gray-500">
        A confirmation email will be sent to {order.email}.
      </p>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-medium text-gray-900">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium">{item.product.name}</span>
                  {item.variant && (
                    <span className="text-gray-500">
                      {" "}
                      ({item.variant.name}: {item.variant.value})
                    </span>
                  )}
                  <span className="text-gray-500"> x{item.quantity}</span>
                </div>
                <span>{formatPrice(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-4 text-right font-bold">
            Total: {formatPrice(order.totalAmount)}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-medium text-gray-900">Shipping Address</h2>
          <p className="text-sm text-gray-600">
            {order.shippingName}
            <br />
            {order.shippingAddress}
            <br />
            {order.shippingCity}, {order.shippingState} {order.shippingZip}
            <br />
            {order.shippingCountry}
          </p>
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
