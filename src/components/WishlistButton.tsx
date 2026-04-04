"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";

export default function WishlistButton({
  productId,
  initialWishlisted = false,
}: {
  productId: string;
  initialWishlisted?: boolean;
}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!session) {
      toast("Sign in to save items", "info");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await res.json();
    setWishlisted(data.wishlisted);
    toast(data.wishlisted ? "Added to wishlist" : "Removed from wishlist");
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="rounded-full p-2 transition hover:bg-gray-100"
      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={wishlisted ? 0 : 1.5}
        className={`h-6 w-6 ${wishlisted ? "text-red-500" : "text-gray-400"}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
    </button>
  );
}
