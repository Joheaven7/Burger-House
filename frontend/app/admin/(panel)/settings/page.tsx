import { SettingsView } from "@/components/admin/settings/SettingsView";
import { adminText } from "@/messages/admin";

export const metadata = { title: adminText.settings.title };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold uppercase">{adminText.settings.title}</h1>
      <SettingsView />
    </div>
  );
}