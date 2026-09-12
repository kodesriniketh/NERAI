import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Truck, MapPin, Activity, ChevronRight, Mountain, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
// Role is unused, no need to import it here

type FormType = 'ADMIN' | 'TRANSPORT_MANAGER' | 'FIELD_OFFICIAL' | 'DISASTER_OFFICIAL' | null;

export default function Login() {
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<FormType>(null);
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      switch (role) {
        case 'ADMIN': navigate('/admin', { replace: true }); break;
        case 'TRANSPORT_MANAGER': navigate('/transport', { replace: true }); break;
        case 'FIELD_OFFICIAL': navigate('/field', { replace: true }); break;
        case 'DISASTER_OFFICIAL': navigate('/disaster', { replace: true }); break;
      }
    }
  }, [isAuthenticated, role, navigate]);

  const handleRoleSelect = (role: FormType) => {
    setSelectedRole(role);
    setIdentifier('');
    setPassword('');
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await login(identifier, password);
      // navigation will be handled by useEffect above
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRoleCards = () => (
    <div className="space-y-4">
      {/* ADMIN */}
      <button onClick={() => handleRoleSelect('ADMIN')} className="w-full text-left group flex items-center justify-between p-4 md:p-5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_-5px_rgba(14,165,233,0.1)] hover:-translate-y-[2px] hover:border-sky-200 transition-all duration-200 ease-out">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-sky-50 group-hover:border-sky-100 transition-colors duration-200">
            <ShieldAlert className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors duration-200" />
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-base tracking-wide group-hover:text-sky-700 transition-colors">Admin</h3>
            <p className="text-slate-500 text-sm font-medium">Command & logistics visibility</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all duration-200" />
      </button>

      {/* TRANSPORT MANAGER */}
      <button onClick={() => handleRoleSelect('TRANSPORT_MANAGER')} className="w-full text-left group flex items-center justify-between p-4 md:p-5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_-5px_rgba(16,185,129,0.1)] hover:-translate-y-[2px] hover:border-emerald-200 transition-all duration-200 ease-out">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors duration-200">
            <Truck className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors duration-200" />
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-base tracking-wide group-hover:text-emerald-700 transition-colors">Transport Manager</h3>
            <p className="text-slate-500 text-sm font-medium">AI route planning & fleet movement</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-200" />
      </button>

      {/* FIELD OFFICIAL */}
      <button onClick={() => handleRoleSelect('FIELD_OFFICIAL')} className="w-full text-left group flex items-center justify-between p-4 md:p-5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_-5px_rgba(245,158,11,0.1)] hover:-translate-y-[2px] hover:border-amber-200 transition-all duration-200 ease-out">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors duration-200">
            <MapPin className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors duration-200" />
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-base tracking-wide group-hover:text-amber-700 transition-colors">Field Official</h3>
            <p className="text-slate-500 text-sm font-medium">Ground incident reporting</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200" />
      </button>

      {/* DISASTER OFFICIAL */}
      <button onClick={() => handleRoleSelect('DISASTER_OFFICIAL')} className="w-full text-left group flex items-center justify-between p-4 md:p-5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_-5px_rgba(239,68,68,0.1)] hover:-translate-y-[2px] hover:border-red-200 transition-all duration-200 ease-out">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors duration-200">
            <Activity className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors duration-200" />
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-base tracking-wide group-hover:text-red-700 transition-colors">Disaster Official</h3>
            <p className="text-slate-500 text-sm font-medium">Incident verification & emergency response</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all duration-200" />
      </button>
    </div>
  );

  const getFormConfig = () => {
    switch (selectedRole) {
      case 'ADMIN': return { title: 'Admin Login', idLabel: 'Official UID', idPlaceholder: 'NERA-ADM-XXXX', btnText: 'Secure Login', btnColor: 'bg-sky-600 hover:bg-sky-700', iconColor: 'text-sky-600' };
      case 'TRANSPORT_MANAGER': return { title: 'Transport Manager Login', idLabel: 'Employee ID / Email', idPlaceholder: 'TM-XXXX', btnText: 'Login to Route Command', btnColor: 'bg-emerald-600 hover:bg-emerald-700', iconColor: 'text-emerald-600' };
      case 'FIELD_OFFICIAL': return { title: 'Field Official Login', idLabel: 'Field Official ID', idPlaceholder: 'FO-XXXX', btnText: 'Login', btnColor: 'bg-amber-600 hover:bg-amber-700', iconColor: 'text-amber-600' };
      case 'DISASTER_OFFICIAL': return { title: 'Disaster Official Login', idLabel: 'Official UID', idPlaceholder: 'NERA-DMO-XXXX', btnText: 'Secure Login', btnColor: 'bg-red-600 hover:bg-red-700', iconColor: 'text-red-600' };
      default: return null;
    }
  };

  const renderLoginForm = () => {
    const config = getFormConfig();
    if (!config) return null;

    return (
      <div className="w-full bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          onClick={() => handleRoleSelect(null)} 
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to roles
        </button>
        
        <h2 className={`text-2xl font-bold mb-6 ${config.iconColor}`}>{config.title}</h2>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium flex items-start gap-2">
            <Activity className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">{config.idLabel}</label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={config.idPlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900 font-medium"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Password / Secure PIN</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900 font-medium"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-xl text-white font-bold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${config.btnColor} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : config.btnText}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F8F7] font-sans overflow-x-hidden selection:bg-teal-900/10 text-slate-900">
      
      {/* Background Topographic Texture (Subtle) */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.04] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c1.385 0 2.561-.926 2.91-2.203L15.342 9H20v2h-3.658l-1.432 6.797c-.349 1.277-1.525 2.203-2.91 2.203H11v-2h1zm9-5h2v2h-2v-2zm-9 9h2v2h-2v-2zm-9 9h2v2H2v-2zm9-9h2v2h-2v-2zM0 0h2v2H0V0zm9 9h2v2H9V9zm-9 9h2v2H0v-2zm9 9h2v2H9v-2zm-9 9h2v2H0v-2zm9 9h2v2H9v-2zm-9 9h2v2H0v-2zm9 9h2v2H9v-2zm-9 9h2v2H0v-2z' fill='%230f172a' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px'
        }}
      />

      {/* NAVBAR */}
      <nav className={`relative z-20 w-full px-6 md:px-12 py-6 flex items-center justify-between transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center">
          <img src="/logo.png" alt="NERA Logo" className="h-14 w-auto mix-blend-multiply" />
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <span className="hover:text-slate-900 cursor-pointer transition-colors">Platform</span>
          <span className="hover:text-slate-900 cursor-pointer transition-colors">Operations</span>
          <span className="hover:text-slate-900 cursor-pointer transition-colors">About</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">System Operational</span>
          </div>
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase hidden lg:block ml-2 border-l border-slate-300 pl-4">
            Secure Government Access
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 pt-8 md:pt-16 pb-32">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          {/* LEFT: HERO */}
          <div className={`w-full lg:w-[55%] flex flex-col justify-center transition-all duration-1000 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-200/50 rounded-full border border-slate-300/50 w-fit mb-8">
              <Activity className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-xs font-bold tracking-wider text-teal-800 uppercase">
                AI-Powered Logistics Intelligence
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6 font-serif-like">
              Navigate the <span className="text-teal-900 relative">
                Northeast.
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-teal-200/50 z-[-1]" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,10 Q50,20 100,10" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span><br />
              Respond Smarter.
            </h1>

            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl mb-12">
              NERA combines intelligent route planning, real-time field intelligence and emergency coordination to keep critical movement connected across the Northeast.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
              <span>8 States</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>Real-Time Intelligence</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>AI Route Analysis</span>
            </div>
          </div>

          {/* RIGHT: ROLE SELECTION / LOGIN FORM */}
          <div className={`w-full lg:w-[45%] flex flex-col justify-center transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {!selectedRole ? (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Enter NERA</h2>
                  <p className="text-sm text-slate-500 font-medium">Select your operational role to continue.</p>
                </div>
                {renderRoleCards()}
              </>
            ) : (
              renderLoginForm()
            )}
          </div>
        </div>
      </div>


      {/* FOOTER MICRO-DETAILS */}
      <div className={`fixed bottom-6 left-6 right-6 flex justify-between items-center text-[9px] font-bold tracking-widest text-slate-400 uppercase pointer-events-none z-30 transition-opacity duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3">
          <span>Northeast Region</span>
          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          <span>Logistics Intelligence Network</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-px bg-slate-300"></div>
          <span>Secure Access</span>
        </div>
      </div>

    </div>
  );
}
