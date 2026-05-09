import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mockBookings } from '../data/mockData';
import { parseDateValue } from '../utils/formatters';

const debugBookingService = (message, payload = {}) => {
  console.debug(`[WorkLink booking service] ${message}`, payload);
};

const sortBookingsByAppointmentDesc = (items) =>
  [...items].sort((a, b) => {
    const dateA = parseDateValue(a.appointmentAt)?.getTime() ?? 0;
    const dateB = parseDateValue(b.appointmentAt)?.getTime() ?? 0;

    return dateB - dateA;
  });

const buildUserBookingsQuery = (userId, role) => {
  const key = role === 'labour' ? 'labourId' : 'clientId';

  return query(
    collection(db, 'bookings'),
    where(key, '==', userId)
  );
};

export const getBookingsForUser = async ({ userId, role }) => {
  if (!userId || !role) {
    return [];
  }

  if (!isFirebaseConfigured || !db) {
    return mockBookings.filter(
      (item) => item[role === 'labour' ? 'labourId' : 'clientId'] === userId
    );
  }

  const bookingQuery = buildUserBookingsQuery(userId, role);

  const snapshot = await getDocs(bookingQuery);
  return sortBookingsByAppointmentDesc(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
};

export const subscribeBookingsForUser = ({ userId, role }, onNext, onError) => {
  if (!userId || !role) {
    onNext([]);
    return () => {};
  }

  if (!isFirebaseConfigured || !db) {
    onNext(
      sortBookingsByAppointmentDesc(
        mockBookings.filter(
          (item) => item[role === 'labour' ? 'labourId' : 'clientId'] === userId
        )
      )
    );
    return () => {};
  }

  const bookingQuery = buildUserBookingsQuery(userId, role);

  return onSnapshot(
    bookingQuery,
    (snapshot) => {
      onNext(sortBookingsByAppointmentDesc(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))));
    },
    onError
  );
};

export const createBooking = async (payload) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase must be configured before creating bookings.');
  }

  const bookingRef = doc(collection(db, 'bookings'));
  const labourRef = doc(db, 'labours', payload.labourId);
  debugBookingService('create booking transaction started', {
    bookingId: bookingRef.id,
    clientId: payload.clientId,
    labourId: payload.labourId,
    serviceType: payload.serviceType
  });

  await runTransaction(db, async (transaction) => {
    const labourSnapshot = await transaction.get(labourRef);

    if (!labourSnapshot.exists()) {
      throw new Error('Selected labour profile is no longer available.');
    }

    const labour = labourSnapshot.data();

    if (labour.availability !== 'Available') {
      throw new Error(`${labour.fullName || 'Selected labour'} is busy right now. Choose another available worker.`);
    }

    transaction.set(bookingRef, {
      ...payload,
      status: 'pending',
      otpStatus: 'waiting',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  debugBookingService('create booking transaction completed', {
    bookingId: bookingRef.id,
    labourId: payload.labourId
  });

  return bookingRef.id;
};

export const updateBookingStatus = async (bookingId, status, extra = {}) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase must be configured before updating bookings.');
  }

  debugBookingService('update status requested', {
    bookingId,
    status,
    extraKeys: Object.keys(extra)
  });

  await updateDoc(doc(db, 'bookings', bookingId), {
    status,
    ...extra,
    updatedAt: serverTimestamp()
  });
};

export const startBookingWork = async ({ bookingId, labourId, otp }) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase must be configured before starting bookings.');
  }

  const normalizedOtp = String(otp ?? '').trim();
  const bookingRef = doc(db, 'bookings', bookingId);
  const labourRef = doc(db, 'labours', labourId);
  const userRef = doc(db, 'users', labourId);
  debugBookingService('start work transaction started', { bookingId, labourId });

  await runTransaction(db, async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);

    if (!bookingSnapshot.exists()) {
      throw new Error('Booking was not found.');
    }

    const booking = bookingSnapshot.data();

    if (booking.labourId !== labourId) {
      throw new Error('This booking does not belong to your labour account.');
    }

    if (booking.status !== 'accepted') {
      throw new Error('Only accepted bookings can be started with OTP.');
    }

    if (!booking.startOtp || booking.startOtp !== normalizedOtp) {
      throw new Error('The OTP does not match. Ask the client for the latest start OTP.');
    }

    transaction.update(bookingRef, {
      status: 'in_progress',
      otpStatus: 'verified',
      startedAt: serverTimestamp(),
      startOtpVerifiedAt: serverTimestamp(),
      workStartedBy: labourId,
      updatedAt: serverTimestamp()
    });

    transaction.set(
      labourRef,
      {
        availability: 'Busy',
        activeBookingId: bookingId,
        busySince: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    transaction.set(
      userRef,
      {
        availability: 'Busy',
        activeBookingId: bookingId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  });
  debugBookingService('start work transaction completed', { bookingId, labourId });
};

export const completeBookingWork = async ({ bookingId, labourId }) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase must be configured before completing bookings.');
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  const labourRef = doc(db, 'labours', labourId);
  const userRef = doc(db, 'users', labourId);
  debugBookingService('complete work transaction started', { bookingId, labourId });

  await runTransaction(db, async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);

    if (!bookingSnapshot.exists()) {
      throw new Error('Booking was not found.');
    }

    const booking = bookingSnapshot.data();

    if (booking.labourId !== labourId) {
      throw new Error('This booking does not belong to your labour account.');
    }

    if (booking.status !== 'in_progress') {
      throw new Error('Only in-progress bookings can be completed.');
    }

    transaction.update(bookingRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      completedBy: labourId,
      updatedAt: serverTimestamp()
    });

    transaction.set(
      labourRef,
      {
        availability: 'Available',
        activeBookingId: '',
        busySince: null,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    transaction.set(
      userRef,
      {
        availability: 'Available',
        activeBookingId: '',
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  });
  debugBookingService('complete work transaction completed', { bookingId, labourId });
};
