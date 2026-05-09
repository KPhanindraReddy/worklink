import { BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { PageSEO } from '../../components/common/PageSEO';
import { SectionHeading } from '../../components/common/SectionHeading';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { subscribeNotifications } from '../../services/notificationService';
import { formatDate } from '../../utils/formatters';

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    return subscribeNotifications(currentUser?.uid, setNotifications);
  }, [currentUser?.uid]);

  return (
    <AppShell>
      <PageSEO title="Notifications" description="Booking, chat, verification, and platform alerts for your WorkLink account." />

      <section className="section-space">
        <div className="page-shell">
          <SectionHeading
            eyebrow="Notifications"
            title="Stay on top of bookings, chats, and verification updates"
            description="These are in-app alerts for bookings, chat activity, and verification updates."
          />

          <div className="mt-8 space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className="flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
                  <BellRing size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                      {notification.title}
                    </h3>
                    <Badge tone={notification.read ? 'slate' : 'blue'}>
                      {notification.read ? 'Read' : 'New'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{notification.body}</p>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default NotificationsPage;
