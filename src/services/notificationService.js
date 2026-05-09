import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mockNotifications } from '../data/mockData';

const sortNotificationsByCreatedAtDesc = (items) =>
  [...items].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);

    return dateB - dateA;
  });

export const getNotifications = async (userId) => {
  if (!userId) {
    return [];
  }

  if (!isFirebaseConfigured || !db) {
    return sortNotificationsByCreatedAtDesc(mockNotifications);
  }

  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(notificationsQuery);
  return sortNotificationsByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
};

export const subscribeNotifications = (userId, onNext, onError) => {
  if (!userId) {
    onNext([]);
    return () => {};
  }

  if (!isFirebaseConfigured || !db) {
    onNext(sortNotificationsByCreatedAtDesc(mockNotifications));
    return () => {};
  }

  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      onNext(
        sortNotificationsByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      );
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
