import { initializeApp } from 'firebase/app';
import { firebaseConfig, isFirebaseConfigured } from './env';

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
