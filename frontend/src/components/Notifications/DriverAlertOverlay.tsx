import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Map, X, Route as RouteIcon } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import type { NotificationPayload } from '../../types/notification';

export default function DriverAlertOverlay() {
  const { t } = useTranslation();
  const [criticalAlert, setCriticalAlert] = useState<NotificationPayload | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifs) => {
      // Find the most recent unread critical alert
      const activeCritical = notifs.find(n => n.severity === 'CRITICAL' && !n.read);
      setCriticalAlert(activeCritical || null);
    });
    return unsubscribe;
  }, []);

  if (!criticalAlert) return null;

  const dismiss = () => {
    notificationService.markAsRead(criticalAlert.id);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full animate-in zoom-in-95 duration-200 border border-red-100">
        
        {/* Header */}
        <div className="bg-red-500 p-4 text-center relative">
          <div className="absolute top-2 right-2">
            <button onClick={dismiss} className="p-1 text-red-200 hover:text-white rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-white font-black uppercase tracking-widest text-lg">
            {t('status.CRITICAL')} HAZARD
          </h2>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {t(criticalAlert.messageKey, criticalAlert.variables)}
          </h3>
          <p className="text-red-600 font-bold text-sm mb-6 uppercase tracking-wide">
            {t('driver.stopVehicle')}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button 
              onClick={dismiss}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>{t('actions.viewOnMap')}</span>
            </button>
            <button 
              onClick={dismiss}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-200"
            >
              <RouteIcon className="w-4 h-4" />
              <span>{t('actions.alternativeRoute')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
