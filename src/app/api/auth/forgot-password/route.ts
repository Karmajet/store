import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const resetToken = randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: "CF Store <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password",
      html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="background: #000; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">CF</h1>
      </div>
      <div style="padding: 30px;">
        <p style="margin: 0 0 20px; font-size: 16px; color: #333;">
          We received a request to reset your password.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #000; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Reset Password
        </a>
        <p style="margin: 20px 0 0; font-size: 12px; color: #999;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
    });
  } catch {
    console.error("Failed to send reset email");
  }

  return NextResponse.json({ ok: true });
}
