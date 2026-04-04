"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  weekRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: {
    id: string;
    email: string;
    totalAmount: number;
    createdAt: string;
  }[];
  topProducts: { name: string; quantity: number }[];
  dailyRevenue: { date: string; revenue: number; orders: number }[];
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading || !data)
    return <p className="text-gray-500">Loading analytics...</p>;

  const chartData = data.dailyRevenue.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: d.revenue / 100,
    orders: d.orders,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <a
          href="/api/admin/orders/export"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Export Orders CSV
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Today's Revenue", value: formatPrice(data.todayRevenue) },
          { label: "Today's Orders", value: data.todayOrders.toString() },
          { label: "This Week", value: formatPrice(data.weekRevenue) },
          { label: "All Time Revenue", value: formatPrice(data.totalRevenue) },
          { label: "Total Orders", value: data.totalOrders.toString() },
          { label: "Customers", value: data.totalCustomers.toString() },
          { label: "Products", value: data.totalProducts.toString() },
          {
            label: "Avg Order Value",
            value:
              data.totalOrders > 0
                ? formatPrice(Math.round(data.totalRevenue / data.totalOrders))
                : "$0.00",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-medium text-gray-900">
          Revenue (Last 30 Days)
        </h2>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No revenue data yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#000"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-medium text-gray-900">Top Products</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data.topProducts}
                layout="vertical"
                margin={{ left: 80 }}
              >
                <XAxis type="number" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  fontSize={12}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="quantity" fill="#000" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-medium text-gray-900">Recent Orders</h2>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.email}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-medium">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
