import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import {
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
} from 'react-native';

// Імпортуємо кольори з нашої папки констант
import { icons } from '../theme/icons';
import NavigationBar from '../components/navigationBar';
import { colors } from '../theme/colors';
import { auth } from '../firebase/firebase';
import { getUserData } from '../firebase/userServise';
import { getMonthlyExpenses, getAllTransactions, getNumberOfExpense } from '../firebase/transactionService';

export default function HistoryScreen({ navigation }) {

  const [userData, setUserData] = useState(null);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [numberOfExpenses, setNumberOfExpense] = useState(0);
  const [activeFilter, setActiveFilter] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedMonth, setSelectedMonth] = useState('All months');
  const [selectedYear, setSelectedYear] = useState('All years');
  const categories = [
    'All categories',
    ...new Set(
      transactions
        .map(item => item.categoryName)
        .filter(Boolean)
    )
  ];
  const months = [
    'All months', 'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  const years = [
    'All years',
    ...new Set(
      transactions.map(item => {
        const date = item.date?.toDate
          ? item.date.toDate()
          : new Date(item.date);
        
        console.log('Raw date:', item.date);
        console.log('Date type:', typeof item.date);
        console.log('Converted date:', date);

        return date.getFullYear().toString();
      }).filter(year => year !== 'NaN')
    )
  ];

  const filteredTransactions = transactions.filter(item => {
    const date = item.date?.toDate
      ? item.date.toDate()
      : new Date(item.date);

    const categoryMatches =
      selectedCategory === 'All categories' ||
      item.categoryName === selectedCategory;

    const monthMatches =
      selectedMonth === 'All months' ||
      date.getMonth() === months.indexOf(selectedMonth) - 1;

    const yearMatches =
      selectedYear === 'All years' ||
      date.getFullYear().toString() === selectedYear;

    return categoryMatches && monthMatches && yearMatches;
  });

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

    try{
      const transactions = await getAllTransactions(user.uid);
      setTransactions(transactions);
      console.log('History transactions:', transactions);
    } catch (error) {
      console.error('Failed to load history:', error);
    }

    try {
      const numberOfExpense = await getNumberOfExpense(user.uid);
      setNumberOfExpense(numberOfExpense);
      console.log('Number of expense: ', numberOfExpense);
    } catch (error) {
      console.error('Failed to calculate number of expenses: ', error);
    }

  };

  const handleFilterSelect = (value) => {
    if (activeFilter === 'category') {
      setSelectedCategory(value);
    }

    if (activeFilter === 'month') {
      setSelectedMonth(value);
    }

    if (activeFilter === 'year') {
      setSelectedYear(value);
    }

    setActiveFilter(null);
  };

  useFocusEffect(
      useCallback(() => {
          refreshData();
      }, [])
  );

  const initials = userData?.fullName
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '';

  const monthName = new Date().toLocaleDateString('en-GB', {
    month: 'long',
  });

  const groupedTransactions = filteredTransactions.reduce((groups, item) => {
    const date = item.date?.toDate
      ? item.date.toDate()
      : new Date(item.date);

    const dateKey = date.toLocaleDateString('en-CA');

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date,
        items: [],
        total: 0,
      };
    }

    groups[dateKey].items.push(item);
    groups[dateKey].total += Number(item.amount) || 0;

    return groups;
  }, {});

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const formatDayTitle = (date) => {
    const dateKey = date.toLocaleDateString('en-CA');

    if (dateKey === today.toLocaleDateString('en-CA')) {
      return `Today · ${date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      })}`;
    }

    if (dateKey === yesterday.toLocaleDateString('en-CA')) {
      return `Yesterday · ${date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      })}`;
    }

    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* 1. ХЕДЕР (ЗАГОЛОВОК ТА АВАТАР)                                    */}
        {/* ================================================================= */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>History</Text>
            <Text style={styles.headerSubtitle}>{monthName} · All expenses</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        {/* ================================================================= */}
        {/* 3. ФІЛЬТРИ (DROPDOWNS)                                            */}
        {/* ================================================================= */}
        <View style={styles.filtersRow}>
          <TouchableOpacity onPress={() => setActiveFilter('category')} style={styles.filterChip} activeOpacity={0.7}>
            <Text style={styles.filterText}>Category</Text>
            <Text style={styles.filterArrow}>˅</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveFilter('month')} style={styles.filterChip} activeOpacity={0.7}>
            <Text style={styles.filterText}>Month</Text>
            <Text style={styles.filterArrow}>˅</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveFilter('year')} style={styles.filterChip} activeOpacity={0.7}>
            <Text style={styles.filterText}>Year</Text>
            <Text style={styles.filterArrow}>˅</Text>
          </TouchableOpacity>
        </View>

        {/* ================================================================= */}
        {/* 4. КАРТКА ПІДСУМКУ МІСЯЦЯ (OCTOBER SPENDING)                      */}
        {/* ================================================================= */}

        {Object.entries(groupedTransactions).map(([dateKey, group]) => (
          <View key={dateKey}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>
                {formatDayTitle(group.date)}
              </Text>

              <Text style={styles.dayTotal}>
                £{group.total.toFixed(2)}
              </Text>
            </View>

            <View style={styles.transactionsCard}>
              {group.items.map((item, index) => {
                const title =
                  item.note?.trim() ||
                  item.subcategoryName ||
                  item.categoryName ||
                  'Expense';

                const subtitle = item.note?.trim()
                  ? `${item.categoryName}${item.subcategoryName ? ` · ${item.subcategoryName}` : ''}`
                  : item.subcategoryName
                    ? item.categoryName
                    : '';

                const CategoryIcon = icons[item.icon] || icons.other;

                return (
                  <View key={item.id}>
                    {index > 0 && <View style={styles.itemDivider} />}

                    <View style={styles.transactionItem}>
                      <CategoryIcon
                        style={styles.transactionIcon}
                        color={colors.primary}
                        strokeWidth={2}
                      />


                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionTitle}>
                          {title}
                        </Text>

                        {subtitle ? (
                          <Text style={styles.transactionSub}>
                            {subtitle}
                          </Text>
                        ) : null}
                      </View>

                      <Text style={styles.transactionAmount}>
                        -£{Number(item.amount).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {filteredTransactions.length === 0 && (
          <View style={styles.transactionsCard}>
            <Text style={styles.transactionSub}>
              No transactions yet.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ================================================================= */}
      {/* 9. НИЖНЯ ПАНЕЛЬ НАВІГАЦІЇ (BOTTOM NAVIGATION BAR)                  */}
      {/* ================================================================= */}
      <NavigationBar activeScreen="History" navigation={navigation} />
      <Modal
        visible={activeFilter !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveFilter(null)}
      >
        <TouchableOpacity
          style={styles.filterOverlay}
          activeOpacity={1}
          onPress={() => setActiveFilter(null)}
        >
          <View style={styles.filterModal}>
            <Text style={styles.filterTitle}>
              {activeFilter === 'category' && 'Select Category'}
              {activeFilter === 'month' && 'Select Month'}
              {activeFilter === 'year' && 'Select Year'}
            </Text>

            <ScrollView style={{ maxHeight: 350 }}>
              {(activeFilter === 'category'
                ? categories
                : activeFilter === 'month'
                  ? months
                  : years
              ).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.filterOption}
                  onPress={() => handleFilterSelect(item)}
                >
                  <Text style={styles.filterOptionText}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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

  /* 2. Пошук */
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  searchInput: {
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },

  /* 3. Фільтри */
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '31%',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterArrow: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  /* 4. Підсумок місяця */
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: '#E8F5F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 8,
  },

  /* Заголовки днів */
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  dayTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  /* Картки транзакцій */
  transactionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  transactionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  transactionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: 10,
  },

  /* Чек / Вкладення */
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  attachmentIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  attachmentText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  /* Блок раніших транзакцій */
  earlierCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  earlierTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  earlierSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  showEarlierBtn: {
    marginTop: 4,
  },
  showEarlierText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  /* Нижня панель */
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  navEmojiIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  navLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeNav: {
    color: colors.primary,
    fontWeight: 'bold',
  },

  filterOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 25,
  },

  filterModal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },

  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 15,
  },

  filterOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },

  filterOptionText: {
    fontSize: 15,
    color: '#1A202C',
  },
});