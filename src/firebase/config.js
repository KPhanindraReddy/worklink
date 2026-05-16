import { getAuth } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './env';
import { app } from './app';

export const auth = app ? getAuth(app) : null;

export { app, firebaseConfig, isFirebaseConfigured };
