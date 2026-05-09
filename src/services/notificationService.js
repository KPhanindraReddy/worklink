import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mockNotifications } from '../data/mockData';

export const getNotifications = async (userId) => {
  if (!userId) {
    return [];
  }

  if (!isFirebaseConfigured || !db) {
    return mockNotifications;
  }

  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(notificationsQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const subscribeNotifications = (userId, onNext, onError) => {
  if (!userId) {
    onNext([]);
    return () => {};
  }

  if (!isFirebaseConfigured || !db) {
    onNext(mockNotifications);
    return () => {};
  }

  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      onNext(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError
  );
};

export const createNotification = async (payload) => {
  if (!isFirebaseConfigured || !db) {
    return null;
  }

  const reference = await addDoc(collection(db, 'notifications'), {
    ...payload,
    createdAt: serverTimestamp(),
    read: false
  });

  return reference.id;
};
