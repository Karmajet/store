export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <Link
          href="/admin/coupons/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Create Coupon
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Discount</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Uses</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{c.code}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {c.type === "percentage" ? `${c.value}%` : formatPrice(c.value)} off
                  {c.minOrderAmount ? ` (min ${formatPrice(c.minOrderAmount)})` : ""}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {c.currentUses}{c.maxUses ? ` / ${c.maxUses}` : ""}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    c.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-500">No coupons yet.</p>
        )}
      </div>
    </div>
  );
}
