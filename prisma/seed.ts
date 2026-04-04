import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.upsert({
    where: { email: "admin@store.com" },
    update: {},
    create: {
      email: "admin@store.com",
      name: "Admin",
      passwordHash,
    },
  });

  // Create CF products
  const products = [
    {
      name: "CF Court Tee - White",
      slug: "cf-court-tee-white",
      description:
        "Premium white t-shirt featuring the CF logo with tennis court outline. Clean design for on and off the court.",
      price: 3499,
      imageUrl: "/images/cf-court-tee-white.png",
      variants: [
        { name: "Size", value: "S", sku: "CF-CTW-S", stock: 25, priceDiff: 0 },
        { name: "Size", value: "M", sku: "CF-CTW-M", stock: 50, priceDiff: 0 },
        { name: "Size", value: "L", sku: "CF-CTW-L", stock: 30, priceDiff: 0 },
        { name: "Size", value: "XL", sku: "CF-CTW-XL", stock: 15, priceDiff: 200 },
      ],
    },
    {
      name: "CF Logo Tee",
      slug: "cf-logo-tee",
      description:
        "Classic white tee with the CF logo center chest. Minimal, versatile, and built for comfort.",
      price: 2999,
      imageUrl: "/images/cf-logo-tee-white.png",
      variants: [
        { name: "Size", value: "S", sku: "CF-LT-S", stock: 20, priceDiff: 0 },
        { name: "Size", value: "M", sku: "CF-LT-M", stock: 40, priceDiff: 0 },
        { name: "Size", value: "L", sku: "CF-LT-L", stock: 35, priceDiff: 0 },
        { name: "Size", value: "XL", sku: "CF-LT-XL", stock: 10, priceDiff: 200 },
      ],
    },
    {
      name: "Just Watch Tee",
      slug: "just-watch-tee",
      description:
        'Statement tee with the "Just Watch" tennis player graphic. Bold design for those who let their game do the talking.',
      price: 3499,
      imageUrl: "/images/cf-just-watch-tee.png",
      variants: [
        { name: "Size", value: "S", sku: "CF-JW-S", stock: 15, priceDiff: 0 },
        { name: "Size", value: "M", sku: "CF-JW-M", stock: 30, priceDiff: 0 },
        { name: "Size", value: "L", sku: "CF-JW-L", stock: 25, priceDiff: 0 },
        { name: "Size", value: "XL", sku: "CF-JW-XL", stock: 10, priceDiff: 200 },
      ],
    },
    {
      name: "CF Court Tee - Black",
      slug: "cf-court-tee-black",
      description:
        "Premium black t-shirt with the CF logo and court outline in white. A staple for any tennis wardrobe.",
      price: 3499,
      imageUrl: "/images/cf-court-tee-black.png",
      variants: [
        { name: "Size", value: "S", sku: "CF-CTB-S", stock: 20, priceDiff: 0 },
        { name: "Size", value: "M", sku: "CF-CTB-M", stock: 45, priceDiff: 0 },
        { name: "Size", value: "L", sku: "CF-CTB-L", stock: 30, priceDiff: 0 },
        { name: "Size", value: "XL", sku: "CF-CTB-XL", stock: 12, priceDiff: 200 },
      ],
    },
    {
      name: "CF Snapback",
      slug: "cf-snapback",
      description:
        "White and black snapback cap with the embroidered CF logo. Adjustable fit, perfect for match day or everyday.",
      price: 2499,
      imageUrl: "/images/cf-snapback.png",
      variants: [
        { name: "Size", value: "One Size", sku: "CF-SNAP-OS", stock: 50, priceDiff: 0 },
      ],
    },
  ];

  for (const p of products) {
    const { variants, ...productData } = p;
    await prisma.product.create({
      data: {
        ...productData,
        variants: {
          create: variants,
        },
      },
    });
  }

  console.log("Seed complete: admin user + 5 CF products");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
