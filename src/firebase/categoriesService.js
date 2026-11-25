import {
  collection,
  getDocs,
  serverTimestamp,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

import { db } from './firebase';

export const addNewCategory = async (userId, icon, isDefault, name) => {

    const categoryRef = collection(
        db,
        'users',
        userId,
        'categories'
    )

    const category = {
        name: name,
        isDefault: isDefault,
        icon: icon,
        createdAt: serverTimestamp(),
    };

    const documentRef = await addDoc(categoryRef, category);

    return documentRef.id;

};

export const getAllCategories = async (userId) => {
  const categoryRef = collection(
    db,
    'users',
    userId,
    'categories'
  );

  const snapshot = await getDocs(categoryRef);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
};

export const deleteCategory = async (userId, categoryId) => {
  const categoryRef = doc(
    db,
    'users',
    userId,
    'categories',
    categoryId
  );

  await deleteDoc(categoryRef);
};