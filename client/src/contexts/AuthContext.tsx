import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: number;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: "super_admin" | "company_admin" | "company_member";
  companyId?: number | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, displayName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  userRole: "super_admin" | "company_admin" | "company_member" | null;
  dbUserId: number | null;
  companyId: number | null;
  setUser: (user: User | null) => void;
  setUserRole: (role: "super_admin" | "company_admin" | "company_member" | null) => void;
  setDbUserId: (id: number | null) => void;
  setCompanyId: (id: number | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<"super_admin" | "company_admin" | "company_member" | null>(null);
  const [dbUserId, setDbUserId] = useState<number | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setUserRole(userData.role);
      setDbUserId(userData.id);
      setCompanyId(userData.companyId || null);
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
      setCompanyId(userData.companyId || null);
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
      setCompanyId(userData.companyId || null);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signOut = async () => {
    setLoggingOut(true);
    
    setUser(null);
    setUserRole(null);
    setDbUserId(null);
    setCompanyId(null);
    localStorage.removeItem('user');
    setLoggingOut(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loggingOut, login, signup, signOut, userRole, dbUserId, companyId, setUser, setUserRole, setDbUserId, setCompanyId }}>
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
