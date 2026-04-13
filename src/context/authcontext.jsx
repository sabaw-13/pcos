import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ADMIN_EMAIL, logoutUser } from '../services/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      authLoading,
      isAdmin: currentUser?.email?.toLowerCase() === ADMIN_EMAIL,
      isCustomer: Boolean(currentUser) && currentUser?.email?.toLowerCase() !== ADMIN_EMAIL,
      logout: logoutUser
    }),
    [authLoading, currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
