"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

interface WishlistItem {
  id: string;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    imageUrl: string;
    variants: { stock: number }[];
  };
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/wishlist")
        .then((r) => r.json())
        .then((data) => {
          setItems(data);
          setLoading(false);
        });
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Wishlist</h1>
        <p className="mt-4 text-gray-500">Sign in to save your favorite items.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">My Wishlist</h1>
      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">Your wishlist is empty.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const totalStock = item.product.variants.reduce(
              (s, v) => s + v.stock,
              0
            );
            return (
              <ProductCard
                key={item.id}
                slug={item.product.slug}
                name={item.product.name}
                price={item.product.price}
                imageUrl={item.product.imageUrl}
                outOfStock={item.product.variants.length > 0 && totalStock <= 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
