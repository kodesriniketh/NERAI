import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { notificationService } from '../../services/notificationService';
import type { NotificationPayload } from '../../types/notification';

export default function NotificationBell() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifs) => {
      setNotifications(notifs);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      notificationService.markAllAsRead();
    }
  };

  const getIcon = (type: string, severity: string) => {
    if (type === 'ROUTE_RESTORED') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (severity === 'CRITICAL') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (severity === 'WARNING') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <Info className="w-5 h-5 text-sky-500" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="relative p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-sm text-slate-800">{t('driver.notifications')}</h3>
            {notifications.length > 0 && (
              <button 
                onClick={() => notificationService.clearAll()}
                className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                {t('driver.noUnread')}
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${!n.read ? 'bg-sky-50/30' : ''}`}>
                  <div className="shrink-0 mt-0.5">
                    {getIcon(n.type, n.severity)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-0.5">
                      {n.type === 'ROUTE_RESTORED' ? t('driver.routeRestored') : t(n.messageKey, n.variables)}
                    </h4>
                    {/* If there's a detail key, we would map it here. For MVP, messageKey contains the full text or summary */}
                    <p className="text-[11px] text-slate-500 leading-tight">
                       {t(n.messageKey, n.variables)}
                    </p>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
