import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CategoryNav({
  activeCategory,
}: {
  activeCategory?: string;
}) {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/"
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
          !activeCategory
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/?category=${cat.slug}`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            activeCategory === cat.slug
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
