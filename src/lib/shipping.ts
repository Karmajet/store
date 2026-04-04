export type ShippingMethod = "free" | "standard" | "express";

export interface ShippingOption {
  id: ShippingMethod;
  name: string;
  description: string;
  cost: number; // cents
  estimatedDays: string;
}

const FREE_SHIPPING_THRESHOLD = 10000; // $100 in cents

export function getShippingOptions(subtotal: number): ShippingOption[] {
  const options: ShippingOption[] = [];

  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    options.push({
      id: "free",
      name: "Free Shipping",
      description: "Standard delivery",
      cost: 0,
      estimatedDays: "5-7 business days",
    });
  }

  options.push({
    id: "standard",
    name: "Standard",
    description: "USPS Ground",
    cost: 599,
    estimatedDays: "5-7 business days",
  });

  options.push({
    id: "express",
    name: "Express",
    description: "USPS Priority",
    cost: 1499,
    estimatedDays: "2-3 business days",
  });

  return options;
}

export function calculateShipping(
  subtotal: number,
  method: ShippingMethod
): number {
  if (method === "free" && subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  if (method === "standard") return 599;
  if (method === "express") return 1499;
  return 599; // default to standard
}
