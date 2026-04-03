import { test, expect } from "@playwright/test";

test.describe("Store - Product Catalog", () => {
  test("homepage shows products", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Products");
    // Should have 6 product cards
    const cards = page.locator('a[href^="/products/"]');
    await expect(cards).toHaveCount(6);
  });

  test("product detail page shows variants", async ({ page }) => {
    await page.goto("/products/classic-t-shirt");
    await expect(page.locator("h1")).toHaveText("Classic T-Shirt");
    // Should show size variants
    await expect(page.getByRole("button", { name: "Small" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Medium" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Large" })).toBeVisible();
    await expect(page.getByRole("button", { name: "XL" })).toBeVisible();
    // Should show price
    await expect(page.getByText("$29.99")).toBeVisible();
    // Should show Add to Cart
    await expect(
      page.getByRole("button", { name: "Add to Cart" })
    ).toBeVisible();
  });

  test("selecting XL variant shows updated price", async ({ page }) => {
    await page.goto("/products/classic-t-shirt");
    await page.getByRole("button", { name: "XL" }).click();
    // XL has +$2.00 price diff, so $31.99
    await expect(page.getByText("$31.99")).toBeVisible();
  });
});

test.describe("Store - Shopping Cart", () => {
  test("add item to cart and view cart", async ({ page }) => {
    await page.goto("/products/classic-t-shirt");
    await page.getByRole("button", { name: "Add to Cart" }).click();
    // Button should show "Added!"
    await expect(page.getByRole("button", { name: "Added!" })).toBeVisible();

    // Navigate to cart
    await page.goto("/cart");
    await expect(page.locator("h1")).toHaveText("Your Cart");
    await expect(page.getByText("Classic T-Shirt")).toBeVisible();
    // Verify total shows
    await expect(page.getByText("Total")).toBeVisible();
  });

  test("empty cart shows message", async ({ page }) => {
    // Clear localStorage first
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("cart"));
    await page.goto("/cart");
    await expect(page.getByText("Your cart is empty")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continue Shopping" })
    ).toBeVisible();
  });

  test("can update quantity and remove items", async ({ page }) => {
    // Add item first
    await page.goto("/products/leather-belt");
    await page.getByRole("button", { name: "Add to Cart" }).click();
    await page.goto("/cart");

    // Increase quantity
    await page.getByRole("button", { name: "+" }).click();
    // Quantity should show 2 in the cart item row
    await expect(page.locator("main").getByText("2", { exact: true })).toBeVisible();

    // Remove item
    await page.getByText("Remove").click();
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });
});

test.describe("Store - Checkout Flow", () => {
  test("checkout page shows shipping form", async ({ page }) => {
    // Add item to cart first
    await page.goto("/products/canvas-backpack");
    await page.getByRole("button", { name: "Add to Cart" }).click();

    // Go to checkout
    await page.goto("/cart");
    await page.getByRole("link", { name: "Proceed to Checkout" }).click();
    await page.waitForURL("**/checkout");
    await expect(page.locator("h1")).toHaveText("Checkout");
    await expect(page.getByText("Shipping Information")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue to Payment" })
    ).toBeVisible();
  });
});

test.describe("Store - Admin", () => {
  test("admin redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.url()).toContain("/admin/login");
    await expect(page.locator("h1")).toHaveText("Admin Login");
  });

  test("admin login with valid credentials", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill('input[type="email"]', "admin@store.com");
    await page.fill('input[type="password"]', "admin123");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should redirect to admin dashboard
    await page.waitForURL("/admin");
    await expect(page.locator("h1")).toHaveText("Dashboard");
    await expect(page.getByText("Total Orders")).toBeVisible();
    await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
  });

  test("admin login with invalid credentials shows error", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.fill('input[type="email"]', "admin@store.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("admin products page shows all products", async ({ page }) => {
    // Login first
    await page.goto("/admin/login");
    await page.fill('input[type="email"]', "admin@store.com");
    await page.fill('input[type="password"]', "admin123");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("/admin");

    // Navigate to products
    await page.getByRole("link", { name: "Products" }).click();
    await expect(page.locator("h1")).toHaveText("Products");
    await expect(page.getByText("Classic T-Shirt")).toBeVisible();
    await expect(page.getByText("Denim Jacket")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Add Product" })
    ).toBeVisible();
  });

  test("admin orders page loads", async ({ page }) => {
    // Login first
    await page.goto("/admin/login");
    await page.fill('input[type="email"]', "admin@store.com");
    await page.fill('input[type="password"]', "admin123");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("/admin");

    // Navigate to orders
    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page.locator("h1")).toHaveText("Orders");
    await expect(page.getByText("No orders yet")).toBeVisible();
  });
});
