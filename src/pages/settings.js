import { useState, useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  onPress,
  TextInput,
  Alert,
} from 'react-native';

// Імпортуємо кольори та нижню панель
import NavigationBar from '../components/navigationBar';
import { icons } from '../theme/icons';
import { colors } from '../theme/colors';
import { auth } from '../firebase/firebase';
import { logoutUser } from '../firebase/auth';
import { getUserData, updateBudget } from '../firebase/userServise';
import UserInfoUpdate from '../components/userInfoUpdate';
import ManageCategoriesScreen from '../components/manageCategories';
import { Info, LogOut } from 'lucide-react-native';

const handleLogout = async () => {
  try {
    await logoutUser();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export default function SettingsScreen({ navigation }) {

  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [isUserInfoVisible, setIsUserInfoVisible] = useState(false);
  const [isManageCategoriesVisible, setIsManageCategoriesVisible] = useState(false);

  const refreshData = async () => {
    const user = auth.currentUser;

    if (!user) return;

    try {
      const data = await getUserData(user.uid);
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  }

  const handleSaveBudget = async () => {
    const user = auth.currentUser;

    if (!user) return;

    const budgetValue = Number(newBudget);

    if (
        newBudget.trim() === '' ||
        !Number.isFinite(budgetValue) ||
        budgetValue <= 0
    ) {
        alert('Please enter a valid budget greater than zero.');
        return;
    }

    try {
        await updateBudget(user.uid, budgetValue);

        setUserData(prev => ({
            ...prev,
            monthlyBudget: budgetValue,
        }));

        setIsOpen(false);
        setNewBudget('');

        console.log('Budget saved:', budgetValue);

    } catch (error) {
        alert('Failed to update budget. Please try again.');
    }
  };

  const handleHelpAbout = () => {
    Alert.alert(
      'Help & About',
      'Choose an option:',
      [
        {
          text: 'Help',
          onPress: () => {
            Alert.alert(
              'How to use Fast Spend',
              `1. Add Expenses
Record your daily expenses using Quick Add.

2. Scan Receipts
Take a photo of your receipt and let AI extract the expense details. Review the information before saving.

3. Manage Categories
Create and customise your own expense categories.

4. Set Your Budget
Set a monthly budget and monitor your spending.

5. View Analytics
Explore your monthly spending, compare previous months and see your spending by category.

6. Check History
View and review all your previous transactions.`,
              [{ text: 'Got it' }]
            );
          },
        },
        {
          text: 'About',
          onPress: () => {
            Alert.alert(
              'About Fast Spend',
              `Fast Spend is a personal expense tracking application designed to make managing money simple and convenient.

Features include:
• Expense tracking
• AI-powered receipt scanning
• Custom expense categories
• Monthly budget management
• Spending analytics
• Transaction history

Our goal is to help you understand your spending habits and make smarter financial decisions.

Version 1.0

Thank you for using Fast Spend!`,
              [{ text: 'Close' }]
            );
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  useEffect(() => {
    refreshData();
  }, []);

  const initials = userData?.fullName
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. ХЕДЕР (ЗАГОЛОВОК ТА АВАТАР) */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Your app, your way.</Text>
          </View>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{initials}</Text>
          </View>
        </View>

        {/* 2. КАРТКА ПРОФІЛЮ КОРИСТУВАЧА */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userData?.fullName}</Text>
              <Text style={styles.profileEmail}>{userData?.email}</Text>
            </View>
          </View>

          <View style={styles.itemDivider} />

          <TouchableOpacity onPress={() => setIsUserInfoVisible(true)} style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <icons.UserPen style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Profile & Account</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <UserInfoUpdate
            visible={isUserInfoVisible}
            onClose={() => setIsUserInfoVisible(false)}
            onSuccess={refreshData}
          />
        </View>

        {/* 4. СЕКЦІЯ: YOUR SPENDING */}
        <Text style={styles.sectionTitle}>Your spending</Text>
        <View style={styles.card}>
          <TouchableOpacity onPress={() => setIsManageCategoriesVisible(true)} style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <icons.LayoutList style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Categories</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <ManageCategoriesScreen
            visible={isManageCategoriesVisible}
            onClose={() => setIsManageCategoriesVisible(false)}
            onSuccess={refreshData}
          />

          <View style={styles.itemDivider} />

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => {
              setNewBudget(String(userData?.monthlyBudget ?? ''));
              setIsOpen(!isOpen);
            }}
          >
            <View style={styles.settingLeft}>
              <icons.Wallet style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Budgets</Text>
            </View>
            <Text style={styles.chevron}>{isOpen ? '⌃' : '›'}</Text>
          </TouchableOpacity>

          {isOpen && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.settingLabel}>Monthly budget (£)</Text>

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 8,
                  color: colors.textPrimary,
                }}
                value={newBudget}
                onChangeText={setNewBudget}
                keyboardType="decimal-pad"
                placeholder="Enter your budget"
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity
                onPress={handleSaveBudget}
                style={{
                  backgroundColor: colors.primary,
                  padding: 12,
                  borderRadius: 10,
                  marginTop: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 5. СЕКЦІЯ: SUPPORT & DATA */}
        <Text style={styles.sectionTitle}>Support & data</Text>
        <View style={styles.card}>

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={handleHelpAbout}
          >
            <View style={styles.settingLeft}>
              <Info style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Help & About</Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          <TouchableOpacity onPress={handleLogout} style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <LogOut style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: '#E53E3E' }]}>Log Out</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 7. НИЖНЯ ПАНЕЛЬ НАВІГАЦІЇ */}
      <NavigationBar activeScreen="Settings" navigation={navigation} />
    </View>
  );
}

// ===========================================================================
// СТИЛІ
// ===========================================================================
const styles = StyleSheet.create({
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

  /* 1. Хедер */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBackground,
  },
  avatarSmallText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Загальні стилі карток */
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 10,
  },

  /* 2. Профіль */
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E8F5F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarLargeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileBadge: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },

  /* Рядки налаштувань */
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    color: colors.primary,
    fontSize: 16,
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 8,
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 10,
  },

  /* Банер */
  demoBanner: {
    backgroundColor: '#E8F5F1',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 10,
  },
  demoBannerText: {
    fontSize: 11,
    color: colors.primary,
    lineHeight: 16,
    textAlign: 'left',
  },
});