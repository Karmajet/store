export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    include: {
      _count: { select: { orders: true } },
      orders: {
        where: { status: "paid" },
        select: { totalAmount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Customers</h1>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Orders
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Total Spent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map((customer) => {
              const totalSpent = customer.orders.reduce(
                (sum, o) => sum + o.totalAmount,
                0
              );
              return (
                <tr key={customer.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {customer.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {customer._count.orders}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatPrice(totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {customers.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-500">
            No customers yet.
          </p>
        )}
      </div>
    </div>
  );
}
