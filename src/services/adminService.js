import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { workCategories } from '../utils/constants';

const fallbackCategories = workCategories.map((category, index) => ({
  id: `category-${index + 1}`,
  name: category,
  openRequests: 0,
  trending: false
}));

export const getAdminOverview = async () => {
  if (!isFirebaseConfigured || !db) {
    return {
      analytics: {
        userCount: 0,
        labourCount: 0,
        activeBookings: 0,
        pendingVerifications: 0
      },
      categories: fallbackCategories,
      pendingLabours: []
    };
  }

  const pendingLaboursQuery = query(
    collection(db, 'labours'),
    where('verified', '==', false),
    limit(24)
  );
  const [usersCountSnapshot, laboursCountSnapshot, bookingsCountSnapshot, pendingCountSnapshot, pendingLaboursSnapshot] = await Promise.all([
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(collection(db, 'labours')),
    getCountFromServer(collection(db, 'bookings')),
    getCountFromServer(query(collection(db, 'labours'), where('verified', '==', false))),
    getDocs(pendingLaboursQuery)
  ]);

  const pendingLabours = pendingLaboursSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

  return {
    analytics: {
      userCount: usersCountSnapshot.data().count,
      labourCount: laboursCountSnapshot.data().count,
      activeBookings: bookingsCountSnapshot.data().count,
      pendingVerifications: pendingCountSnapshot.data().count
    },
    categories: fallbackCategories,
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
