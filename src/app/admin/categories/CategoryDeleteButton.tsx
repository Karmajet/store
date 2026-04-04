"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CategoryDeleteButton({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this category? Products in it will become uncategorized.")) return;
    setLoading(true);
    await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  };

  return (
    <button onClick={handleDelete} disabled={loading} className="ml-3 text-sm text-red-600 hover:text-red-800">
      Delete
    </button>
  );
}
