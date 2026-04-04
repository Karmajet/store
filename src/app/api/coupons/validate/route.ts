import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { code, subtotal } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
  }

  if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
    return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
  }

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    const min = (coupon.minOrderAmount / 100).toFixed(2);
    return NextResponse.json(
      { error: `Minimum order of $${min} required for this coupon` },
      { status: 400 }
    );
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round(subtotal * (coupon.value / 100));
  } else {
    discount = Math.min(coupon.value, subtotal); // can't discount more than subtotal
  }

  return NextResponse.json({
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
  });
}
