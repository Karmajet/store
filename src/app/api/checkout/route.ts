import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shipping } = body;

    if (!items?.length || !shipping?.email) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Look up real prices from DB — never trust client
    const lineItems = [];
    let totalAmount = 0;
    const orderItems: {
      productId: string;
      variantId: string | null;
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      let unitPrice = product.price;
      let variantId: string | null = null;
      let variantLabel = "";

      if (item.variantId) {
        const variant = await prisma.variant.findUnique({
          where: { id: item.variantId },
        });
        if (!variant) {
          return NextResponse.json(
            { error: `Variant not found: ${item.variantId}` },
            { status: 400 }
          );
        }
        unitPrice += variant.priceDiff;
        variantId = variant.id;
        variantLabel = ` (${variant.name}: ${variant.value})`;
      }

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${product.name}${variantLabel}`,
          },
          unit_amount: unitPrice,
        },
        quantity: item.quantity,
      });

      totalAmount += unitPrice * item.quantity;
      orderItems.push({
        productId: product.id,
        variantId,
        quantity: item.quantity,
        unitPrice,
      });
    }

    // Derive base URL from request headers (works on Vercel and localhost)
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: shipping.email,
      success_url: `${baseUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
    });

    // Create order in DB
    await prisma.order.create({
      data: {
        stripeSessionId: session.id,
        email: shipping.email,
        shippingName: shipping.name,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingState: shipping.state,
        shippingZip: shipping.zip,
        shippingCountry: shipping.country,
        totalAmount,
        items: {
          create: orderItems,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
