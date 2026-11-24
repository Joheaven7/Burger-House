import { OrderDetailView } from "@/components/admin/OrderDetailView";
import { adminText } from "@/messages/admin";

export const metadata = { title: adminText.detail.pageTitle };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="sr-only">{adminText.detail.pageTitle}</h1>
      <OrderDetailView id={id} />
    </div>
  );
}