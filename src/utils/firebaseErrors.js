const errorCodeMap = {
  'auth/email-already-in-use': 'This email is already connected to another WorkLink account.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/invalid-credential': 'Your login details were not accepted. Please try again.',
  'auth/weak-password': 'Use a stronger password with at least 6 characters.',
  'auth/popup-closed-by-user': 'The Google login popup was closed before finishing.',
  'auth/popup-blocked': 'The login popup was blocked by the browser. Allow popups for this site and try again.',
  'auth/cancelled-popup-request': 'Another login popup replaced the previous one. Try again once.',
  'auth/account-exists-with-different-credential':
    'This email already belongs to another sign-in method. Use that method first, then connect Google later.',
  'auth/operation-not-allowed':
    'This login method is not enabled in Firebase Authentication yet.',
  'auth/operation-not-supported-in-this-environment':
    'This browser blocked the popup flow. WorkLink will switch to a redirect-based login instead.',
  'auth/too-many-requests': 'Too many attempts were detected. Please wait and try again.',
  'auth/unauthorized-domain':
    'This domain is not approved in Firebase Authentication. Add it to the authorized domains list and try again.',
  'auth/invalid-verification-code': 'The OTP code is invalid. Please check and retry.',
  'auth/missing-phone-number': 'Add a valid phone number with country code.',
  'failed-precondition':
    'Firestore needs the latest rules or indexes. Deploy Firebase rules and indexes, then try again.',
  'permission-denied':
    'Firestore permissions are blocking this action. Deploy the WorkLink Firestore rules or switch the database to test mode while setting up.'
};

export const getFirebaseErrorMessage = (error) =>
  errorCodeMap[error?.code] ?? error?.message ?? 'Something went wrong. Please try again.';
