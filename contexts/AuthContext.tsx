'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  getAuthHeaders: () => Record<string, string>;
  handleUnauthorized: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount and validate token
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');

    if (storedUser && storedToken) {
      try {
        // Decode token to check expiration (format: base64(email:timestamp))
        const decoded = atob(storedToken);
        const [email, timestamp] = decoded.split(':');

        if (email && timestamp) {
          const tokenTime = parseInt(timestamp);
          const now = Date.now();
          const hoursDiff = (now - tokenTime) / (1000 * 60 * 60);

          // Token expires after 24 hours
          if (hoursDiff <= 24) {
            setUser(JSON.parse(storedUser));
          } else {
            // Token expired, clear everything
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
          }
        } else {
          // Invalid token format
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      } catch (e) {
        // Error parsing, clear everything
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authToken', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('authToken');
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
    return { 'Content-Type': 'application/json' };
  };

  const handleUnauthorized = () => {
    // Clear auth state when we get 401 responses
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        getAuthHeaders,
        handleUnauthorized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
