import { getFirestore } from 'firebase/firestore';
import { app } from './app';

export const db = app ? getFirestore(app) : null;
