const HIDDEN_ADMIN_EMAIL = 'admin@gmail.com';
const HIDDEN_ADMIN_FULL_NAME = 'admin';

const normalizeComparableValue = (value) => String(value ?? '').trim().toLowerCase();

export const isHiddenAdminAccount = (user, formValues = {}, existingProfile = null) => {
  const email = normalizeComparableValue(formValues.email || existingProfile?.email || user?.email);
  const fullName = normalizeComparableValue(
    formValues.fullName || existingProfile?.fullName || user?.displayName
  );

  return email === HIDDEN_ADMIN_EMAIL && fullName === HIDDEN_ADMIN_FULL_NAME;
};
