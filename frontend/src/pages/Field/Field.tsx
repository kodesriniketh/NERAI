// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Send, AlertTriangle, LogOut, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { offlineQueueService } from '../../services/offlineQueue';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/LanguageSelector';

export default function Field() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [lat, setLat] = useState<string>('');
  const [lon, setLon] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<string>('High');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'pending' } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(offlineQueueService.getPendingReports().length);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      offlineQueueService.syncAllPending().then(() => {
        setPendingCount(offlineQueueService.getPendingReports().length);
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setPendingCount(offlineQueueService.getPendingReports().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAutoLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toString());
          setLon(position.coords.longitude.toString());
          setMessage({ text: 'Location acquired successfully!', type: 'success' });
        },
        (error) => {
          console.error('Error getting location', error);
          setMessage({ text: 'Failed to get location. Please enter manually.', type: 'error' });
        }
      );
    } else {
      setMessage({ text: 'Geolocation is not supported by this browser.', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lon) {
      setMessage({ text: 'Latitude and Longitude are required.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const reportData = {
        lat, lon, description, severity, 
        fileName: file ? file.name : null
      };
      
      const report = offlineQueueService.addReportToQueue(user?.officialId || 'unknown', reportData);
      setPendingCount(offlineQueueService.getPendingReports().length);

      if (report.state === 'PENDING_SYNC') {
        setMessage({ text: 'Report saved offline. Will sync when connection is restored.', type: 'pending' });
      } else {
        setMessage({ text: 'Incident reported successfully!', type: 'success' });
      }

      // Reset form
      setLat('');
      setLon('');
      setDescription('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Error reporting incident. Try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="NERA Logo" className="h-10 w-auto mix-blend-multiply" />
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">NERA Field</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-4 border-t-4 border-blue-500">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="font-bold text-slate-800 text-sm">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.officialId} • {user?.district}</p>
            </div>
            <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {isOnline ? 'Online' : 'Offline Mode'}
            </div>
          </div>
          
          {pendingCount > 0 && (
            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-amber-700">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{pendingCount} report{pendingCount !== 1 && 's'} pending sync</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md space-y-5">
          {message && (
            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
              message.type === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
              {message.type === 'pending' && <Clock className="w-4 h-4 mt-0.5 shrink-0" />}
              {message.type === 'error' && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('field.capturePhoto')}</label>
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex justify-center items-center cursor-pointer hover:bg-slate-50 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <span className="text-sm text-slate-600 truncate max-w-xs">{file.name}</span>
              ) : (
                <div className="flex flex-col items-center text-slate-500">
                  <Camera className="w-8 h-8 mb-2 text-slate-400" />
                  <span className="text-sm">{t('field.capturePhoto')}</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">{t('field.currentLocation')}</label>
              <button 
                type="button" 
                onClick={handleAutoLocate}
                className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:text-blue-700"
              >
                <MapPin className="w-3 h-3" /> Auto-Locate
              </button>
            </div>
            <div className="flex gap-2">
              <input 
                type="number" 
                step="any"
                placeholder="Lat" 
                className="w-1/2 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
              />
              <input 
                type="number" 
                step="any"
                placeholder="Lon" 
                className="w-1/2 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('field.description')}</label>
            <textarea 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={3}
              placeholder="Describe the hazard (e.g., landslide blocking both lanes)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('field.severity')}</label>
            <select 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="Low">Low (Passable with caution)</option>
              <option value="Medium">Medium (Partial blockage)</option>
              <option value="High">High (Road completely blocked)</option>
              <option value="Critical">Critical (Immediate danger)</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition disabled:opacity-70 shadow-md shadow-blue-200"
          >
            {loading ? 'Submitting...' : <><Send className="w-5 h-5" /> {t('field.submitReport')}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
