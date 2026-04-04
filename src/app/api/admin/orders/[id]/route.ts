import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendShippingNotification } from "@/lib/email";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
  failed: [],
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, trackingNumber, notes } = body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Validate status transition
  if (status && status !== order.status) {
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from "${order.status}" to "${status}"` },
        { status: 400 }
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber;
  if (notes !== undefined) data.notes = notes;

  // Set timestamps based on status
  if (status === "shipped") data.shippedAt = new Date();
  if (status === "delivered") data.deliveredAt = new Date();
  if (status === "cancelled") data.cancelledAt = new Date();

  const updatedOrder = await prisma.order.update({
    where: { id },
    data,
    include: {
      items: { include: { product: true, variant: true } },
    },
  });

  // Send shipping notification email when:
  // 1. Status just changed to "shipped", or
  // 2. Tracking number was added/updated on an already-shipped order
  const justShipped = status === "shipped";
  const trackingUpdated =
    trackingNumber &&
    trackingNumber !== order.trackingNumber &&
    (updatedOrder.status === "shipped" || updatedOrder.status === "delivered");

  if ((justShipped || trackingUpdated) && updatedOrder.trackingNumber) {
    await sendShippingNotification(updatedOrder, updatedOrder.trackingNumber);
  }

  return NextResponse.json(updatedOrder);
}
