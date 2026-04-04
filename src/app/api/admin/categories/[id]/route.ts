import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const category = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description || null,
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Set products in this category to null instead of deleting them
  await prisma.product.updateMany({
    where: { categoryId: id },
    data: { categoryId: null },
  });
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
