export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import CategoryNav from "@/components/CategoryNav";
import SearchBar from "@/components/SearchBar";
import SortSelect from "@/components/SortSelect";
import Link from "next/link";

const PRODUCTS_PER_PAGE = 12;
const LOW_STOCK_THRESHOLD = 5;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const category = params.category || "";
  const sort = params.sort || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));

  // Build Prisma where clause
  const where: Record<string, unknown> = { active: true };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  // Build orderBy
  let orderBy: Record<string, string> = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  else if (sort === "price-desc") orderBy = { price: "desc" };
  else if (sort === "name-asc") orderBy = { name: "asc" };

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { variants: true },
      orderBy,
      skip: (page - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

  // Build pagination URL helper
  const buildPageUrl = (p: number) => {
    const urlParams = new URLSearchParams();
    if (query) urlParams.set("q", query);
    if (category) urlParams.set("category", category);
    if (sort) urlParams.set("sort", sort);
    if (p > 1) urlParams.set("page", p.toString());
    const qs = urlParams.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Products</h1>

      {/* Search + Sort */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
        <Suspense>
          <SortSelect />
        </Suspense>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <CategoryNav activeCategory={category} />
      </div>

      {/* Active search indicator */}
      {query && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <span>
            {totalCount} result{totalCount !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </span>
          <Link href="/" className="text-black underline hover:no-underline">
            Clear
          </Link>
        </div>
      )}

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No products found.</p>
          {(query || category) && (
            <Link
              href="/"
              className="mt-4 inline-block text-sm text-black underline hover:no-underline"
            >
              View all products
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const totalStock = product.variants.reduce(
              (sum, v) => sum + v.stock,
              0
            );
            const outOfStock =
              product.variants.length > 0 && totalStock <= 0;
            const lowStock =
              !outOfStock && totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD;

            return (
              <ProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                outOfStock={outOfStock}
                lowStock={lowStock}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildPageUrl(page - 1)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildPageUrl(p)}
              className={`rounded-md px-3 py-2 text-sm ${
                p === page
                  ? "bg-black text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {p}
            </Link>
          ))}
          {page < totalPages && (
            <Link
              href={buildPageUrl(page + 1)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
