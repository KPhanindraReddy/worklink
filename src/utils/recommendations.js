import { clamp } from './formatters';

export const calculateHaversineDistance = (origin, target) => {
  if (
    origin?.latitude === undefined ||
    origin?.longitude === undefined ||
    target?.latitude === undefined ||
    target?.longitude === undefined
  ) {
    return null;
  }

  const toRadians = (degree) => (degree * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRadians(target.latitude - origin.latitude);
  const dLng = toRadians(target.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(target.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(a));
};

export const calculateMatchScore = (labour, filters = {}, origin) => {
  let score = 45;

  if (filters.skill && labour.skills?.some((item) => item.toLowerCase().includes(filters.skill.toLowerCase()))) {
    score += 18;
  }

  if (filters.category && labour.category === filters.category) {
    score += 15;
  }

  if (filters.availability && labour.availability === filters.availability) {
    score += 10;
  }

  if (filters.maxPrice && Number(labour.dailyWage) <= Number(filters.maxPrice)) {
    score += 8;
  }

  if (filters.minExperience && Number(labour.experienceYears) >= Number(filters.minExperience)) {
    score += 7;
  }

  if (filters.minRating && Number(labour.rating) >= Number(filters.minRating)) {
    score += 10;
  }

  const distance = calculateHaversineDistance(origin, labour.coordinates);
  if (distance !== null) {
    score += clamp(12 - distance / 3, 0, 12);
  }

  if (labour.verified) {
    score += 5;
  }

  return Math.round(clamp(score, 0, 100));
};

export const recommendLabours = (labours, filters, origin) =>
  [...labours]
    .map((labour) => ({
      ...labour,
      distanceKm: calculateHaversineDistance(origin, labour.coordinates),
      matchScore: calculateMatchScore(labour, filters, origin)
    }))
    .sort((a, b) => b.matchScore - a.matchScore || b.rating - a.rating);
