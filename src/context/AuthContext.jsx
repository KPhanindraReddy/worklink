import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isFirebaseConfigured } from '../firebase/env';

const AuthContext = createContext(null);

const loadFirebaseAuth = async () => {
  const [{ onAuthStateChanged }, { auth }] = await Promise.all([
    import('firebase/auth'),
    import('../firebase/config')
  ]);

  return { auth, onAuthStateChanged };
};
const loadAuthService = () => import('../services/authService');
const loadUserService = () => import('../services/userService');

const runAuthAction = async (actionName, ...args) => {
  const service = await loadAuthService();
  return service[actionName](...args);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let unsubscribeProfile = null;
    let unsubscribeAuth = null;
    let isActive = true;
    let profileRequestId = 0;

    const handleFirebaseUser = (firebaseUser) => {
      if (!isActive) {
        return;
      }

      const requestId = profileRequestId + 1;
      profileRequestId = requestId;
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      setCurrentUser(firebaseUser ?? null);

      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      loadUserService()
        .then(({ subscribeUserProfile }) => {
          if (!isActive || requestId !== profileRequestId) {
            return;
          }

          unsubscribeProfile = subscribeUserProfile(
            firebaseUser.uid,
            (profile) => {
              if (!isActive || requestId !== profileRequestId) {
                return;
              }

              setUserProfile(profile);
              setLoading(false);
            },
            (error) => {
              if (!isActive || requestId !== profileRequestId) {
                return;
              }

              console.warn('WorkLink profile read skipped:', error?.code ?? error?.message ?? error);
              setUserProfile(null);
              setLoading(false);
            }
          );
        })
        .catch((error) => {
          if (!isActive || requestId !== profileRequestId) {
            return;
          }

          console.warn('WorkLink profile read skipped:', error?.code ?? error?.message ?? error);
          setUserProfile(null);
          setLoading(false);
        });
    };

    loadFirebaseAuth()
      .then(({ auth, onAuthStateChanged }) => {
        if (!isActive) {
          return;
        }

        if (!auth) {
          setLoading(false);
          return;
        }

        unsubscribeAuth = onAuthStateChanged(auth, handleFirebaseUser);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        console.warn('WorkLink auth initialization skipped:', error?.code ?? error?.message ?? error);
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      });

    return () => {
      isActive = false;
      profileRequestId += 1;
      unsubscribeProfile?.();
      unsubscribeAuth?.();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!currentUser) {
      return null;
    }

    try {
      const { getUserProfile } = await loadUserService();
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.warn('WorkLink profile refresh skipped:', error?.code ?? error?.message ?? error);
      setUserProfile(null);
      return null;
    }
  }, [currentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      loading,
      isFirebaseConfigured,
      loginWithEmail: (...args) => runAuthAction('loginWithEmail', ...args),
      loginWithGoogle: (...args) => runAuthAction('beginGoogleLogin', ...args),
      loginWithApple: (...args) => runAuthAction('beginAppleLogin', ...args),
      registerWithEmail: (...args) => runAuthAction('registerWithEmail', ...args),
      sendPhoneOtp: (...args) => runAuthAction('sendPhoneOtp', ...args),
      verifyPhoneOtp: (...args) => runAuthAction('verifyPhoneOtp', ...args),
      consumeRedirectAuthResult: (...args) => runAuthAction('consumeRedirectAuthResult', ...args),
      createBaseUserProfile: async (...args) => {
        const profile = await runAuthAction('createBaseUserProfile', ...args);
        await refreshProfile();
        return profile;
      },
      createOrUpdateUserProfile: async (...args) => {
        const profile = await runAuthAction('createOrUpdateUserProfile', ...args);
        await refreshProfile();
        return profile;
      },
      logout: (...args) => runAuthAction('logoutUser', ...args),
      refreshProfile
    }),
    [currentUser, userProfile, loading, refreshProfile]
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
