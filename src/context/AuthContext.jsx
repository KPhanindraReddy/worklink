import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import {
  createBaseUserProfile,
  createOrUpdateUserProfile,
  loginWithApple,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  registerWithEmail,
  sendPhoneOtp,
  verifyPhoneOtp
} from '../services/authService';
import { getUserProfile } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return undefined;
    }

    let authChangeId = 0;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const changeId = authChangeId + 1;
      authChangeId = changeId;

      setLoading(true);
      setCurrentUser(firebaseUser ?? null);

      if (!firebaseUser) {
        setUserProfile(null);
        if (authChangeId === changeId) {
          setLoading(false);
        }
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);
        if (authChangeId === changeId) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.warn('WorkLink profile read skipped:', error?.code ?? error?.message ?? error);
        if (authChangeId === changeId) {
          setUserProfile(null);
        }
      }

      if (authChangeId === changeId) {
        setLoading(false);
      }
    });

    return () => {
      authChangeId += 1;
      unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!currentUser) {
      return null;
    }

    try {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.warn('WorkLink profile refresh skipped:', error?.code ?? error?.message ?? error);
      setUserProfile(null);
      return null;
    }
  };

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      loading,
      isFirebaseConfigured,
      loginWithEmail,
      loginWithGoogle,
      loginWithApple,
      registerWithEmail,
      sendPhoneOtp,
      verifyPhoneOtp,
      createBaseUserProfile: async (...args) => {
        const profile = await createBaseUserProfile(...args);
        await refreshProfile();
        return profile;
      },
      createOrUpdateUserProfile: async (...args) => {
        const profile = await createOrUpdateUserProfile(...args);
        await refreshProfile();
        return profile;
      },
      logout: logoutUser,
      refreshProfile
    }),
    [currentUser, userProfile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
};
