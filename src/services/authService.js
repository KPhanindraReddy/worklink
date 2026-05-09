import {
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { appleProvider, auth, db, googleProvider, isFirebaseConfigured } from '../firebase/config';

let recaptchaVerifier = null;
const buildAvatarUrl = (fullName) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'WorkLink User')}&background=1d4ed8&color=ffffff`;
const getCreatedAtValue = (user) =>
  user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : serverTimestamp();

const buildBaseProfile = (user, formValues = {}) => {
  const fullName = formValues.fullName || user.displayName || 'WorkLink User';
  const profilePhotoUrl = formValues.profilePhotoUrl || user.photoURL || buildAvatarUrl(fullName);

  return {
    uid: user.uid,
    fullName,
    phoneNumber: formValues.phoneNumber || user.phoneNumber || '',
    email: formValues.email || user.email || '',
    profilePhoto: profilePhotoUrl,
    role: formValues.role || '',
    location: formValues.currentLocation || formValues.location || '',
    accountStatus: 'active',
    verified: false,
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

  const credentials = await signInWithPopup(auth, googleProvider);
  return credentials.user;
};

export const loginWithApple = async () => {
  if (!isFirebaseConfigured || !auth || !appleProvider) {
    throw new Error('Add Firebase keys in .env before using Apple login.');
  }

  const credentials = await signInWithPopup(auth, appleProvider);
  return credentials.user;
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

  const baseProfile = {
    ...buildBaseProfile(user, formValues),
    profileComplete: formValues.role === 'admin',
    createdAt: getCreatedAtValue(user)
  };

  await setDoc(doc(db, 'users', user.uid), baseProfile, { merge: true });
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
  const resolvedRole = existingUser?.role || formValues.role || '';
  const mergedBaseValues = {
    ...existingUser,
    ...formValues,
    role: resolvedRole
  };
  const baseProfile = {
    ...buildBaseProfile(user, mergedBaseValues),
    role: resolvedRole,
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
