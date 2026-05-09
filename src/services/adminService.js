import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mockAdminAnalytics, mockCategories, mockLabours } from '../data/mockData';

export const getAdminOverview = async () => {
  if (!isFirebaseConfigured || !db) {
    return {
      analytics: mockAdminAnalytics,
      categories: mockCategories,
      pendingLabours: mockLabours.filter((labour) => !labour.verified)
    };
  }

  const [usersSnapshot, laboursSnapshot, bookingsSnapshot] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'labours')),
    getDocs(collection(db, 'bookings'))
  ]);

  const pendingLabours = laboursSnapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((labour) => !labour.verified);

  return {
    analytics: {
      userCount: usersSnapshot.size,
      labourCount: laboursSnapshot.size,
      activeBookings: bookingsSnapshot.size,
      pendingVerifications: pendingLabours.length
    },
    categories: mockCategories,
    pendingLabours
  };
};

export const verifyLabourAccount = async (labourId) => {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  await updateDoc(doc(db, 'labours', labourId), {
    verified: true,
    verifiedAt: serverTimestamp()
  });

  await setDoc(
    doc(db, 'users', labourId),
    {
      verified: true,
      verifiedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const banUser = async (userId) => {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  await setDoc(
    doc(db, 'users', userId),
    {
      accountStatus: 'banned',
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};
