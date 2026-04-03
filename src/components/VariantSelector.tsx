"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  value: string;
  priceDiff: number;
  stock: number;
}

interface Props {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
  variants: Variant[];
}

export default function VariantSelector({ product, variants }: Props) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Group variants by name (e.g. "Size" -> ["S", "M", "L"])
  const groups = variants.reduce<Record<string, Variant[]>>((acc, v) => {
    if (!acc[v.name]) acc[v.name] = [];
    acc[v.name].push(v);
    return acc;
  }, {});

  const groupNames = Object.keys(groups);

  // Track selection per group
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const name of groupNames) {
      initial[name] = groups[name][0]?.id ?? "";
    }
    return initial;
  });

  // Find matching variant based on selections
  const selectedVariant =
    variants.length > 0
      ? variants.find((v) => Object.values(selections).includes(v.id))
      : undefined;

  const effectivePrice = product.price + (selectedVariant?.priceDiff ?? 0);
  const outOfStock = selectedVariant ? selectedVariant.stock <= 0 : false;
  const variantLabel = selectedVariant
    ? `${selectedVariant.name}: ${selectedVariant.value}`
    : undefined;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantLabel,
      price: effectivePrice,
      quantity,
      imageUrl: product.imageUrl,
    });
  };

  const [added, setAdded] = useState(false);

  const handleClick = () => {
    handleAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-6">
      <p className="text-2xl font-bold">{formatPrice(effectivePrice)}</p>

      {groupNames.map((groupName) => (
        <div key={groupName}>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {groupName}
          </label>
          <div className="flex flex-wrap gap-2">
            {groups[groupName].map((v) => (
              <button
                key={v.id}
                onClick={() =>
                  setSelections((prev) => ({ ...prev, [groupName]: v.id }))
                }
                className={`rounded-md border px-4 py-2 text-sm transition ${
                  selections[groupName] === v.id
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                } ${v.stock <= 0 ? "opacity-50 line-through" : ""}`}
                disabled={v.stock <= 0}
              >
                {v.value}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-md border border-gray-300">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-gray-600 hover:text-gray-900"
          >
            -
          </button>
          <span className="px-3 py-2 text-sm">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-2 text-gray-600 hover:text-gray-900"
          >
            +
          </button>
        </div>
        <button
          onClick={handleClick}
          disabled={outOfStock}
          className="flex-1 rounded-md bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outOfStock ? "Out of Stock" : added ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
