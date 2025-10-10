import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  userRole: "admin" | "user" | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      
      // TODO: Replace with actual role from database
      // For now, checking if email contains "admin" for demo purposes
      if (user) {
        const isAdmin = user.email?.toLowerCase().includes("admin") || false;
        setUserRole(isAdmin ? "admin" : "user");
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error("Firebase is not configured. Please set up Firebase credentials.");
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error("Firebase is not configured. Please set up Firebase credentials.");
    }
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, userRole }}>
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
