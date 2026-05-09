import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PageSEO } from '../../components/common/PageSEO';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { updateUserSettings } from '../../services/userService';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const SettingsPage = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    whatsappAlerts: false
  });

  const roleSummary = useMemo(
    () => (userProfile?.role ? `${userProfile.role} account` : 'No role assigned'),
    [userProfile?.role]
  );

  const saveSettings = async () => {
    if (!currentUser) {
      return;
    }

    try {
      await updateUserSettings(currentUser.uid, preferences);
      toast.success('Settings saved to Firestore.');
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  return (
    <AppShell>
      <PageSEO title="Settings" description="Manage WorkLink preferences, verification, and appearance." />

      <section className="section-space">
        <div className="page-shell grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Settings</h1>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Manage account preferences, theme, and verification readiness.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge tone="blue">{roleSummary}</Badge>
                <Badge tone={userProfile?.verified ? 'emerald' : 'amber'}>
                  {userProfile?.verified ? 'Verified profile' : 'Verification pending'}
                </Badge>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Contact preferences</h2>
              <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                {[
                  ['emailAlerts', 'Email alerts'],
                  ['whatsappAlerts', 'WhatsApp reminders']
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50"
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={preferences[key]}
                      onChange={(event) =>
                        setPreferences((prev) => ({ ...prev, [key]: event.target.checked }))
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={saveSettings}>
                  <CheckCircle2 size={16} />
                  Save settings
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Appearance</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                WorkLink is currently locked to a clean light interface with dark text for readability.
              </p>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Verification status</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Admin approval unlocks stronger trust signals and direct contact options.
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                <p>Name: {userProfile?.fullName}</p>
                <p className="mt-2">Phone: {userProfile?.phoneNumber || 'Not added'}</p>
                <p className="mt-2">Email: {userProfile?.email || 'Not added'}</p>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Session</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Log out safely when you're done with booking or profile updates.
              </p>
              <div className="mt-6">
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default SettingsPage;
