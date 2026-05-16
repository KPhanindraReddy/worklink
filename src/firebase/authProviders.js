import { GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { app } from './app';

export const googleProvider = app ? new GoogleAuthProvider() : null;
export const appleProvider = app ? new OAuthProvider('apple.com') : null;

if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

if (appleProvider) {
  appleProvider.addScope('email');
  appleProvider.addScope('name');
}
