import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, variant: true } },
    },
  });

  if (!order || order.userId !== userId) notFound();

  const statusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/account"
        className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Account
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Order Details</h1>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {new Date(order.createdAt).toLocaleString()}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                statusColors[order.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {order.status}
            </span>
          </div>
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
          <div className="mt-4 border-t pt-4 text-right font-bold">
            Total: {formatPrice(order.totalAmount)}
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
      </div>
    </div>
  );
}
