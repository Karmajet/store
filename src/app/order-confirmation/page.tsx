import { Suspense } from "react";
import OrderConfirmationContent from "./OrderConfirmationContent";

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-gray-500">Loading order details...</p>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
