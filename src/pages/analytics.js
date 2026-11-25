
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-gifted-charts';

import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import NavigationBar from '../components/navigationBar';
import { colors } from '../theme/colors';
import { auth } from '../firebase/firebase';
import { getUserData } from '../firebase/userServise';

import {
  getMonthlyExpenses,
  getSpendingByCategories,
  getDailyExpenses,
  getSpendingByCategoriesDaily,
} from '../firebase/transactionService';

export default function AnalyticsScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [monthlySpent, setMonthlySpent] = useState(0);

  const [categorySpending, setCategorySpending] = useState([]);
  const [dailyData, setDailyData] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [dailyCategorySpending, setDailyCategorySpending] = useState([]);

  // Завантаження основної аналітики
  
  const refreshData = async (month = selectedMonth) => {
    const user = auth.currentUser;

    if (!user) return;

    try {
      const data = await getUserData(user.uid);
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user:', error);
    }

    try {
      const total = await getMonthlyExpenses(user.uid, month);
      setMonthlySpent(total);
    } catch (error) {
      console.error('Failed to load monthly expenses:', error);
    }

    try {
      const spending = await getSpendingByCategories(user.uid, month);
      setCategorySpending(spending);
    } catch (error) {
      console.error('Failed to load category spending:', error);
    }

    try {
      const dailyExpenses = await getDailyExpenses(user.uid, month);
      setDailyData(dailyExpenses);
    } catch (error) {
      console.error('Failed to load daily expenses:', error);
    }
  };

  // Завантаження категорій за вибраний день
  const refreshDailyCategories = async (date) => {
    const user = auth.currentUser;

    if (!user) return;

    try {
      const data = await getSpendingByCategoriesDaily(
        user.uid,
        date
      );

      setDailyCategorySpending(data);
    } catch (error) {
      console.error('Failed to load daily categories:', error);
    }
  };

  const handlePreviousMonth = () => {
    setSelectedMonth((current) =>
      new Date(
        current.getFullYear(),
        current.getMonth() - 1,
        1
      )
    );
  };

  const handleNextMonth = () => {
    const currentMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    setSelectedMonth((current) => {
      if (current >= currentMonth) return current;

      return new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        1
      );
    });
  };

  // Коли вибрана дата змінюється, завантажуємо її категорії
  useEffect(() => {
    refreshDailyCategories(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    refreshData(selectedMonth);

    const today = new Date();

    const isSelectedMonthCurrent =
      selectedMonth.getFullYear() === today.getFullYear() &&
      selectedMonth.getMonth() === today.getMonth();

    setSelectedDate(
      isSelectedMonthCurrent
        ? today
        : new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth(),
            1
          )
    );
  }, [selectedMonth]);

  // Коли користувач повертається на Analytics
  useFocusEffect(
    useCallback(() => {
      refreshData(selectedMonth);
    }, [selectedMonth])
  );

  // Обробка натискання на стовпчик графіка
  const handleDayPress = (day) => {
    const date = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      day
    );

    setSelectedDate(date);
  };

  const initials = userData?.fullName
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '';

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const selectedFormattedDate = selectedDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const currency = userData?.currency || 'GBP';

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const categoryColors = {
    // Default category color
    groceries: '#5fecc9',
    transport: '#3A7D8C',
    shopping: '#7E57C2',
    entertainment: '#A36813',
    bills: '#5C6BC0',
    health: '#D81B60',
    education: '#689F38',
    Other: '#9E9E9E',

    // New category color
    Coffee: '#059669',
    ShoppingCart: '#10B981',
    Pizza: '#F97316',
    Beer: '#D97706',
    Apple: '#22C55E',
    Croissant: '#65A30D',
    Zap: '#EAB308',
    Wifi: '#0284C7',
    Smartphone: '#2563EB',
    Wrench: '#475569',
    Sofa: '#0D9488',
    Shirt: '#8B5CF6',
    Watch: '#6366F1',
    GitPullRequestDraft: '#4F46E5',
    Tag: '#EC4899',
    Gem: '#06B6D4',
    Dumbbell: '#16A34A',
    Pill: '#E11D48',
    Stethoscope: '#F43F5E',
    Scissors: '#D946EF',
    Sparkles: '#A855F7',
    Gamepad2: '#7C3AED',
    Film: '#DC2626',
    Music: '#DB2777',
    BookOpen: '#15803D',
    Tv: '#1D4ED8',
    CreditCard: '#0369A1',
    PiggyBank: '#14B8A6',
    Briefcase: '#334155',
    PawPrint: '#B45309',
    Baby: '#FB7185',
    MoreHorizontal: '#64748B',
  };

  // Дані для кругової діаграми
  const pieData = categorySpending.map(item => ({
    value: item.amount,
    color: categoryColors[item.icon] || categoryColors.Other,
  }));

  // Дані для денного графіка
  const maxDailyAmount = Math.max(
    ...dailyData.map(item => item.amount),
    0
  );

  const chartData = dailyData.map(item => ({
    amount: item.amount,
    label: item.label,
    heightRatio: maxDailyAmount > 0
      ? item.amount / maxDailyAmount
      : 0,
  }));

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* 1. Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>
              Know where your money goes.
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* 2. Date selector */}

        <View style={styles.dateSelector}>
          <TouchableOpacity
            onPress={handlePreviousMonth}
            style={styles.monthArrow}
          >
            <Text style={styles.monthArrowText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.dateText}>
            {selectedMonth.toLocaleDateString('en-GB', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={[
              styles.monthArrow,
              selectedMonth.getMonth() === new Date().getMonth() &&
              selectedMonth.getFullYear() === new Date().getFullYear() &&
              { opacity: 0.3 },
            ]}
            disabled={
              selectedMonth.getMonth() === new Date().getMonth() &&
              selectedMonth.getFullYear() === new Date().getFullYear()
            }
          >
            <Text style={styles.monthArrowText}>›</Text>
          </TouchableOpacity>
        </View>


        {/* 3. Monthly summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Total spent this month
          </Text>

          <Text style={styles.summaryAmount}>
            {formatMoney(monthlySpent)}
          </Text>

        </View>

        {/* 4. Spending by category */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            By category
          </Text>

          {categorySpending.length > 0 ? (
            <>
              <View style={styles.pieContainer}>
                <PieChart
                  data={pieData}
                  donut
                  radius={90}
                  innerRadius={65}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <Text style={styles.pieCenterLabel}>
                        Total spending
                      </Text>

                      <Text style={styles.pieCenterAmount}>
                        {formatMoney(monthlySpent)}
                      </Text>
                    </View>
                  )}
                />
              </View>

              {/* Category legend */}
              <View style={styles.categoryList}>
                {categorySpending.map((item, index) => (
                  <View key={index} style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.colorDot,
                          {
                            backgroundColor:
                              categoryColors[item.icon] || '#9E9E9E',
                          },
                        ]}
                      />

                      <Text style={styles.categoryName}>
                        {item.categoryName}
                      </Text>
                    </View>

                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>
                        {formatMoney(item.amount)}
                      </Text>

                      <Text style={styles.categoryPercent}>
                        {item.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>
              No expenses this month yet.
            </Text>
          )}
        </View>

        {/* 5. Daily spending chart */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Daily spending
          </Text>

          <Text style={styles.selectedDateText}>
            Selected day: {selectedFormattedDate}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.barChartContainer}>
              {chartData.map((bar, index) => {
                const isSelected =
                  bar.label === selectedDate.getDate();

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.barColumn}
                    activeOpacity={0.7}
                    onPress={() => handleDayPress(bar.label)}
                  >
                    <Text style={styles.barAmount}>
                      {bar.amount > 0
                        ? formatMoney(bar.amount)
                        : ''}
                    </Text>

                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${bar.heightRatio * 100}%`,
                            backgroundColor: isSelected
                              ? colors.primary
                              : '#CBD5E1',
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={[
                        styles.barLabel,
                        isSelected && styles.selectedBarLabel,
                      ]}
                    >
                      {bar.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* 6. Categories for selected day */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Spending on {selectedFormattedDate}
          </Text>

          {dailyCategorySpending.length > 0 ? (
            <View style={styles.categoryList}>
              {dailyCategorySpending.map((item, index) => (
                <View key={index} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View
                      style={[
                        styles.colorDot,
                        {
                          backgroundColor:
                            categoryColors[item.icon] || '#9E9E9E',
                        },
                      ]}
                    />

                    <Text style={styles.categoryName}>
                      {item.categoryName}
                    </Text>
                  </View>

                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>
                      {formatMoney(item.amount)}
                    </Text>

                    <Text style={styles.categoryPercent}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No expenses on this day.
            </Text>
          )}
        </View>

      </ScrollView>

      {/* Bottom navigation */}
      <NavigationBar
        activeScreen="Analytics"
        navigation={navigation}
      />
    </View>
  );
}


// =====================================================
// STYLES
// =====================================================

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

  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginVertical: 6,
  },

  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  badge: {
    backgroundColor: '#E8F5F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  summarySubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },

  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },

  pieCenter: {
    alignItems: 'center',
  },

  pieCenterLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },

  pieCenterAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 3,
  },

  categoryList: {
    marginTop: 16,
  },

  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },

  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  categoryName: {
    fontSize: 13,
    color: colors.textPrimary,
  },

  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginRight: 12,
  },

  categoryPercent: {
    fontSize: 11,
    color: colors.textMuted,
    width: 38,
    textAlign: 'right',
  },

  selectedDateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },

  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 20,
    marginBottom: 12,
  },

  barColumn: {
    alignItems: 'center',
    width: 42,
  },

  barAmount: {
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 6,
  },

  barTrack: {
    height: 80,
    width: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  barFill: {
    width: '100%',
    borderRadius: 6,
  },

  barLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
  },

  selectedBarLabel: {
    color: colors.primary,
    fontWeight: 'bold',
  },

  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },

  statIcon: {
    fontSize: 18,
    marginRight: 12,
  },

  statDetails: {
    flex: 1,
  },

  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 2,
  },

  itemDivider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 10,
  },

  monthArrow: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  monthArrowText: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '600',
  },
});
