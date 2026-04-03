import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const variant = await prisma.variant.create({
    data: {
      productId: id,
      name: body.name,
      value: body.value,
      sku: body.sku,
      stock: body.stock ?? 0,
      priceDiff: body.priceDiff ?? 0,
    },
  });

  return NextResponse.json(variant);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await params; // consume the promise
  const variantId = request.nextUrl.searchParams.get("variantId");
  if (!variantId) {
    return NextResponse.json({ error: "Missing variantId" }, { status: 400 });
  }

  await prisma.variant.delete({ where: { id: variantId } });
  return NextResponse.json({ ok: true });
}
