// ========================================
// ============= IMPORTS ==================
// ========================================

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { icons } from '../theme/icons';
import NavigationBar from '../components/navigationBar';
import { colors } from '../theme/colors';
import { auth } from '../firebase/firebase';
import { getUserData } from '../firebase/userServise';
import { getMonthlyExpenses, getRecentTransactions, addExpense } from '../firebase/transactionService';
import QuickAddButton from '../components/quickAddButton';
import { scanReceipt } from '../firebase/receiptService';
import { getAllCategories } from '../firebase/categoriesService';

// ========================================
// ============= HOME SCREEN ==============
// ========================================

export default function HomeScreen({ navigation }) {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [receiptImage, setReceiptImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [scanError, setScanError] = useState(null);

  const refreshData = async () => {
    const user = auth.currentUser;

    if (!user) return;

    try {
      const data = await getUserData(user.uid);
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user:', error);
    }

    try {
      const total = await getMonthlyExpenses(user.uid);
      setMonthlySpent(total);
    } catch (error) {
      console.error('Failed to load monthly expenses:', error);
    }

    try {
      const recent = await getRecentTransactions(user.uid);
      setRecentTransactions(recent);
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
    }
  };

  const takeReceiptPhoto = async () => {
    try {
      // Request camera permission
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        alert('Camera permission is required!');
        return;
      }

      // Open camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      // Save photo
      if (!result.canceled) {
        setReceiptImage(result.assets[0].uri);
      }

    } catch (error) {
      console.error('Camera error:', error);
      alert('Could not open camera.');
    }
  };


  const handleScanReceipt = async () => {
    console.log('1. SCAN BUTTON PRESSED');

    if (!receiptImage) {
      alert('Please take a receipt photo first.');
      return;
    }

    try {
      setIsScanning(true);
      setScanError(null);
      setReceiptData(null);

      const userId = auth.currentUser?.uid;

      console.log('2. User ID:', userId);

      if (!userId) {
        throw new Error('User is not logged in.');
      }

      const categories = await getAllCategories(userId);

      console.log('3. Categories from Firestore:', categories);

      if (!categories || categories.length === 0) {
        throw new Error('No categories found.');
      }

      const categoryNames = categories.map(
        category => category.name
      );

      console.log('4. Categories sent to Gemini:', categoryNames);

      const result = await scanReceipt(
        receiptImage,
        categoryNames
      );

      console.log('5. Gemini response:', result);

      setReceiptData(result);

    } catch (error) {
      console.error('Receipt scanning failed:', error);
      setScanError(error.message || 'Could not scan receipt.');
    } finally {
      setIsScanning(false);
    }
  };


  const handleSaveReceipt = async () => {
    try {
      const userId = auth.currentUser?.uid;

      if (!userId) {
        alert('Please log in first.');
        return;
      }

      if (!receiptData || !receiptData.amount) {
        alert('Receipt amount is missing.');
        return;
      }

      // Get the user's existing categories
      const categories = await getAllCategories(userId);

      // Find a category matching Gemini's result
      const matchedCategory = categories.find(
        (category) =>
          category.name.toLowerCase().trim() ===
          receiptData.category?.toLowerCase().trim()
      );

      if (!matchedCategory) {
        alert(
          `Category "${receiptData.category}" was not found. Please choose an existing category.`
        );
        return;
      }

      await addExpense(
        userId,
        matchedCategory,
        receiptData.storeName || 'Receipt',
        Number(receiptData.amount),
        receiptData.date
      );

      alert('Expense saved successfully!');

      setReceiptData(null);
      setReceiptImage(null);

      await refreshData();

    } catch (error) {
      console.error('Saving receipt error:', error);
      alert('Could not save expense.');
    }
  };

  useFocusEffect(
      useCallback(() => {
          refreshData();
      }, [])
  );

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const monthName = new Date().toLocaleDateString('en-GB', {
    month: 'long',
  });
  
  const fullName = userData?.fullName || 'User';
  const fullNameSplit = fullName.trim().split(/\s+/);

  const firstName = fullNameSplit[0];
  const initials = fullNameSplit
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const monthlyBudget = Number(userData?.monthlyBudget) || 0;
  const currency = userData?.currency || 'GBP';
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  const hasBudget =  monthlyBudget > 0;

  const spending = Number(monthlySpent) || 0;

  const remainingBudget = monthlyBudget - spending;

  const rawPercent = hasBudget
    ? (spending / monthlyBudget) * 100
    : 0;

  const percent = Math.min(Math.max(rawPercent, 0), 100);

  const isLessLimit = rawPercent < 80;
  const isNearLimit = rawPercent >= 80 && rawPercent <= 100;
  const isOverLimit = rawPercent > 100;

  const limitBar = isLessLimit
    ? colors.inLimits
    : isNearLimit
      ? colors.nearLimits
      : colors.upperLimits;

  // ========================================
  // ============= SCREEN UI ================
  // ========================================

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ---- HEADER ---- */}

        <View style={styles.header}>
          <View>
            <Text style={styles.greetingTitle}>
              Good morning, {firstName}!
            </Text>

            <Text style={styles.greetingSubtitle}>
              {/* {userData?.fullName || 'User'} ·  */}
              {formattedDate}
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials}
            </Text>
          </View>
        </View>


        {/* ---- BALANCE CARD ---- */}

        <View style={styles.mainCard}>

          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>
              Total spent · {monthName}
            </Text>
          </View>

          <Text style={styles.totalAmount}>
            {formatMoney(monthlySpent)}
          </Text>

          <View style={styles.divider} />

          {/* ---- BUDGET SECTION ---- */}

          {hasBudget ? (
            <>
              <View style={styles.budgetRow}>

              <View>
                <Text style={styles.budgetLabel}>
                  Left to spend
                </Text>

                <Text style={styles.budgetValue}>
                  {formatMoney(Math.max(0, remainingBudget))}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.budgetLabel}>
                  Monthly budget
                </Text>

                <Text style={styles.budgetValue}>
                  £{userData?.monthlyBudget}
                </Text>
              </View>

            </View>

            {/* ---- PROGRESS BAR ---- */}

            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${percent}%`,
                    backgroundColor: limitBar,
                  },
                ]}
              />
            </View>

            <Text style={styles.progressText}>
              {rawPercent.toFixed(1)}% used
            </Text>

            {isOverLimit && (
              <Text style={styles.overBudgetText}>
                You have exceeded your monthly budget.
              </Text>
            )}
            </>
          ) : (
            <Text style={styles.noBudgetText}>
              No budget set. You can set a monthly spending
              limit in Settings.
            </Text>
          )}

        </View>


        {/* ---- QUICK ADD EXPENSE ---- */}

        <TouchableOpacity
          style={styles.quickAddButton}
          activeOpacity={0.8}
          onPress={() => setIsModalOpen(true)}
        >
          <Text style={styles.quickAddButtonText}>
            + Quick Add Expense
          </Text>
        </TouchableOpacity>

        <QuickAddButton
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={refreshData}
        />


        {/* ---- SCAN BUTTONS ---- */}

        <View>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={takeReceiptPhoto}
          >

            <icons.ScanLine
              size={20}
              color={colors.primary}
              strokeWidth={2}
            />

            <Text style={styles.actionButtonText}>
              Scan Receipt
            </Text>
          </TouchableOpacity>

        </View>

        {/* ---- RECENT TRANSACTIONS ---- */}


        {receiptImage && (
          <View style={{ marginBottom: 20 }}>

            <Text style={styles.sectionTitle}>
              Receipt Preview
            </Text>

            <Image
              source={{ uri: receiptImage }}
              style={{
                width: '100%',
                height: 300,
                resizeMode: 'contain',
                borderRadius: 14,
              }}
            />

            <TouchableOpacity
              style={styles.quickAddButton}
              activeOpacity={0.8}
              onPress={handleScanReceipt}
              disabled={isScanning}
            >
              <Text style={styles.quickAddButtonText}>
                {isScanning ? 'Analysing receipt...' : 'Analyse Receipt'}
              </Text>
            </TouchableOpacity>

            {scanError && (
              <Text style={{ color: 'red', marginBottom: 12 }}>
                {scanError}
              </Text>
            )}

            {receiptData && (
              <View style={styles.mainCard}>
                <Text style={styles.cardHeaderTitle}>
                  Recognised receipt details
                </Text>

                <Text style={styles.budgetValue}>
                  Store: {receiptData.storeName || 'Unknown'}
                </Text>

                <Text style={styles.budgetValue}>
                  Date: {receiptData.date || 'Unknown'}
                </Text>

                <Text style={styles.totalAmount}>
                  {receiptData.amount != null
                    ? `${receiptData.amount} ${receiptData.currency || 'GBP'}`
                    : 'Amount not found'}
                </Text>

                <Text style={styles.budgetValue}>
                  Category: {receiptData.category || 'Other'}
                </Text>

                <TouchableOpacity
                  style={styles.quickAddButton}
                  activeOpacity={0.8}
                  onPress={handleSaveReceipt}
                >
                  <Text style={styles.quickAddButtonText}>
                    Save Expense
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        )}


        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Recent transactions
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.viewAllText}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length > 0 ? (
          recentTransactions.map((item) => (
            <View
              key={item.id}
              style={styles.transactionCard}
            >
              <View style={styles.transactionMain}>
                <Text style={styles.transactionTitle}>
                  {item.note?.trim() ||
                    item.subcategoryName ||
                    item.categoryName ||
                    'Expense'}
                </Text>

                {(item.note?.trim() && item.categoryName) ? (
                  <Text style={styles.transactionCategory}>
                    {item.categoryName}
                    {item.subcategoryName
                      ? ` · ${item.subcategoryName}`
                      : ''}
                  </Text>
                ) : item.subcategoryName ? (
                  <Text style={styles.transactionCategory}>
                    {item.categoryName || 'Other'}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.transactionAmount}>
                -{formatMoney(Number(item.amount) || 0)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No transactions yet.
          </Text>
        )}

      </ScrollView>


      {/* ---- NAVIGATION BAR ---- */}

      <NavigationBar
        activeScreen="Home"
        navigation={navigation}
      />

    </View>
  );
}


// ========================================
// ============= STYLES ===================
// ========================================

const styles = StyleSheet.create({

  // Main container
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.select({
      ios: 50,
      android: StatusBar.currentHeight || 24,
      default: 20,
    }),
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },

  greetingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  greetingSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBackground,
  },

  avatarText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Balance card
  mainCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardHeaderTitle: {
    color: colors.textLight,
    opacity: 0.9,
    fontSize: 13,
  },

  totalAmount: {
    color: colors.textLight,
    fontSize: 34,
    fontWeight: 'bold',
    marginVertical: 10,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 16,
  },

  // Budget
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  budgetLabel: {
    color: colors.textLight,
    opacity: 0.8,
    fontSize: 11,
  },

  budgetValue: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },

  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  progressText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 11,
  },

  noBudgetText: {
    color: colors.textLight,
    fontSize: 13,
  },

  overBudgetText: {
  color: colors.textLight,
  fontSize: 12,
  fontWeight: 'bold',
  marginTop: 8,
  },

  // Quick add
  quickAddButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },

  quickAddButtonText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 15,
  },

  // Voice and scan
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  actionButton: {
    flex: 0.48,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  actionButtonIcon: {
    height: 20,
    width: 20,
    marginRight: 8,
  },

  actionButtonText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },

  // Links
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },

  linkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Sections
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  viewAllText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  // Category placeholder
  // Category Breakdown
  categorySection: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },

  categoryItem: {
    marginBottom: 16,
  },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  categoryProgressBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },

  categoryProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  categoryPercentage: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
  },

  // Transactions
  transactionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  transactionMain: {
    flex: 1,
    marginRight: 12,
  },

  transactionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  transactionCategory: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },

  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },

});