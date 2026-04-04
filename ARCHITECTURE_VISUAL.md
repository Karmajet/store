# CF Store — Visual Architecture

## System Overview

```mermaid
graph TB
    subgraph Customer["🛒 Customer Storefront"]
        Home["Homepage<br/>Search / Filter / Sort"]
        PDP["Product Detail<br/>Variants / Reviews / Wishlist"]
        Cart["Shopping Cart"]
        Checkout["Checkout<br/>Shipping / Coupons / Tax"]
        Confirm["Order Confirmation"]
        Login["Login / Register"]
        Account["My Account<br/>Orders / Addresses"]
        Wishlist["Wishlist"]
        ForgotPW["Forgot / Reset Password"]
    end

    subgraph Admin["⚙️ Admin Dashboard"]
        Dashboard["Dashboard<br/>Stats Overview"]
        Analytics["Analytics<br/>Revenue Charts / Top Products"]
        Products["Products<br/>CRUD / Variants / Stock"]
        Categories["Categories<br/>CRUD"]
        Coupons["Coupons<br/>% or $ / Limits / Expiry"]
        Orders["Orders<br/>Status / Tracking / Refunds"]
        Customers["Customers<br/>List / Spend Totals"]
        Export["CSV Export"]
    end

    subgraph Services["☁️ External Services"]
        Stripe["💳 Stripe<br/>Payments / Webhooks / Refunds"]
        Neon["🐘 Neon Postgres<br/>11 Models"]
        Resend["✉️ Resend<br/>Receipts / Shipping / Password Reset"]
    end

    subgraph Infra["🏗️ Infrastructure"]
        Vercel["▲ Vercel<br/>Serverless / Auto-deploy"]
        GitHub["🐙 GitHub<br/>Karmajet/store"]
        NextAuth["🔐 NextAuth<br/>JWT / Dual Role"]
    end

    Home --> PDP --> Cart --> Checkout --> Stripe
    Stripe -->|Webhook| Neon
    Stripe -->|Webhook| Resend
    Checkout -->|Validate| Neon
    Login --> NextAuth
    Account --> Neon

    Orders -->|Refund| Stripe
    Orders -->|Ship Email| Resend
    Products --> Neon
    Analytics --> Neon

    GitHub -->|Push| Vercel
    Vercel --> Neon
```

## Purchase Flow

```mermaid
sequenceDiagram
    actor C as Customer
    participant S as Next.js Server
    participant DB as Neon Postgres
    participant ST as Stripe
    participant E as Resend Email

    C->>S: Add items to cart (localStorage)
    C->>S: POST /api/checkout
    S->>DB: Validate products & prices
    S->>DB: Check variant stock
    S->>DB: Validate coupon (if any)
    S->>S: Calculate shipping + tax
    S->>DB: Create Order (status: pending)
    S->>ST: Create Checkout Session
    ST-->>S: Session URL
    S-->>C: Redirect to Stripe

    C->>ST: Complete payment
    ST->>S: Webhook: checkout.session.completed

    Note over S,DB: Atomic $transaction
    S->>DB: Update order → paid
    S->>DB: Decrement variant stock
    S->>DB: Increment coupon uses
    S->>E: Send receipt email
    E-->>C: 📧 Order receipt

    ST-->>C: Redirect to /order-confirmation
    C->>S: GET /api/order?session_id=...
    S->>DB: Fetch order + items
    S-->>C: Order details
```

## Order Fulfillment Flow

```mermaid
sequenceDiagram
    actor A as Admin
    participant S as Next.js Server
    participant DB as Neon Postgres
    participant ST as Stripe
    participant E as Resend Email

    A->>S: Update status → Processing
    S->>DB: Update order status

    A->>S: Update status → Shipped + Tracking #
    S->>DB: Update order + shippedAt
    S->>E: Send shipping notification
    E-->>Note: 📧 "Your order shipped!" + tracking

    Note over A,S: If refund needed:
    A->>S: POST /api/admin/orders/[id]/refund
    S->>ST: Create refund
    ST-->>S: Refund confirmed
    S->>DB: Update status → refunded
```

## Database Schema

```mermaid
erDiagram
    Category ||--o{ Product : has
    Product ||--o{ Variant : has
    Product ||--o{ OrderItem : "ordered in"
    Product ||--o{ Wishlist : "wishlisted"
    Product ||--o{ Review : "reviewed"

    User ||--o{ Order : places
    User ||--o{ Wishlist : saves
    User ||--o{ Review : writes
    User ||--o{ Address : "has addresses"

    Order ||--o{ OrderItem : contains
    Order }o--|| Coupon : "uses"

    Variant ||--o{ OrderItem : "selected in"

    Product {
        string id PK
        string name
        string slug UK
        string description
        string imageUrl
        int price "cents"
        boolean active
        string categoryId FK
    }

    Variant {
        string id PK
        string productId FK
        string name "e.g. Size"
        string value "e.g. Large"
        string sku UK
        int stock
        int priceDiff "cents"
    }

    Category {
        string id PK
        string name
        string slug UK
        string description
    }

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        string resetToken UK
    }

    Order {
        string id PK
        string stripeSessionId UK
        string status
        string email
        string userId FK
        string couponId FK
        int subtotalAmount
        int discountAmount
        int shippingCost
        int taxAmount
        int totalAmount
        string trackingNumber
        string shippingMethod
    }

    Coupon {
        string id PK
        string code UK
        string type "% or fixed"
        int value
        int minOrderAmount
        int maxUses
        int currentUses
        boolean active
    }

    Review {
        string id PK
        string userId FK
        string productId FK
        int rating "1-5"
        string title
        string body
    }

    Address {
        string id PK
        string userId FK
        string label
        string name
        string address
        boolean isDefault
    }
```

## Tech Stack

```mermaid
graph LR
    subgraph Frontend
        Next["Next.js 16"]
        React["React 19"]
        TW["Tailwind CSS 4"]
        RC["Recharts"]
    end

    subgraph Backend
        API["API Routes"]
        Prisma["Prisma 6"]
        NA["NextAuth 4"]
    end

    subgraph Services
        PG["Neon Postgres"]
        S["Stripe"]
        R["Resend"]
        V["Vercel"]
        GH["GitHub"]
    end

    Next --> API --> Prisma --> PG
    Next --> NA
    API --> S
    API --> R
    GH -->|auto-deploy| V
```
