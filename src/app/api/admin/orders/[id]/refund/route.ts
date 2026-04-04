import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!order.stripePaymentId) {
    return NextResponse.json({ error: "No payment to refund" }, { status: 400 });
  }
  if (order.status === "refunded") {
    return NextResponse.json({ error: "Order already refunded" }, { status: 400 });
  }

  try {
    await stripe.refunds.create({
      payment_intent: order.stripePaymentId,
    });

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "refunded", cancelledAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refund failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
