import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  addDoc,
  getCountFromServer,
} from 'firebase/firestore';

import { db } from './firebase';


export const getMonthlyExpenses = async (
  userId,
  selectedMonth = new Date()
) => {
  const startOfMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1
  );

  const startOfNextMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    1
  );

  const transactionsRef = collection(
    db,
    'users',
    userId,
    'transactions'
  );

  const expensesQuery = query(
    transactionsRef,
    where('date', '>=', Timestamp.fromDate(startOfMonth)),
    where('date', '<', Timestamp.fromDate(startOfNextMonth))
  );

  const snapshot = await getDocs(expensesQuery);

  let total = 0;

  snapshot.forEach((document) => {
    const expense = document.data();
    total += Number(expense.amount) || 0;
  });

  return total;
};

export const getRecentTransactions = async (userId) => {
  const transactionsRef = collection(
    db,
    'users',
    userId,
    'transactions'
  );

  const recentQuery = query(
    transactionsRef,
    orderBy('date', 'desc'),
    limit(5)
  );

  const snapshot = await getDocs(recentQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
};

export const getCategories = async (userId) => {
  const categoriesRef = collection(
    db,
    'users',
    userId,
    'categories'
  );

  const snapshot = await getDocs(categoriesRef);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
};


export const addExpense = async (
  userId,
  category,
  note,
  amount,
  expenseDate = null
) => {
  const transactionsRef = collection(
    db,
    'users',
    userId,
    'transactions'
  );

  const parsedDate = expenseDate
    ? new Date(`${expenseDate}T12:00:00`)
    : new Date();

  const validDate = isNaN(parsedDate.getTime())
    ? new Date()
    : parsedDate;

  const expenseData = {
    amount: Number(amount),
    categoryId: category.id,
    categoryName: category.name,
    icon: category.icon,
    note: (note || '').trim(),
    date: Timestamp.fromDate(validDate),
    createdAt: serverTimestamp(),
  };

  const documentRef = await addDoc(
    transactionsRef,
    expenseData
  );

  return documentRef.id;
};



export const getSpendingByCategories = async (
  userId,
  selectedMonth = new Date()
) => {
  const startOfMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1
  );

  const startOfNextMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    1
  );

  const transactionsRef = collection(
    db,
    'users',
    userId,
    'transactions'
  );

  const monthlyQuery = query(
    transactionsRef,
    where('date', '>=', Timestamp.fromDate(startOfMonth)),
    where('date', '<', Timestamp.fromDate(startOfNextMonth))
  );

  const snapshot = await getDocs(monthlyQuery);

  const categoryTotals = {};

  snapshot.docs.forEach((document) => {
    const transaction = document.data();

    const categoryName = transaction.categoryName || 'Other';
    const categoryIcon = transaction.icon || 'Other';
    const amount = Number(transaction.amount) || 0;

    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = {
        amount: 0,
        icon: categoryIcon,
      };
    }

    categoryTotals[categoryName].amount += amount;
  });

  const totalSpending = Object.values(categoryTotals)
    .reduce((sum, category) => sum + category.amount, 0);

  return Object.entries(categoryTotals)
    .map(([categoryName, category]) => ({
      categoryName,
      icon: category.icon,
      amount: category.amount,
      percentage: totalSpending > 0
        ? (category.amount / totalSpending) * 100
        : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const getAllTransactions = async (userId) => {
  const transactionsRef = collection(
    db,
    'users',
    userId,
    'transactions',
  );

  const recentQuery = query(
    transactionsRef,
    orderBy('date', 'desc'),
  );

  const snapshot = await getDocs(recentQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
};

export const getNumberOfExpense = async (userId) => {
  const transactionsRef = collection(
    db,
    'users',
    userId,
    'transactions'
  );

  const snapshot = await getCountFromServer(transactionsRef);

  return snapshot.data().count;
};


export const getDailyExpenses = async (
  userId,
  selectedMonth = new Date()
) => {
  const startOfMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1
  );

  const startOfNextMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    1
  );

  const transactionsRef = collection(
    db,
    'users',
    userId,
    'transactions'
  );

  const dailyQuery = query(
    transactionsRef,
    where('date', '>=', Timestamp.fromDate(startOfMonth)),
    where('date', '<', Timestamp.fromDate(startOfNextMonth))
  );

  const snapshot = await getDocs(dailyQuery);

  const daysInMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0
  ).getDate();

  const dailyTotals = Array(daysInMonth).fill(0);

  snapshot.docs.forEach((document) => {
    const transaction = document.data();

    const date = transaction.date.toDate();
    const dayIndex = date.getDate() - 1;

    dailyTotals[dayIndex] += Number(transaction.amount) || 0;
  });

  return dailyTotals.map((amount, index) => ({
    label: index + 1,
    amount,
  }));
};

export const getSpendingByCategoriesDaily = async (userId, selectedDate) => {
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);

  const transactionsRef = collection(
    db,
    'users',
    userId,
    'transactions'
  );

  const dailyQuery = query(
    transactionsRef,
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    where('date', '<', Timestamp.fromDate(startOfNextDay))
  );

  const snapshot = await getDocs(dailyQuery);

  const categoryTotals = {};

  snapshot.docs.forEach((document) => {
    const transaction = document.data();

    const categoryName = transaction.categoryName || 'Other';
    const categoryIcon = transaction.icon || 'Other';
    const amount = Number(transaction.amount) || 0;

    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = {
        amount: 0,
        icon: categoryIcon,
      };
    }

    categoryTotals[categoryName].amount += amount;
  });

  const totalSpending = Object.values(categoryTotals)
    .reduce((sum, category) => sum + category.amount, 0);

  return Object.entries(categoryTotals)
    .map(([categoryName, category]) => ({
      categoryName,
      icon: category.icon,
      amount: category.amount,
      percentage: totalSpending > 0
        ? (category.amount / totalSpending) * 100
        : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};