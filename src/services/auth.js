import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { ref, serverTimestamp, set } from 'firebase/database';
import { auth, database } from './firebase';

const DEFAULT_ADMIN_EMAIL = 'admin_pcos@pcos.com';
const RETIRED_ADMIN_EMAILS = ['admin@pcos.com'];
const configuredAdminEmail = (process.env.REACT_APP_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();

export const ADMIN_EMAIL = RETIRED_ADMIN_EMAILS.includes(configuredAdminEmail)
  ? DEFAULT_ADMIN_EMAIL
  : configuredAdminEmail;

const isAdminEmail = (email) => email.trim().toLowerCase() === ADMIN_EMAIL;
const isRetiredAdminEmail = (email) => RETIRED_ADMIN_EMAILS.includes(email.trim().toLowerCase());

export const createCustomerAccount = async ({ name, email, password }) => {
  if (isAdminEmail(email)) {
    throw new Error('This email is reserved for the single admin account.');
  }

  if (isRetiredAdminEmail(email)) {
    throw new Error('This staff account has been retired.');
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await set(ref(database, `users/${credential.user.uid}`), {
    name,
    email: credential.user.email,
    role: 'customer',
    createdAt: serverTimestamp()
  });

  return credential.user;
};

export const loginCustomer = async ({ email, password }) => {
  if (isRetiredAdminEmail(email)) {
    throw new Error('This staff account has been retired.');
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);

  if (isAdminEmail(credential.user.email || '')) {
    await signOut(auth);
    throw new Error('Use the admin/staff login for this account.');
  }

  return credential.user;
};

export const loginAdmin = async ({ email, password }) => {
  if (isRetiredAdminEmail(email)) {
    throw new Error('This staff account has been retired.');
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);

  if (!isAdminEmail(credential.user.email || '')) {
    await signOut(auth);
    throw new Error(`Only ${ADMIN_EMAIL} can use the admin/staff account.`);
  }

  return credential.user;
};

export const logoutUser = () => signOut(auth);
