const errorCodeMap = {
  'auth/email-already-in-use': 'This email is already connected to another WorkLink account.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/invalid-credential': 'Your login details were not accepted. Please try again.',
  'auth/weak-password': 'Use a stronger password with at least 6 characters.',
  'auth/popup-closed-by-user': 'The Google login popup was closed before finishing.',
  'auth/too-many-requests': 'Too many attempts were detected. Please wait and try again.',
  'auth/invalid-verification-code': 'The OTP code is invalid. Please check and retry.',
  'auth/missing-phone-number': 'Add a valid phone number with country code.',
  'permission-denied':
    'Firestore permissions are blocking this action. Deploy the WorkLink Firestore rules or switch the database to test mode while setting up.'
};

export const getFirebaseErrorMessage = (error) =>
  errorCodeMap[error?.code] ?? error?.message ?? 'Something went wrong. Please try again.';
