export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboard() {
  const [orderCount, revenue, productCount] = await Promise.all([
    prisma.order.count({ where: { status: "paid" } }),
    prisma.order.aggregate({
      where: { status: "paid" },
      _sum: { totalAmount: true },
    }),
    prisma.product.count(),
  ]);

  const stats = [
    { label: "Total Orders", value: orderCount.toString() },
    {
      label: "Revenue",
      value: formatPrice(revenue._sum.totalAmount ?? 0),
    },
    { label: "Products", value: productCount.toString() },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-6"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
