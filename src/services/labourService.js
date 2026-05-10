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
import {
  labourMatchesCategory,
  labourMatchesServiceQuery,
  recommendLabours
} from '../utils/recommendations';
import { workCategories } from '../utils/constants';
import { buildLocationCacheKey } from '../utils/location';

const SEARCH_RESULT_LIMIT = 80;
const SEARCH_CACHE_TTL_MS = 30000;
const labourSearchCache = new Map();
const debugLabourSearch = (message, payload = {}) => {
  console.debug(`[WorkLink labour search] ${message}`, payload);
};

const buildSearchCacheKey = (filters, resolvedCategory, origin) =>
  JSON.stringify({
    skill: String(filters.skill ?? '').trim().toLowerCase(),
    category: String(filters.category ?? '').trim().toLowerCase(),
    resolvedCategory: String(resolvedCategory ?? '').trim().toLowerCase(),
    availability: String(filters.availability ?? '').trim().toLowerCase(),
    minRating: String(filters.minRating ?? '').trim(),
    minExperience: String(filters.minExperience ?? '').trim(),
    maxPrice: String(filters.maxPrice ?? '').trim(),
    origin: buildLocationCacheKey(origin)
  });

const getCachedSearchResults = (cacheKey) => {
  const cachedEntry = labourSearchCache.get(cacheKey);

  if (!cachedEntry) {
    return null;
  }

  if (Date.now() - cachedEntry.createdAt > SEARCH_CACHE_TTL_MS) {
    labourSearchCache.delete(cacheKey);
    return null;
  }

  return cachedEntry;
};

const cacheSearchResults = (cacheKey, payload) => {
  labourSearchCache.set(cacheKey, {
    createdAt: Date.now(),
    ...payload
  });

  if (labourSearchCache.size <= 40) {
    return;
  }

  const oldestKey = labourSearchCache.keys().next().value;

  if (oldestKey) {
    labourSearchCache.delete(oldestKey);
  }
};

const fetchLabourCandidates = async (filters, resolvedCategory) => {
  const shouldUseCategoryConstraint = Boolean(resolvedCategory && !filters.skill);
  const attempts = [
    () => {
      const constraints = [];

      if (filters.availability) {
        constraints.push(where('availability', '==', filters.availability));
      }

      if (shouldUseCategoryConstraint) {
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

      debugLabourSearch('candidate query succeeded', {
        filters,
        resolvedCategory,
        count: snapshot.size
      });

      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch (error) {
      lastError = error;
      console.warn('[WorkLink labour search] candidate query failed', {
        code: error?.code,
        message: error?.message,
        filters,
        resolvedCategory
      });

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
    return [];
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
  const resolvedCategory = filters.category || resolveCategoryFromSkill(filters.skill);
  const cacheKey = buildSearchCacheKey(filters, resolvedCategory, origin);
  const cachedEntry = getCachedSearchResults(cacheKey);

  if (cachedEntry?.results) {
    return cachedEntry.results;
  }

  if (cachedEntry?.requestPromise) {
    return cachedEntry.requestPromise;
  }

  const requestPromise = (async () => {
    if (!isFirebaseConfigured || !db) {
      return [];
    }

    const items = await fetchLabourCandidates(filters, resolvedCategory);
    debugLabourSearch('ranking candidates', {
      filters,
      resolvedCategory,
      origin,
      candidateCount: items.length
    });

    return recommendLabours(items, filters, origin)
      .filter((labour) => {
        const matchesSkill = filters.skill ? labourMatchesServiceQuery(labour, filters.skill) : true;
        const matchesCategory = filters.category
          ? labourMatchesCategory(labour, filters.category)
          : true;
        const matchesService =
          filters.skill && filters.category
            ? matchesSkill || matchesCategory
            : matchesSkill && matchesCategory;
        const matchesPrice = filters.maxPrice ? labour.dailyWage <= Number(filters.maxPrice) : true;
        const matchesExperience = filters.minExperience
          ? labour.experienceYears >= Number(filters.minExperience)
          : true;
        const matchesRating = filters.minRating ? labour.rating >= Number(filters.minRating) : true;

        return matchesService && matchesPrice && matchesExperience && matchesRating;
      })
      .slice(0, SEARCH_RESULT_LIMIT);
  })();

  cacheSearchResults(cacheKey, { requestPromise });

  try {
    const results = await requestPromise;
    cacheSearchResults(cacheKey, { results });
    return results;
  } catch (error) {
    labourSearchCache.delete(cacheKey);
    throw error;
  }
};

export const getLabourById = async (labourId) => {
  if (!labourId) {
    return null;
  }

  if (!isFirebaseConfigured || !db) {
    return null;
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
    onNext(null);
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
