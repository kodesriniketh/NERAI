export type Role = 'ADMIN' | 'TRANSPORT_MANAGER' | 'FIELD_OFFICIAL' | 'DISASTER_OFFICIAL';

export interface User {
  id: string;
  officialId: string;
  name: string;
  role: Role;
  state?: string;
  district?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Development Mock Database
const MOCK_USERS: Record<string, { user: User; passwordHash: string }> = {
  'NERA-ADM-001': {
    user: {
      id: 'usr_001',
      officialId: 'NERA-ADM-001',
      name: 'State Operations Admin',
      role: 'ADMIN',
      state: 'Assam',
    },
    passwordHash: 'admin123',
  },
  'TM-001': {
    user: {
      id: 'usr_014',
      officialId: 'TM-001',
      name: 'Transport Manager',
      role: 'TRANSPORT_MANAGER',
    },
    passwordHash: 'transport123',
  },
  'FO-001': {
    user: {
      id: 'usr_052',
      officialId: 'FO-001',
      name: 'Field Officer',
      role: 'FIELD_OFFICIAL',
      state: 'Meghalaya',
      district: 'East Khasi Hills',
    },
    passwordHash: 'field123',
  },
  'NERA-DMO-001': {
    user: {
      id: 'usr_063',
      officialId: 'NERA-DMO-001',
      name: 'Disaster Control Officer',
      role: 'DISASTER_OFFICIAL',
    },
    passwordHash: 'disaster123',
  },
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login(officialId: string, password: string): Promise<AuthResponse> {
    await delay(800); // Simulate network latency

    const account = MOCK_USERS[officialId];
    if (!account || account.passwordHash !== password) {
      throw new Error('Invalid credentials');
    }

    // Mock tokens
    const accessToken = `mock_access_${account.user.id}_${Date.now()}`;
    const refreshToken = `mock_refresh_${account.user.id}_${Date.now()}`;

    // Normally this is HttpOnly cookie, but for dev mock we simulate saving it securely or let AuthProvider handle it.
    // The requirements say field official has long lived refresh token.
    return {
      user: account.user,
      accessToken,
      refreshToken,
    };
  },

  async refreshSession(refreshToken: string): Promise<AuthResponse> {
    await delay(500);
    
    // In a real app, validate token and signature on backend
    if (!refreshToken.startsWith('mock_refresh_')) {
      throw new Error('Invalid refresh token');
    }

    const parts = refreshToken.split('_');
    const userId = parts[2];
    
    const account = Object.values(MOCK_USERS).find(acc => acc.user.id === userId);
    if (!account) {
      throw new Error('User not found');
    }

    const newAccessToken = `mock_access_${account.user.id}_${Date.now()}`;
    const newRefreshToken = `mock_refresh_${account.user.id}_${Date.now()}`;

    return {
      user: account.user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(): Promise<void> {
    await delay(300);
    // In real app, call backend to invalidate token
  }
};
