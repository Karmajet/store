"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductDeleteButton({
  productId,
}: {
  productId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setLoading(true);
    await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="ml-3 text-sm text-red-600 hover:text-red-800"
    >
      Delete
    </button>
  );
}
