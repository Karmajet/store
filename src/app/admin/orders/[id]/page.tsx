import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

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
    },
  });

  if (!order) notFound();

  const statusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Order ID</p>
            <p className="font-mono font-medium">{order.id}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                statusColors[order.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {order.status}
            </span>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{order.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-medium text-gray-900">Shipping</h2>
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

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-medium text-gray-900">Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
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
        <div className="mt-4 border-t pt-4 text-right text-lg font-bold">
          Total: {formatPrice(order.totalAmount)}
        </div>
      </div>
    </div>
  );
}
