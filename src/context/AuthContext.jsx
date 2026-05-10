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
import { getUserProfile, subscribeUserProfile } from '../services/userService';

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

    let unsubscribeProfile = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      setCurrentUser(firebaseUser ?? null);

      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubscribeProfile = subscribeUserProfile(
        firebaseUser.uid,
        (profile) => {
          setUserProfile(profile);
          setLoading(false);
        },
        (error) => {
          console.warn('WorkLink profile read skipped:', error?.code ?? error?.message ?? error);
          setUserProfile(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeProfile?.();
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
