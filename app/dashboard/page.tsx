import { FinanceDashboard } from '@/components/finance-dashboard';
import { requireAllowedUser } from '@/lib/auth';
import { listEntries } from '@/lib/sheets/entries';
import { getSettings } from '@/lib/sheets/settings';

export default async function DashboardPage() {
  const session = await requireAllowedUser();

  const [entries, settings] = await Promise.all([listEntries(), getSettings()]);

  return <FinanceDashboard email={session.user.email} initialEntries={entries} settings={settings} />;
}
