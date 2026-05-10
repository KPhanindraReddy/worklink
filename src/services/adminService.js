import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { workCategories } from '../utils/constants';

const DIRECTORY_PAGE_SIZE = 18;
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

export const listAdminProfiles = async ({
  role = 'labour',
  cursor = null,
  pageSize = DIRECTORY_PAGE_SIZE
} = {}) => {
  if (!isFirebaseConfigured || !db) {
    return {
      items: [],
      cursor: null,
      hasMore: false
    };
  }

  const collectionName = role === 'client' ? 'clients' : 'labours';
  const directoryQuery = query(
    collection(db, collectionName),
    orderBy('updatedAt', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(pageSize)
  );
  const snapshot = await getDocs(directoryQuery);

  return {
    items: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    cursor: snapshot.docs.at(-1) ?? null,
    hasMore: snapshot.docs.length === pageSize
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
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const banUser = async ({ userId, role } = {}) => {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  const payload = {
    accountStatus: 'banned',
    updatedAt: serverTimestamp()
  };

  await Promise.all([
    setDoc(doc(db, 'users', userId), payload, { merge: true }),
    ...(role === 'labour' ? [setDoc(doc(db, 'labours', userId), payload, { merge: true })] : []),
    ...(role === 'client' ? [setDoc(doc(db, 'clients', userId), payload, { merge: true })] : [])
  ]);
};
