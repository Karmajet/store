import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    include: {
      items: { include: { product: true, variant: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Order ID",
    "Date",
    "Status",
    "Email",
    "Name",
    "Address",
    "City",
    "State",
    "ZIP",
    "Country",
    "Items",
    "Subtotal",
    "Discount",
    "Shipping",
    "Tax",
    "Total",
  ];

  const rows = orders.map((o) => [
    o.id,
    new Date(o.createdAt).toISOString(),
    o.status,
    o.email,
    o.shippingName,
    o.shippingAddress,
    o.shippingCity,
    o.shippingState,
    o.shippingZip,
    o.shippingCountry,
    o.items
      .map(
        (i) =>
          `${i.product.name}${i.variant ? ` (${i.variant.value})` : ""} x${i.quantity}`
      )
      .join("; "),
    (o.subtotalAmount / 100).toFixed(2),
    (o.discountAmount / 100).toFixed(2),
    (o.shippingCost / 100).toFixed(2),
    (o.taxAmount / 100).toFixed(2),
    (o.totalAmount / 100).toFixed(2),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
