import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 86400000);
  const thisMonth = new Date(today.getTime() - 30 * 86400000);

  const [
    totalOrders,
    totalRevenue,
    todayOrders,
    todayRevenue,
    weekRevenue,
    totalCustomers,
    totalProducts,
    recentOrders,
    topProducts,
    dailyRevenue,
  ] = await Promise.all([
    prisma.order.count({ where: { status: "paid" } }),
    prisma.order.aggregate({ where: { status: "paid" }, _sum: { totalAmount: true } }),
    prisma.order.count({ where: { status: "paid", createdAt: { gte: today } } }),
    prisma.order.aggregate({ where: { status: "paid", createdAt: { gte: today } }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({ where: { status: "paid", createdAt: { gte: thisWeek } }, _sum: { totalAmount: true } }),
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.findMany({
      where: { status: "paid" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, totalAmount: true, createdAt: true },
    }),
    // Top products by quantity sold
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: "paid" } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    // Daily revenue for last 30 days
    prisma.$queryRaw<{ date: Date; revenue: bigint; orders: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt") as date,
             SUM("totalAmount") as revenue,
             COUNT(*) as orders
      FROM "Order"
      WHERE status = 'paid' AND "createdAt" >= ${thisMonth}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,
  ]);

  // Resolve product names for top products
  const topProductIds = topProducts.map((tp) => tp.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  return NextResponse.json({
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    todayOrders,
    todayRevenue: todayRevenue._sum.totalAmount ?? 0,
    weekRevenue: weekRevenue._sum.totalAmount ?? 0,
    totalCustomers,
    totalProducts,
    recentOrders,
    topProducts: topProducts.map((tp) => ({
      name: productMap.get(tp.productId) || "Unknown",
      quantity: tp._sum.quantity ?? 0,
    })),
    dailyRevenue: dailyRevenue.map((d) => ({
      date: d.date,
      revenue: Number(d.revenue),
      orders: Number(d.orders),
    })),
  });
}
