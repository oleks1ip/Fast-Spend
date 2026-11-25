import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { auth } from '../firebase/firebase';

import {
  addExpense,
  getCategories,
} from '../firebase/transactionService';

export default function QuickAddButton({
  visible,
  onClose,
  onSuccess,
}) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [loading, setLoading] = useState(false);

  // Load categories when the modal opens
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          console.log('No authenticated user');
          return;
        }

        console.log('Loading categories for:', user.uid);

        const result = await getCategories(user.uid);

        console.log('Categories loaded:', result);

        setCategories(result);

        if (result.length > 0) {
          setSelectedCategory(result[0].id);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    if (visible) {
      loadCategories();
    }
  }, [visible]);

  // Reset form
  const resetForm = () => {
    setAmount('');
    setNotes('');
  };

  // Save expense to Firestore
  const handleSave = async () => {
    const user = auth.currentUser;
    const parsedAmount = parseFloat(amount);

    if (!user) {
        Alert.alert('Error', 'Please log in first.');
        return;
    }

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        Alert.alert('Invalid amount', 'Please enter a valid amount.');
        return;
    }

    if (!selectedCategory) {
        Alert.alert('Missing category', 'Please select a category.');
        return;
    }

    const category = categories.find(
        (item) => item.id === selectedCategory
    );

    if (!category) {
        Alert.alert('Error', 'Selected category was not found.');
        return;
    }

    try {
        setLoading(true);

      await addExpense(
        user.uid,
        category,
        notes,
        parsedAmount
      );

        Alert.alert('Success', 'Expense saved successfully!');

        resetForm();

        if (onSuccess) {
        await onSuccess();
        }

        onClose();

    } catch (error) {
        console.error('Error saving expense:', error);
        Alert.alert('Error', 'Could not save expense. Please try again.');
    } finally {
        setLoading(false);
    }
    };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.headerTitle}>Quick Add</Text>
            <Text style={styles.headerSubtitle}>
              A few details. Back to your day.
            </Text>

            {/* AMOUNT INPUT */}
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Amount · GBP</Text>

              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>£</Text>

                <TextInput
                  style={styles.amountInput}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#A0AEC0"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            {/* NOTES INPUT */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>

              <TextInput
                style={styles.textInput}
                placeholder="Add some details..."
                placeholderTextColor="#A0AEC0"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            {/* CATEGORY SELECTOR */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesContainer}
              >
                {categories.map((cat) => {
                  const isSelected = cat.id === selectedCategory;

                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipSelected,
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* BUTTONS */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>
                {loading ? 'Saving...' : 'Save Expense'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 20,
  },
  amountBox: {
    backgroundColor: '#E6F4EA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    color: '#2F855A',
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#137333',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#137333',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 6,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A202C',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#005D4B',
    borderColor: '#005D4B',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#005D4B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#005D4B',
    fontSize: 15,
    fontWeight: '600',
  },
});