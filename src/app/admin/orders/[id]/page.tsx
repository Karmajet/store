export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import OrderStatusManager from "./OrderStatusManager";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true, variant: true },
      },
      coupon: true,
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>

      {/* Status + Actions */}
      <OrderStatusManager
        orderId={order.id}
        currentStatus={order.status}
        trackingNumber={order.trackingNumber}
        notes={order.notes}
        hasPaymentId={!!order.stripePaymentId}
      />

      {/* Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-medium text-gray-900">Timeline</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Created</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          {order.shippedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Shipped</span>
              <span>{new Date(order.shippedAt).toLocaleString()}</span>
            </div>
          )}
          {order.deliveredAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Delivered</span>
              <span>{new Date(order.deliveredAt).toLocaleString()}</span>
            </div>
          )}
          {order.cancelledAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Cancelled</span>
              <span>{new Date(order.cancelledAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-medium text-gray-900">Customer</h2>
          <p className="text-sm text-gray-600">{order.email}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-medium text-gray-900">Shipping</h2>
          <p className="text-sm text-gray-600">
            {order.shippingName}<br />
            {order.shippingAddress}<br />
            {order.shippingCity}, {order.shippingState} {order.shippingZip}<br />
            {order.shippingCountry}
          </p>
          {order.shippingMethod && (
            <p className="mt-2 text-xs text-gray-400 capitalize">{order.shippingMethod} shipping</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-medium text-gray-900">Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{item.product.name}</span>
                {item.variant && (
                  <span className="text-gray-500">
                    {" "}({item.variant.name}: {item.variant.value})
                  </span>
                )}
                <span className="text-gray-500"> x{item.quantity}</span>
              </div>
              <span>{formatPrice(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 border-t pt-4 text-sm">
          {order.subtotalAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPrice(order.subtotalAmount)}</span>
            </div>
          )}
          {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">
                Discount{order.coupon ? ` (${order.coupon.code})` : ""}
              </span>
              <span className="text-green-600">-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          {order.shippingCost > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
          )}
          {order.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Tax</span>
              <span>{formatPrice(order.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
