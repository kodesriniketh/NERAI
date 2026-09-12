export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface NotificationPayload {
  id: string;
  type: string;
  hazardId?: string;
  truckId?: string;
  missionId?: string;
  severity: NotificationSeverity;
  messageKey: string;
  variables?: Record<string, string | number>;
  distanceAheadKm?: number;
  locationName?: string;
  createdAt: string;
  read: boolean;
}
