import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

export const ensureUserProfile = async (user) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnapshot = await getDoc(userRef);

  // Don't overwrite an existing profile
  if (userSnapshot.exists()) {
    return userSnapshot.data();
  }

  const userData = {
    fullName: user.displayName || '',
    email: user.email || '',
    monthlyBudget: 0,
    currency: 'GBP',
    createdAt: serverTimestamp(),
  };
  
  await setDoc(userRef, userData);

  return userData;
};

export const getUserData = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
            return userSnapshot.data();
        }

        return null;
    } catch (error) {
        console.error('Error getting user data: ', error);
        throw error;
    }
};

export const updateUserData = async (userId, updatedData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updatedData);
  } catch (error) {
    console.error('Error updating user data: ', error);
    throw error;
  }
};

export const updateBudget = async (userId, newBudget) => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      monthlyBudget: newBudget
    });
    console.log("Budget updated!");
  } catch (error) {
    console.error("Error update user budget: ", error);
    throw error;
  }
};