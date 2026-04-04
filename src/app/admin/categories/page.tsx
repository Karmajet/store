export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CategoryDeleteButton from "./CategoryDeleteButton";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add Category
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Products</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{cat.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{cat.slug}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{cat._count.products}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/categories/${cat.id}/edit`} className="text-sm text-blue-600 hover:text-blue-800">
                    Edit
                  </Link>
                  <CategoryDeleteButton categoryId={cat.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-500">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
