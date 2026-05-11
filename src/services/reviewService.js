import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { parseDateValue } from '../utils/formatters';

const sortReviewsByCreatedAtDesc = (items) =>
  [...items].sort((a, b) => {
    const dateA = parseDateValue(a.createdAt)?.getTime() ?? 0;
    const dateB = parseDateValue(b.createdAt)?.getTime() ?? 0;

    return dateB - dateA;
  });

export const subscribeReviewsForLabour = (labourId, onNext, onError) => {
  if (!labourId) {
    onNext([]);
    return () => {};
  }

  if (!isFirebaseConfigured || !db) {
    onNext([]);
    return () => {};
  }

  return onSnapshot(
    query(collection(db, 'reviews'), where('labourId', '==', labourId)),
    (snapshot) => {
      onNext(
        sortReviewsByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      );
    },
    onError
  );
};

export const submitServiceReview = async ({ bookingId, clientId, clientName, rating, comment }) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase must be configured before submitting reviews.');
  }

  const numericRating = Number(rating);
  const reviewComment = String(comment ?? '').trim();

  if (!bookingId || !clientId) {
    throw new Error('A completed booking is required before adding a review.');
  }

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error('Choose a rating from 1 to 5 stars.');
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  const reviewRef = doc(db, 'reviews', bookingId);

  await runTransaction(db, async (transaction) => {
    const [bookingSnapshot, reviewSnapshot] = await Promise.all([
      transaction.get(bookingRef),
      transaction.get(reviewRef)
    ]);

    if (!bookingSnapshot.exists()) {
      throw new Error('This completed service was not found.');
    }

    if (reviewSnapshot.exists() || bookingSnapshot.data().reviewRating) {
      throw new Error('This service has already been rated.');
    }

    const booking = bookingSnapshot.data();

    if (booking.clientId !== clientId) {
      throw new Error('Only the client who booked this service can rate it.');
    }

    if (booking.status !== 'completed') {
      throw new Error('You can rate the service after it is completed.');
    }

    const reviewPayload = {
      bookingId,
      clientId,
      clientName: clientName || booking.clientName || 'Client',
      labourId: booking.labourId,
      labourName: booking.labourName || '',
      serviceType: booking.serviceType || '',
      rating: numericRating,
      comment: reviewComment,
      createdAt: serverTimestamp()
    };

    transaction.set(reviewRef, reviewPayload);
    transaction.update(bookingRef, {
      reviewId: reviewRef.id,
      reviewRating: numericRating,
      reviewComment,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
};
