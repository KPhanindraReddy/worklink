import {
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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

  const baseProfile = {
    ...buildBaseProfile(user, formValues),
    profileComplete: true
  };

  await setDoc(
    doc(db, 'users', user.uid),
    {
      ...baseProfile,
      createdAt: getCreatedAtValue(user)
    },
    { merge: true }
  );

  if (formValues.role === 'labour') {
    await setDoc(
      doc(db, 'labours', user.uid),
      {
        ...baseProfile,
        category: formValues.category || normalizeCommaSeparated(formValues.skills || formValues.category)[0] || '',
        gender: formValues.gender || '',
        age: Number(formValues.age) || null,
        education: formValues.education || '',
        experienceYears: Number(formValues.experienceYears) || 0,
        skills: normalizeCommaSeparated(formValues.skills || formValues.category),
        languages: normalizeCommaSeparated(formValues.languages),
        currentLocation: formValues.currentLocation || '',
        about: formValues.about || '',
        availability: formValues.availability || 'Available',
        dailyWage: Number(formValues.dailyWage) || 0,
        previousWorkHistory: normalizeCommaSeparated(formValues.previousWorkHistory),
        rating: 0,
        reviewsCount: 0,
        completedJobs: 0
      },
      { merge: true }
    );
  }

  if (formValues.role === 'client') {
    await setDoc(
      doc(db, 'clients', user.uid),
      {
        ...baseProfile,
        savedLabours: []
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
