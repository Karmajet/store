import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderReceipt } from "@/lib/email";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Atomically update order status AND decrement stock
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { stripeSessionId: session.id },
        data: {
          status: "paid",
          stripePaymentId: session.payment_intent as string,
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      // Decrement stock for each item's variant
      for (const item of updatedOrder.items) {
        if (item.variantId) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return updatedOrder;
    });

    // Send receipt email (don't fail the webhook if email fails)
    await sendOrderReceipt(order);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await prisma.order.update({
      where: { stripeSessionId: session.id },
      data: { status: "failed" },
    });
  }

  return NextResponse.json({ received: true });
}
