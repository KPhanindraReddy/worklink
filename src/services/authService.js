import {
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { appleProvider, auth, db, googleProvider, isFirebaseConfigured } from '../firebase/config';
import { normalizeCoordinates } from '../utils/location';

let recaptchaVerifier = null;
const HIDDEN_ADMIN_EMAIL = 'admin@gmail.com';
const HIDDEN_ADMIN_FULL_NAME = 'admin';

const shouldUseRedirectAuth = () =>
  typeof window !== 'undefined' &&
  !['localhost', '127.0.0.1'].includes(window.location.hostname);
const buildAvatarUrl = (fullName) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'WorkLink User')}&background=1d4ed8&color=ffffff`;
const getCreatedAtValue = (user) =>
  user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : serverTimestamp();
const normalizeComparableValue = (value) => String(value ?? '').trim();

export const isHiddenAdminAccount = (user, formValues = {}, existingProfile = null) => {
  const email = normalizeComparableValue(formValues.email || existingProfile?.email || user?.email);
  const fullName = normalizeComparableValue(
    formValues.fullName || existingProfile?.fullName || user?.displayName
  );

  return email === HIDDEN_ADMIN_EMAIL && fullName === HIDDEN_ADMIN_FULL_NAME;
};

const resolveAccountRole = (user, formValues = {}, existingProfile = null) => {
  if (existingProfile?.role === 'admin' || isHiddenAdminAccount(user, formValues, existingProfile)) {
    return 'admin';
  }

  return existingProfile?.role || formValues.role || '';
};

const authenticateWithProvider = async (provider) => {
  if (shouldUseRedirectAuth()) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  const credentials = await signInWithPopup(auth, provider);
  return credentials.user;
};

const buildBaseProfile = (user, formValues = {}, existingProfile = null) => {
  const resolvedRole = resolveAccountRole(user, formValues, existingProfile);
  const fullName = formValues.fullName || existingProfile?.fullName || user.displayName || 'WorkLink User';
  const profilePhotoUrl = formValues.profilePhotoUrl || user.photoURL || buildAvatarUrl(fullName);

  return {
    uid: user.uid,
    fullName,
    phoneNumber: formValues.phoneNumber || user.phoneNumber || '',
    email: formValues.email || user.email || '',
    profilePhoto: profilePhotoUrl,
    role: resolvedRole,
    location: formValues.currentLocation || formValues.location || existingProfile?.location || '',
    coordinates:
      normalizeCoordinates(formValues.coordinates) ||
      normalizeCoordinates(existingProfile?.coordinates) ||
      null,
    accountStatus: existingProfile?.accountStatus || 'active',
    verified: existingProfile?.verified ?? false,
    updatedAt: serverTimestamp()
  };
};

export const getOrCreateRecaptchaVerifier = (containerId = 'recaptcha-container') => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Authentication is not configured yet.');
  }

  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible'
    });
  }

  return recaptchaVerifier;
};

export const registerWithEmail = async ({ email, password, fullName }) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Add Firebase keys in .env before using email signup.');
  }

  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  if (fullName) {
    await updateProfile(credentials.user, { displayName: fullName });
  }
  return credentials.user;
};

export const loginWithEmail = async ({ email, password }) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Add Firebase keys in .env before using email login.');
  }

  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return credentials.user;
};

export const loginWithGoogle = async () => {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error('Add Firebase keys in .env before using Google login.');
  }

  return authenticateWithProvider(googleProvider);
};

export const loginWithApple = async () => {
  if (!isFirebaseConfigured || !auth || !appleProvider) {
    throw new Error('Add Firebase keys in .env before using Apple login.');
  }

  return authenticateWithProvider(appleProvider);
};

export const sendPhoneOtp = async (phoneNumber) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Add Firebase keys in .env before using phone OTP login.');
  }

  const verifier = getOrCreateRecaptchaVerifier();
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export const verifyPhoneOtp = async (confirmationResult, code) => {
  const credential = await confirmationResult.confirm(code);
  return credential.user;
};

const normalizeCommaSeparated = (value) =>
  Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const hasFormValue = (values, key) => Object.prototype.hasOwnProperty.call(values ?? {}, key);

const getFormValue = (values, key, fallback = '') =>
  hasFormValue(values, key) ? values[key] : fallback;

const getNumericFormValue = (values, key, fallback = 0, { emptyAsNull = false } = {}) => {
  if (!hasFormValue(values, key)) {
    return fallback;
  }

  const value = values[key];

  if (value === '' || value === null || value === undefined) {
    return emptyAsNull ? null : 0;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const createBaseUserProfile = async (user, formValues = {}) => {
  if (!isFirebaseConfigured || !db || !user) {
    throw new Error('Firebase must be configured before profile creation.');
  }

  const userRef = doc(db, 'users', user.uid);
  const existingUserSnapshot = await getDoc(userRef);
  const existingUser = existingUserSnapshot.exists() ? existingUserSnapshot.data() : null;
  const mergedValues = {
    ...existingUser,
    ...formValues
  };
  const resolvedRole = resolveAccountRole(user, mergedValues, existingUser);
  const baseProfile = {
    ...buildBaseProfile(
      user,
      {
        ...mergedValues,
        role: resolvedRole
      },
      existingUser
    ),
    profileComplete: resolvedRole === 'admin' ? true : existingUser?.profileComplete ?? false,
    createdAt: existingUser?.createdAt ?? getCreatedAtValue(user)
  };

  await setDoc(userRef, baseProfile, { merge: true });
  return baseProfile;
};

export const createOrUpdateUserProfile = async (user, formValues) => {
  if (!isFirebaseConfigured || !db || !user) {
    throw new Error('Firebase must be configured before profile creation.');
  }

  const userRef = doc(db, 'users', user.uid);
  const labourRef = doc(db, 'labours', user.uid);
  const clientRef = doc(db, 'clients', user.uid);
  const existingUserSnapshot = await getDoc(userRef);
  const existingUser = existingUserSnapshot.exists() ? existingUserSnapshot.data() : null;
  const resolvedRole = resolveAccountRole(user, formValues, existingUser);
  const mergedBaseValues = {
    ...existingUser,
    ...formValues,
    role: resolvedRole
  };
  const baseProfile = {
    ...buildBaseProfile(user, mergedBaseValues, existingUser),
    role: resolvedRole,
    coordinates:
      normalizeCoordinates(formValues.coordinates) ||
      normalizeCoordinates(existingUser?.coordinates) ||
      null,
    accountStatus: existingUser?.accountStatus || 'active',
    verified: existingUser?.verified ?? false,
    profileComplete: true
  };

  await setDoc(
    userRef,
    {
      ...baseProfile,
      createdAt: existingUser?.createdAt ?? getCreatedAtValue(user)
    },
    { merge: true }
  );

  if (resolvedRole === 'labour') {
    const existingLabourSnapshot = await getDoc(labourRef);
    const existingLabour = existingLabourSnapshot.exists() ? existingLabourSnapshot.data() : null;

    await setDoc(
      labourRef,
      {
        ...baseProfile,
        category:
          getFormValue(formValues, 'category', existingLabour?.category) ||
          normalizeCommaSeparated(
            getFormValue(formValues, 'skills', existingLabour?.skills || formValues.category || '')
          )[0] ||
          '',
        gender: getFormValue(formValues, 'gender', existingLabour?.gender || ''),
        age: getNumericFormValue(formValues, 'age', existingLabour?.age ?? null, { emptyAsNull: true }),
        education: getFormValue(formValues, 'education', existingLabour?.education || ''),
        experienceYears: getNumericFormValue(
          formValues,
          'experienceYears',
          existingLabour?.experienceYears ?? 0
        ),
        skills: hasFormValue(formValues, 'skills')
          ? normalizeCommaSeparated(formValues.skills || formValues.category)
          : (existingLabour?.skills ?? []),
        languages: hasFormValue(formValues, 'languages')
          ? normalizeCommaSeparated(formValues.languages)
          : (existingLabour?.languages ?? []),
        currentLocation: getFormValue(
          formValues,
          'currentLocation',
          existingLabour?.currentLocation || existingUser?.location || ''
        ),
        coordinates:
          normalizeCoordinates(formValues.coordinates) ||
          normalizeCoordinates(existingLabour?.coordinates) ||
          normalizeCoordinates(existingUser?.coordinates) ||
          null,
        about: getFormValue(formValues, 'about', existingLabour?.about || ''),
        availability: getFormValue(
          formValues,
          'availability',
          existingLabour?.availability || 'Available'
        ),
        dailyWage: getNumericFormValue(formValues, 'dailyWage', existingLabour?.dailyWage ?? 0),
        previousWorkHistory: hasFormValue(formValues, 'previousWorkHistory')
          ? normalizeCommaSeparated(formValues.previousWorkHistory)
          : (existingLabour?.previousWorkHistory ?? []),
        verified: existingLabour?.verified ?? false,
        rating: existingLabour?.rating ?? 0,
        reviewsCount: existingLabour?.reviewsCount ?? 0,
        completedJobs: existingLabour?.completedJobs ?? 0
      },
      { merge: true }
    );
  }

  if (resolvedRole === 'client') {
    const existingClientSnapshot = await getDoc(clientRef);
    const existingClient = existingClientSnapshot.exists() ? existingClientSnapshot.data() : null;

    await setDoc(
      clientRef,
      {
        ...baseProfile,
        coordinates:
          normalizeCoordinates(formValues.coordinates) ||
          normalizeCoordinates(existingClient?.coordinates) ||
          normalizeCoordinates(existingUser?.coordinates) ||
          null,
        savedLabours: existingClient?.savedLabours ?? []
      },
      { merge: true }
    );
  }

  return baseProfile;
};

export const logoutUser = async () => {
  if (!auth) {
    return;
  }

  await signOut(auth);
};
