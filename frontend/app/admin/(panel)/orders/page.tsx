import { Suspense } from "react";
import { OrdersView } from "@/components/admin/OrdersView";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminText } from "@/messages/admin";

export const metadata = { title: adminText.orders.title };

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold uppercase">{adminText.orders.title}</h1>
      {/* OrdersView keeps its filters in the web address, which needs a Suspense boundary */}
      <Suspense fallback={<Skeleton className="h-64 rounded-card bg-ink/10" />}>
        <OrdersView />
      </Suspense>
    </div>
  );
}