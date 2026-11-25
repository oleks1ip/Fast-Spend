import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { auth } from './firebase';

// Register a new user
export const registerUser = async (fullName, email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  const credential = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );

  await updateProfile(credential.user, {
    displayName: fullName.trim(),
  });

  return credential.user;
};

// Log in an existing user
export const loginUser = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  const credential = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );

  return credential.user;
};

// Log out the current user
export const logoutUser = async () => {
  await signOut(auth);
};
