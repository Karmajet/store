export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

const LOW_STOCK_THRESHOLD = 5;

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Products</h1>
      {products.length === 0 ? (
        <p className="text-gray-500">No products available.</p>
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
    </div>
  );
}
