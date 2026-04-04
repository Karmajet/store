export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import ProductActiveToggle from "./ProductActiveToggle";
import ProductDeleteButton from "./ProductDeleteButton";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add Product
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Active
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatPrice(product.price)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {(() => {
                    const total = product.variants.reduce((s, v) => s + v.stock, 0);
                    if (total <= 0)
                      return <span className="font-medium text-red-600">Out of stock</span>;
                    if (total <= 5)
                      return <span className="font-medium text-orange-600">{total} left</span>;
                    return <span className="text-gray-600">{total}</span>;
                  })()}
                </td>
                <td className="px-4 py-3">
                  <ProductActiveToggle
                    productId={product.id}
                    active={product.active}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                  <ProductDeleteButton productId={product.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-500">
            No products yet.
          </p>
        )}
      </div>
    </div>
  );
}
