import { DashboardHeader } from '@/components/dashboard-header';
import { SettingsPanel } from '@/components/settings-panel';
import { requireAllowedUser } from '@/lib/auth';
import { getSettings } from '@/lib/sheets/settings';

export default async function SettingsPage() {
  const session = await requireAllowedUser();
  const settings = await getSettings();

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-[1400px]">
        <DashboardHeader email={session.user.email} />
        <SettingsPanel settings={settings} />
      </div>
    </main>
  );
}
