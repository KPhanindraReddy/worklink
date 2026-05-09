import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mockLabours } from '../data/mockData';
import { recommendLabours } from '../utils/recommendations';
import { workCategories } from '../utils/constants';

const SEARCH_RESULT_LIMIT = 80;
const fetchLabourCandidates = async (filters, resolvedCategory) => {
  const attempts = [
    () => {
      const constraints = [];

      if (filters.availability) {
        constraints.push(where('availability', '==', filters.availability));
      }

      if (resolvedCategory) {
        constraints.push(where('category', '==', resolvedCategory));
      }

      constraints.push(limit(SEARCH_RESULT_LIMIT));
      return getDocs(query(collection(db, 'labours'), ...constraints));
    },
    () => {
      if (!filters.availability) {
        return null;
      }

      return getDocs(
        query(
          collection(db, 'labours'),
          where('availability', '==', filters.availability),
          limit(SEARCH_RESULT_LIMIT)
        )
      );
    },
    () => getDocs(query(collection(db, 'labours'), limit(SEARCH_RESULT_LIMIT)))
  ];

  let lastError = null;

  for (const runAttempt of attempts) {
    try {
      const snapshot = await runAttempt();

      if (!snapshot) {
        continue;
      }

      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch (error) {
      lastError = error;

      if (error?.code !== 'failed-precondition') {
        throw error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
};

const normalizeSearchValue = (value) => String(value ?? '').trim().toLowerCase();
const resolveCategoryFromSkill = (skill) => {
  const normalizedSkill = normalizeSearchValue(skill);

  if (!normalizedSkill) {
    return '';
  }

  return (
    workCategories.find((category) => {
      const normalizedCategory = normalizeSearchValue(category);
      return normalizedCategory === normalizedSkill || normalizedSkill.includes(normalizedCategory);
    }) ?? ''
  );
};

export const fetchFeaturedLabours = async (count = 6) => {
  if (!isFirebaseConfigured || !db) {
    return mockLabours.slice(0, count);
  }

  const labourQuery = query(
    collection(db, 'labours'),
    orderBy('rating', 'desc'),
    limit(count)
  );
  const snapshot = await getDocs(labourQuery);

  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const searchLabours = async (filters = {}, origin) => {
  if (!isFirebaseConfigured || !db) {
    return recommendLabours(mockLabours, filters, origin).slice(0, SEARCH_RESULT_LIMIT);
  }

  const resolvedCategory = filters.category || resolveCategoryFromSkill(filters.skill);
  const items = await fetchLabourCandidates(filters, resolvedCategory);

  return recommendLabours(items, filters, origin).filter((labour) => {
    const matchesSkill = filters.skill
      ? labour.skills?.some((entry) =>
          entry.toLowerCase().includes(filters.skill.toLowerCase())
        )
      : true;
    const matchesCategory = filters.category ? labour.category === filters.category : true;
    const matchesPrice = filters.maxPrice ? labour.dailyWage <= Number(filters.maxPrice) : true;
    const matchesExperience = filters.minExperience
      ? labour.experienceYears >= Number(filters.minExperience)
      : true;
    const matchesRating = filters.minRating ? labour.rating >= Number(filters.minRating) : true;

    return matchesSkill && matchesCategory && matchesPrice && matchesExperience && matchesRating;
  }).slice(0, SEARCH_RESULT_LIMIT);
};

export const getLabourById = async (labourId) => {
  if (!labourId) {
    return null;
  }

  if (!isFirebaseConfigured || !db) {
    return mockLabours.find((labour) => labour.id === labourId) ?? null;
  }

  const snapshot = await getDoc(doc(db, 'labours', labourId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const subscribeLabourById = (labourId, onNext, onError) => {
  if (!labourId) {
    onNext(null);
    return () => {};
  }

  if (!isFirebaseConfigured || !db) {
    onNext(mockLabours.find((labour) => labour.id === labourId) ?? null);
    return () => {};
  }

  return onSnapshot(
    doc(db, 'labours', labourId),
    (snapshot) => {
      onNext(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    },
    onError
  );
};

export const updateLabourProfile = async (uid, payload) => {
  if (!uid || !isFirebaseConfigured || !db) {
    throw new Error('Firebase must be configured before updating labour profile.');
  }

  await setDoc(
    doc(db, 'labours', uid),
    {
      ...payload,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const updateAvailability = async (uid, availability) =>
  updateLabourProfile(uid, { availability });
