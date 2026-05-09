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
import { parseDateValue } from '../utils/formatters';

const debugNotifications = (message, payload = {}) => {
  console.debug(`[WorkLink notifications] ${message}`, payload);
};

const sortNotificationsByCreatedAtDesc = (items) =>
  [...items].sort((a, b) => {
    const dateA = parseDateValue(a.createdAt)?.getTime() ?? 0;
    const dateB = parseDateValue(b.createdAt)?.getTime() ?? 0;

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
    debugNotifications('skipped create because Firebase is not configured', {
      userId: payload?.userId,
      bookingId: payload?.bookingId
    });
    return null;
  }

  debugNotifications('create requested', {
    userId: payload.userId,
    senderId: payload.senderId,
    bookingId: payload.bookingId,
    type: payload.type
  });

  const reference = await addDoc(collection(db, 'notifications'), {
    ...payload,
    createdAt: serverTimestamp(),
    read: false
  });

  debugNotifications('create completed', {
    id: reference.id,
    userId: payload.userId,
    bookingId: payload.bookingId
  });

  return reference.id;
};
