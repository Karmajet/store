import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

interface Props {
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
}

export default function ProductCard({ slug, name, price, imageUrl }: Props) {
  return (
    <Link
      href={`/products/${slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900">{name}</h3>
        <p className="mt-1 text-gray-600">{formatPrice(price)}</p>
      </div>
    </Link>
  );
}
