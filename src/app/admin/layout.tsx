"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <aside className="w-56 border-r border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Admin</h2>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm ${
                pathname === item.href
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="mt-8 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Sign Out
        </button>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
