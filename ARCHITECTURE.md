# CF Store — Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          STOREFRONT (Next.js 16)                        │
│                                                                         │
│  ┌──────────┐  ┌───────────┐  ┌────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Homepage  │  │ Product   │  │  Cart  │  │ Checkout │  │  Order    │ │
│  │ /         │→ │ /[slug]   │→ │ /cart  │→ │ /checkout│→ │  Confirm  │ │
│  │ Search    │  │ Variants  │  │ Items  │  │ Shipping │  │  Receipt  │ │
│  │ Filter    │  │ Reviews   │  │ Qty    │  │ Coupons  │  │           │ │
│  │ Sort      │  │ Wishlist  │  │ Remove │  │ Tax      │  │           │ │
│  │ Paginate  │  │ Related   │  │        │  │ Summary  │  │           │ │
│  └──────────┘  └───────────┘  └────────┘  └──────────┘  └───────────┘ │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐             │
│  │ Login    │  │ Register │  │ Account                   │             │
│  │ /login   │  │ /register│  │ /account                  │             │
│  │ Forgot   │  │          │  │ • Order history            │             │
│  │ Reset    │  │          │  │ • Addresses                │             │
│  └──────────┘  └──────────┘  │ • Wishlist                 │             │
│                               └──────────────────────────┘             │
└────────────────────────────────────────┬────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js Route Handlers)                 │
│                                                                         │
│  PUBLIC                              ADMIN (role-protected)             │
│  ┌────────────────────────┐         ┌────────────────────────────┐     │
│  │ POST /api/checkout     │         │ CRUD /api/admin/products   │     │
│  │ POST /api/register     │         │ CRUD /api/admin/categories │     │
│  │ GET  /api/order        │         │ CRUD /api/admin/coupons    │     │
│  │ POST /api/auth/*       │         │ PUT  /api/admin/orders/[id]│     │
│  │ POST /api/coupons/     │         │ POST /api/admin/orders/    │     │
│  │      validate          │         │      [id]/refund           │     │
│  │ CRUD /api/wishlist     │         │ GET  /api/admin/analytics  │     │
│  │ CRUD /api/addresses    │         │ GET  /api/admin/orders/    │     │
│  │ GET/POST /api/products/│         │      export (CSV)          │     │
│  │      [slug]/reviews    │         │ CRUD /api/admin/products/  │     │
│  │ POST /api/auth/        │         │      [id]/variants         │     │
│  │      forgot-password   │         └────────────────────────────┘     │
│  │ POST /api/auth/        │                                            │
│  │      reset-password    │         WEBHOOK                            │
│  │ PUT  /api/account/     │         ┌────────────────────────────┐     │
│  │      profile           │         │ POST /api/webhooks/stripe  │     │
│  └────────────────────────┘         │ • Mark order paid          │     │
│                                      │ • Decrement stock ($txn)  │     │
│                                      │ • Increment coupon uses   │     │
│                                      │ • Send receipt email      │     │
│                                      └────────────────────────────┘     │
└──────────────────────────┬──────────────────────┬───────────────────────┘
                           │                      │
                           ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│     STRIPE       │   │  NEON POSTGRES   │   │     RESEND       │
│                  │   │                  │   │                  │
│ • Checkout       │   │ • Product        │   │ • Order receipts │
│   Sessions       │   │ • Variant        │   │ • Shipping       │
│ • Payments       │   │ • Category       │   │   notifications  │
│ • Webhooks       │   │ • Order          │   │ • Password reset │
│ • Refunds        │   │ • OrderItem      │   │   emails         │
│                  │   │ • User           │   │                  │
└──────────────────┘   │ • AdminUser      │   └──────────────────┘
                       │ • Coupon         │
                       │ • Wishlist       │
                       │ • Review         │
                       │ • Address        │
                       └──────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          ADMIN DASHBOARD                                │
│                                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐           │
│  │ Dashboard │  │ Analytics │  │ Products  │  │Categories │           │
│  │ /admin    │  │ Revenue   │  │ CRUD      │  │ CRUD      │           │
│  │ Stats     │  │ Charts    │  │ Variants  │  │           │           │
│  │           │  │ Top Items │  │ Stock     │  │           │           │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘           │
│                                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                          │
│  │ Coupons   │  │  Orders   │  │ Customers │                          │
│  │ CRUD      │  │ Status    │  │ List      │                          │
│  │ %/$ off   │  │ Tracking  │  │ Spend     │                          │
│  │ Limits    │  │ Refunds   │  │ Orders    │                          │
│  │ Expiry    │  │ CSV Export│  │           │                          │
│  └───────────┘  └───────────┘  └───────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          INFRASTRUCTURE                                 │
│                                                                         │
│  Vercel (Hosting)       GitHub (Code)       NextAuth (Auth)             │
│  • Auto-deploy on push  • Karmajet/store    • JWT sessions              │
│  • Serverless fns       • Main branch       • Customer + Admin roles    │
│  • Edge network         • Auto CI/CD        • Credentials provider      │
│                                                                         │
│  Client State                          Middleware (proxy.ts)            │
│  • Cart → localStorage + Context      • /admin/* → admin role only     │
│  • Auth → NextAuth SessionProvider     • /account/* → any auth user    │
│  • Toasts → ToastContext                                                │
└─────────────────────────────────────────────────────────────────────────┘


DATA FLOW: Purchase
═══════════════════

 Customer                    Server                    Stripe              DB
    │                          │                         │                  │
    │── Add to Cart ──────────►│ (localStorage)          │                  │
    │                          │                         │                  │
    │── Select Shipping ──────►│                         │                  │
    │── Apply Coupon ─────────►│── Validate coupon ──────┼─── Query ───────►│
    │◄── Discount amount ──────│◄────────────────────────┼──────────────────│
    │── Fill Shipping Form ───►│                         │                  │
    │── Submit Checkout ──────►│                         │                  │
    │                          │── Validate prices ──────┼─── Query ───────►│
    │                          │── Check stock ──────────┼─── Query ───────►│
    │                          │── Calc shipping + tax ──│                  │
    │                          │── Re-validate coupon ───┼─── Query ───────►│
    │                          │                         │                  │
    │                          │── Create Order ─────────┼─── Insert ──────►│
    │                          │── Create Session ──────►│                  │
    │                          │◄── Session URL ─────────│                  │
    │◄── Redirect to Stripe ───│                         │                  │
    │                          │                         │                  │
    │── Pay on Stripe ─────────┼────────────────────────►│                  │
    │                          │                         │                  │
    │                          │◄── Webhook: paid ───────│                  │
    │                          │── $transaction: ────────┼──────────────────│
    │                          │   • Update status ──────┼─── Update ──────►│
    │                          │   • Decrement stock ────┼─── Update ──────►│
    │                          │   • Increment coupon ───┼─── Update ──────►│
    │                          │── Send receipt ─────────┼──► Resend        │
    │                          │                         │                  │
    │◄── Redirect to confirm ──│                         │                  │
    │── Fetch order ──────────►│── Query ────────────────┼─────────────────►│
    │◄── Order details ────────│◄────────────────────────┼──────────────────│


DATA FLOW: Order Fulfillment (Admin)
════════════════════════════════════

 Admin                       Server                    Stripe           Email
    │                          │                         │                │
    │── Update status ────────►│                         │                │
    │   (processing/shipped)   │── Update order ─────────┼── DB Update ──►│
    │── Add tracking # ───────►│                         │                │
    │                          │── Send shipping email ──┼───────────────►│
    │                          │                         │                │
    │── Issue refund ─────────►│── Create refund ───────►│                │
    │                          │── Update status ────────┼── DB Update ──►│
    │◄── Refund confirmed ─────│◄── Refund success ──────│                │
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (Neon, via Vercel Marketplace) |
| ORM | Prisma 6 |
| Auth | NextAuth.js 4 (JWT, credentials, dual-role) |
| Payments | Stripe (Checkout Sessions, Webhooks, Refunds) |
| Email | Resend (receipts, shipping, password reset) |
| Charts | Recharts |
| Hosting | Vercel (auto-deploy from GitHub) |
| Repo | github.com/Karmajet/store |

## Database Models (11)

| Model | Purpose |
|-------|---------|
| Product | Catalog items with price, description, image |
| Variant | Size/color options with stock and price diffs |
| Category | Product grouping (Tees, Accessories) |
| Order | Purchase records with full shipping/billing breakdown |
| OrderItem | Line items with price snapshot |
| User | Customer accounts |
| AdminUser | Admin accounts (separate table) |
| Coupon | Discount codes (%, $, limits, expiry) |
| Wishlist | Saved products per user |
| Review | Star ratings + text per user per product |
| Address | Saved shipping addresses per user |
