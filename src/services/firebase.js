import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyCT_NZyqQCrHGQe21A6z5OD7aXVcCnAyHs',
  authDomain: 'pcos-13ab2.firebaseapp.com',
  databaseURL: 'https://pcos-13ab2-default-rtdb.firebaseio.com',
  projectId: 'pcos-13ab2',
  storageBucket: 'pcos-13ab2.firebasestorage.app',
  messagingSenderId: '419464959251',
  appId: '1:419464959251:web:aacf2bfb8e69aab294b6e6',
  measurementId: 'G-N462BF5L7V'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

export const analyticsPromise =
  typeof window !== 'undefined'
    ? isSupported()
        .then((supported) => (supported ? getAnalytics(app) : null))
        .catch(() => null)
    : Promise.resolve(null);
