import { MenuView } from "@/components/admin/menu/MenuView";
import { adminText } from "@/messages/admin";

export const metadata = { title: adminText.menu.title };

export default function AdminMenuPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold uppercase">{adminText.menu.title}</h1>
      <MenuView />
    </div>
  );
}