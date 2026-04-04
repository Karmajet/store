export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import VariantSelector from "@/components/VariantSelector";
import WishlistButton from "@/components/WishlistButton";
import ReviewSection from "@/components/ReviewSection";
import ProductCard from "@/components/ProductCard";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true, category: true },
  });

  if (!product) notFound();

  // Related products: same category, exclude current
  const relatedProducts = product.categoryId
    ? await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          active: true,
        },
        include: { variants: true },
        take: 3,
      })
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/?category=${product.category.slug}`}
              className="hover:text-gray-700"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div>
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {product.name}
            </h1>
            <WishlistButton productId={product.id} />
          </div>
          <p className="mt-4 text-gray-600">{product.description}</p>
          <div className="mt-6">
            <VariantSelector
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
              }}
              variants={product.variants}
            />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection slug={slug} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            You might also like
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((rp) => {
              const totalStock = rp.variants.reduce(
                (s, v) => s + v.stock,
                0
              );
              return (
                <ProductCard
                  key={rp.id}
                  slug={rp.slug}
                  name={rp.name}
                  price={rp.price}
                  imageUrl={rp.imageUrl}
                  outOfStock={rp.variants.length > 0 && totalStock <= 0}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
