import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: number;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, displayName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  userRole: "admin" | "user" | null;
  dbUserId: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);
  const [dbUserId, setDbUserId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setUserRole(userData.role);
      setDbUserId(userData.id);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const userData = await response.json();
      setUser(userData);
      setUserRole(userData.role);
      setDbUserId(userData.id);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  };

  const signup = async (email: string, displayName: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }
      
      const userData = await response.json();
      setUser(userData);
      setUserRole(userData.role);
      setDbUserId(userData.id);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signOut = async () => {
    setLoggingOut(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setUser(null);
    setUserRole(null);
    setDbUserId(null);
    localStorage.removeItem('user');
    setLoggingOut(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loggingOut, login, signup, signOut, userRole, dbUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
