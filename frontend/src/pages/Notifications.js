import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../context/AppContext';
import { PageHeading, EmptyState } from '../components/common/UI';
export default function Notifications() {
  const { notifications, markRead } = useNotifications();
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE UPDATE FROM YOUR COMMUNITY"
        title="Notifications"
        action={
          <button className="btn secondary" onClick={() => markRead('all')}>
            <CheckCheck size={17} />
            Mark all read
          </button>
        }
      />
      {notifications.length ? (
        <div className="notification-list">
          {notifications.map((n) => (
            <article key={n.id} className={'panel ' + (!n.read ? 'unread' : '')}>
              <Bell size={22} />
              <Link to={n.path} onClick={() => markRead(n.id)}>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <small>{n.date}</small>
              </Link>
              {!n.read && (
                <button className="text-link" onClick={() => markRead(n.id)}>
                  Mark read
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="You’re all caught up."
          description="Your community updates will appear here."
        />
      )}
    </>
  );
}
