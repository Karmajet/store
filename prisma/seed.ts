import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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

  // Create products
  const products = [
    {
      name: "Classic T-Shirt",
      slug: "classic-t-shirt",
      description:
        "A comfortable everyday cotton t-shirt with a classic fit. Pre-shrunk fabric for lasting wear.",
      price: 2999,
      imageUrl: "https://picsum.photos/seed/tshirt/600/600",
      variants: [
        { name: "Size", value: "Small", sku: "TSH-S", stock: 25, priceDiff: 0 },
        { name: "Size", value: "Medium", sku: "TSH-M", stock: 50, priceDiff: 0 },
        { name: "Size", value: "Large", sku: "TSH-L", stock: 30, priceDiff: 0 },
        { name: "Size", value: "XL", sku: "TSH-XL", stock: 15, priceDiff: 200 },
      ],
    },
    {
      name: "Denim Jacket",
      slug: "denim-jacket",
      description:
        "Rugged denim jacket with a modern slim fit. Perfect for layering in any season.",
      price: 8999,
      imageUrl: "https://picsum.photos/seed/denim/600/600",
      variants: [
        { name: "Size", value: "Small", sku: "DNM-S", stock: 10, priceDiff: 0 },
        { name: "Size", value: "Medium", sku: "DNM-M", stock: 20, priceDiff: 0 },
        { name: "Size", value: "Large", sku: "DNM-L", stock: 15, priceDiff: 0 },
      ],
    },
    {
      name: "Running Sneakers",
      slug: "running-sneakers",
      description:
        "Lightweight mesh sneakers with responsive cushioning. Great for daily runs or casual wear.",
      price: 12999,
      imageUrl: "https://picsum.photos/seed/sneakers/600/600",
      variants: [
        { name: "Size", value: "8", sku: "SNK-8", stock: 12, priceDiff: 0 },
        { name: "Size", value: "9", sku: "SNK-9", stock: 18, priceDiff: 0 },
        { name: "Size", value: "10", sku: "SNK-10", stock: 20, priceDiff: 0 },
        { name: "Size", value: "11", sku: "SNK-11", stock: 8, priceDiff: 0 },
        { name: "Size", value: "12", sku: "SNK-12", stock: 5, priceDiff: 500 },
      ],
    },
    {
      name: "Leather Belt",
      slug: "leather-belt",
      description:
        "Genuine leather belt with a brushed nickel buckle. A timeless accessory for any outfit.",
      price: 4500,
      imageUrl: "https://picsum.photos/seed/belt/600/600",
      variants: [
        { name: "Color", value: "Brown", sku: "BLT-BRN", stock: 30, priceDiff: 0 },
        { name: "Color", value: "Black", sku: "BLT-BLK", stock: 25, priceDiff: 0 },
      ],
    },
    {
      name: "Canvas Backpack",
      slug: "canvas-backpack",
      description:
        "Durable canvas backpack with padded laptop compartment and multiple pockets.",
      price: 5999,
      imageUrl: "https://picsum.photos/seed/backpack/600/600",
      variants: [
        { name: "Color", value: "Navy", sku: "BAG-NVY", stock: 20, priceDiff: 0 },
        { name: "Color", value: "Olive", sku: "BAG-OLV", stock: 15, priceDiff: 0 },
        { name: "Color", value: "Gray", sku: "BAG-GRY", stock: 10, priceDiff: 0 },
      ],
    },
    {
      name: "Wool Beanie",
      slug: "wool-beanie",
      description:
        "Soft merino wool beanie. Warm, breathable, and perfect for cold weather.",
      price: 1999,
      imageUrl: "https://picsum.photos/seed/beanie/600/600",
      variants: [
        { name: "Color", value: "Charcoal", sku: "BNE-CHR", stock: 40, priceDiff: 0 },
        { name: "Color", value: "Burgundy", sku: "BNE-BRG", stock: 35, priceDiff: 0 },
        { name: "Color", value: "Forest Green", sku: "BNE-GRN", stock: 25, priceDiff: 0 },
      ],
    },
  ];

  for (const p of products) {
    const { variants, ...productData } = p;
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        variants: {
          create: variants,
        },
      },
    });
  }

  console.log("Seed complete: admin user + 6 products");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
