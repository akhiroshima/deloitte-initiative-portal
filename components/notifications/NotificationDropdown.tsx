import React, { useState, useRef, useEffect } from 'react';
import { Notification, NotificationType } from '../../types';
import { Bell, Sparkles, CheckCircle, XCircle, MessageCircle, ClipboardList } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onNotificationClick, onMarkAllRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    const baseClasses = "h-6 w-6 rounded-full flex items-center justify-center text-primary-foreground flex-shrink-0";
    switch (type) {
      case NotificationType.REQUEST_RECEIVED:
        return <div className={`${baseClasses} bg-primary`}><MessageCircle className="h-4 w-4" /></div>;
      case NotificationType.REQUEST_APPROVED:
        return <div className={`${baseClasses} bg-primary`}><CheckCircle className="h-4 w-4" /></div>;
      case NotificationType.REQUEST_REJECTED:
        return <div className={`${baseClasses} bg-destructive`}><XCircle className="h-4 w-4" /></div>;
      case NotificationType.NEW_OPPORTUNITY:
        return <div className={`${baseClasses} bg-primary`}><Sparkles className="h-4 w-4" /></div>;
      case NotificationType.TASK_ASSIGNED:
        return <div className={`${baseClasses} bg-primary`}><ClipboardList className="h-4 w-4" /></div>;
      default:
        return <div className={`${baseClasses} bg-muted`}><Bell className="h-4 w-4" /></div>;
    }
  };
  
  const handleItemClick = (notification: Notification) => {
    onNotificationClick(notification);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-popover text-popover-foreground shadow-2xl ring-1 ring-border focus:outline-none z-50 animate-slideDown">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
            {notifications.length > 0 && (
                <button 
                    onClick={onMarkAllRead}
                    className="text-sm font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                    disabled={unreadCount === 0}
                >
                Mark all as read
                </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <li key={notif.id}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleItemClick(notif);
                    }}
                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted ${!notif.isRead ? 'bg-primary/10' : ''}`}
                  >
                    {getNotificationIcon(notif.type)}
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notif.isRead && (
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" aria-label="Unread"></div>
                    )}
                  </a>
                </li>
              ))
            ) : (
              <li className="p-6 text-center text-sm text-muted-foreground">
                You have no notifications.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;