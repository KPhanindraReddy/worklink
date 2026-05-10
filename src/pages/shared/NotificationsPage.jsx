import { BellRing } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { PageSEO } from '../../components/common/PageSEO';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { subscribeNotifications } from '../../services/notificationService';
import { formatDate } from '../../utils/formatters';

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  useEffect(() => {
    return subscribeNotifications(currentUser?.uid, setNotifications);
  }, [currentUser?.uid]);

  return (
    <AppShell>
      <PageSEO title="Notifications" description="Booking, chat, verification, and platform alerts for your WorkLink account." />

      <section className="section-space">
        <div className="page-shell space-y-4">
          <Card className="rounded-[30px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                  <BellRing size={18} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-950">Notifications</h1>
                  <p className="text-sm text-slate-500">
                    {unreadCount ? `${unreadCount} new updates` : 'All caught up'}
                  </p>
                </div>
              </div>
              <Badge tone={unreadCount ? 'blue' : 'slate'}>{notifications.length} total</Badge>
            </div>
          </Card>

          {notifications.length ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card key={notification.id} className="flex items-start gap-4 rounded-[28px]">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
                    <BellRing size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-950 dark:text-white">
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
          ) : (
            <EmptyState
              title="No notifications yet"
              description="Booking, chat, and account updates will appear here."
            />
          )}
        </div>
      </section>
    </AppShell>
  );
};

export default NotificationsPage;
