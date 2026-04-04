import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return NextResponse.json({ reviews, avgRating, count: reviews.length });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { slug } = await params;
  const { rating, title, body } = await request.json();

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  // Check if user already reviewed this product
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId: product.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already reviewed this product" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      userId,
      productId: product.id,
      rating,
      title: title || "",
      body: body || "",
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(review);
}
