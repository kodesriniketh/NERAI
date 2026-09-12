import type { NotificationPayload, NotificationSeverity } from '../types/notification';

// Simple in-memory notification store for MVP
let notifications: NotificationPayload[] = [];
let listeners: ((notifications: NotificationPayload[]) => void)[] = [];

// For deduplication
const notifiedHazards = new Set<string>();

export const notificationService = {
  subscribe(listener: (notifications: NotificationPayload[]) => void) {
    listeners.push(listener);
    listener([...notifications]);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  notifyListeners() {
    listeners.forEach(l => l([...notifications]));
  },

  getUnreadCount(): number {
    return notifications.filter(n => !n.read).length;
  },

  markAsRead(id: string) {
    const notif = notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.notifyListeners();
    }
  },

  markAllAsRead() {
    notifications.forEach(n => n.read = true);
    this.notifyListeners();
  },

  clearAll() {
    notifications = [];
    this.notifyListeners();
  },

  // Fire a hazard alert (handles deduplication)
  notifyHazard(
    hazardId: string, 
    truckId: string, 
    severity: NotificationSeverity, 
    messageKey: string,
    variables?: Record<string, any>,
    force: boolean = false
  ) {
    // Deduplication check
    const dedupKey = `${hazardId}-${truckId}-${severity}`;
    if (!force && notifiedHazards.has(dedupKey)) {
      return; // Already notified this truck of this hazard at this severity
    }
    
    notifiedHazards.add(dedupKey);

    const payload: NotificationPayload = {
      id: `NTF-${Date.now()}`,
      type: 'HAZARD_ALERT',
      hazardId,
      truckId,
      severity,
      messageKey,
      variables,
      createdAt: new Date().toISOString(),
      read: false
    };

    // Prepend to list
    notifications = [payload, ...notifications];
    this.notifyListeners();

    // Browser Notification fallback (if granted)
    if (Notification.permission === 'granted') {
      // In a real app we'd resolve i18n here, but for simple MVP browser notifs we just trigger it.
      // Better to rely on the in-app overlay for translation.
    }
  },

  // For when a hazard is cleared
  notifyRouteRestored(hazardId: string, truckId: string, messageKey: string, variables?: Record<string, any>) {
    const payload: NotificationPayload = {
      id: `NTF-${Date.now()}`,
      type: 'ROUTE_RESTORED',
      hazardId,
      truckId,
      severity: 'INFO',
      messageKey,
      variables,
      createdAt: new Date().toISOString(),
      read: false
    };

    notifications = [payload, ...notifications];
    this.notifyListeners();
  }
};
