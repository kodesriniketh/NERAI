import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User, Role, AuthResponse } from '../services/authService';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (officialId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'nera_access_token';
const REFRESH_TOKEN_KEY = 'nera_refresh_token';
const USER_CACHE_KEY = 'nera_user_cache';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // On mount, try to restore session
    const restoreSession = async () => {
      try {
        const cachedUser = localStorage.getItem(USER_CACHE_KEY);
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }

        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          await refreshSessionInternal(refreshToken);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session restoration failed', error);
        setUser(null);
        localStorage.removeItem(USER_CACHE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleAuthSuccess = (response: AuthResponse) => {
    setUser(response.user);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.user));
  };

  const refreshSessionInternal = async (refreshToken: string) => {
    const response = await authService.refreshSession(refreshToken);
    handleAuthSuccess(response);
  };

  const login = async (officialId: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(officialId, password);
      handleAuthSuccess(response);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('No refresh token available');
    await refreshSessionInternal(refreshToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
