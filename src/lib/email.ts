import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderItem {
  quantity: number;
  unitPrice: number;
  product: { name: string };
  variant: { name: string; value: string } | null;
}

interface OrderData {
  id: string;
  email: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  totalAmount: number;
  createdAt: Date;
  items: OrderItem[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function buildReceiptHtml(order: OrderData): string {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <strong>${item.product.name}</strong>
          ${item.variant ? `<br><span style="color: #666; font-size: 14px;">${item.variant.name}: ${item.variant.value}</span>` : ""}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.unitPrice * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background: #000; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">CF</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.8;">Order Confirmation</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <p style="margin: 0 0 20px; font-size: 16px; color: #333;">
          Thanks for your order, ${order.shippingName}!
        </p>
        <p style="margin: 0 0 30px; font-size: 14px; color: #666;">
          Order placed on ${new Date(order.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>

        <!-- Items -->
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #000;">
              <th style="padding: 8px 0; text-align: left;">Item</th>
              <th style="padding: 8px 0; text-align: center;">Qty</th>
              <th style="padding: 8px 0; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <!-- Total -->
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #000; text-align: right;">
          <span style="font-size: 18px; font-weight: bold;">Total: ${formatPrice(order.totalAmount)}</span>
        </div>

        <!-- Shipping -->
        <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 6px;">
          <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #333;">Shipping Address</h3>
          <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
            ${order.shippingName}<br>
            ${order.shippingAddress}<br>
            ${order.shippingCity}, ${order.shippingState} ${order.shippingZip}<br>
            ${order.shippingCountry}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 20px 30px; background: #f9f9f9; text-align: center; font-size: 12px; color: #999;">
        <p style="margin: 0;">Thank you for shopping with CF</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendOrderReceipt(order: OrderData) {
  try {
    const { error } = await resend.emails.send({
      from: "CF Store <onboarding@resend.dev>",
      to: order.email,
      subject: `Order Confirmation - ${formatPrice(order.totalAmount)}`,
      html: buildReceiptHtml(order),
    });

    if (error) {
      console.error("Failed to send receipt email:", error);
    }
  } catch (err) {
    console.error("Error sending receipt email:", err);
  }
}
