import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  isNewUser: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Use Auth metadata to determine if it's a new user
        // If creation time and last sign-in time are the same (or very close), it's a new session for a new user
        const { creationTime, lastSignInTime } = firebaseUser.metadata;
        
        // We consider them "new" if they were created in the last 30 seconds
        // or if creationTime matches lastSignInTime
        const isNew = creationTime === lastSignInTime;
        setIsNewUser(isNew);
      }
      
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isNewUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
