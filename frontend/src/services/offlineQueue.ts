export type ReportState = 'DRAFT' | 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface FieldReport {
  id: string; // client generated
  officialId: string;
  data: any;
  state: ReportState;
  createdAt: number;
  lastAttemptedAt?: number;
}

const QUEUE_KEY = 'nera_offline_reports_queue';

class OfflineQueueService {
  private getQueue(): FieldReport[] {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveQueue(queue: FieldReport[]) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  public addReportToQueue(officialId: string, reportData: any): FieldReport {
    const report: FieldReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      officialId,
      data: reportData,
      state: navigator.onLine ? 'SYNCING' : 'PENDING_SYNC',
      createdAt: Date.now(),
    };

    const queue = this.getQueue();
    queue.push(report);
    this.saveQueue(queue);

    if (navigator.onLine) {
      this.syncReport(report);
    }

    return report;
  }

  public getPendingReports(): FieldReport[] {
    return this.getQueue().filter(r => r.state === 'PENDING_SYNC' || r.state === 'FAILED');
  }

  private async syncReport(report: FieldReport) {
    console.log(`Syncing report ${report.id}...`);
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/vision/field/report-hazard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: parseFloat(report.data.lat),
          lon: parseFloat(report.data.lon),
          description: report.data.description || 'Unspecified hazard',
          severity: report.data.severity || 'Medium'
        })
      });

      if (!response.ok) throw new Error('Sync failed');

      const queue = this.getQueue();
      const index = queue.findIndex(r => r.id === report.id);
      if (index !== -1) {
        queue[index].state = 'SYNCED';
        queue[index].lastAttemptedAt = Date.now();
        this.saveQueue(queue);
      }
    } catch (err) {
      console.error(err);
      const queue = this.getQueue();
      const index = queue.findIndex(r => r.id === report.id);
      if (index !== -1) {
        queue[index].state = 'FAILED';
        queue[index].lastAttemptedAt = Date.now();
        this.saveQueue(queue);
      }
    }
  }

  public async syncAllPending() {
    if (!navigator.onLine) return;
    
    const pending = this.getPendingReports();
    for (const report of pending) {
      // mark as syncing
      const queue = this.getQueue();
      const index = queue.findIndex(r => r.id === report.id);
      if (index !== -1) {
        queue[index].state = 'SYNCING';
        this.saveQueue(queue);
      }
      
      await this.syncReport(report);
    }
  }

  public setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('Network connected. Syncing pending reports...');
      this.syncAllPending();
    });
    
    window.addEventListener('offline', () => {
      console.log('Network disconnected. Entering offline mode...');
    });
  }
}

export const offlineQueueService = new OfflineQueueService();
