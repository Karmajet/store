import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { calculateShipping, type ShippingMethod } from "@/lib/shipping";
import { calculateTax } from "@/lib/tax";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id || null;

    const body = await request.json();
    const { items, shipping, couponCode, shippingMethod: shpMethod } = body;
    const shippingMethod: ShippingMethod = shpMethod || "standard";

    if (!items?.length || !shipping?.email) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Look up real prices from DB — never trust client
    const lineItems = [];
    let subtotal = 0;
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
        if (variant.stock < item.quantity) {
          return NextResponse.json(
            {
              error: `${product.name} (${variant.name}: ${variant.value}) only has ${variant.stock} in stock`,
            },
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

      subtotal += unitPrice * item.quantity;
      orderItems.push({
        productId: product.id,
        variantId,
        quantity: item.quantity,
        unitPrice,
      });
    }

    // Validate and apply coupon server-side
    let couponId: string | null = null;
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (!coupon || !coupon.active) {
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      }
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
      }
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
      }
      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        return NextResponse.json({ error: "Order does not meet minimum for coupon" }, { status: 400 });
      }

      if (coupon.type === "percentage") {
        discountAmount = Math.round(subtotal * (coupon.value / 100));
      } else {
        discountAmount = Math.min(coupon.value, subtotal);
      }
      couponId = coupon.id;

      // Add discount as a negative line item in Stripe
      if (discountAmount > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Discount (${coupon.code})`,
            },
            unit_amount: -discountAmount,
          },
          quantity: 1,
        });
      }
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const shippingCost = calculateShipping(subtotal, shippingMethod);
    const taxAmount = calculateTax(subtotalAfterDiscount, shipping.state || "");
    const totalAmount = subtotalAfterDiscount + shippingCost + taxAmount;

    // Add shipping as a line item
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping" },
          unit_amount: shippingCost,
        },
        quantity: 1,
      });
    }

    // Add tax as a line item
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Tax" },
          unit_amount: taxAmount,
        },
        quantity: 1,
      });
    }

    // Derive base URL from request headers
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    // Create Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: shipping.email,
      success_url: `${baseUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
    });

    // Create order in DB
    await prisma.order.create({
      data: {
        stripeSessionId: stripeSession.id,
        email: shipping.email,
        userId,
        couponId,
        discountAmount,
        subtotalAmount: subtotal,
        shippingMethod,
        shippingCost,
        taxAmount,
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

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
