import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    Modal,
    StyleSheet,
    Platform,
    StatusBar,
    ActivityIndicator,
} from 'react-native';

import { auth } from '../firebase/firebase';

import {
    getAllCategories,
    deleteCategory,
    addNewCategory,
} from '../firebase/categoriesService';

import { icons, availableIcons } from '../theme/icons';
import { colors } from '../theme/colors';

const ManageCategoriesScreen = ({
    visible,
    onClose,
    onSuccess,
}) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Other');
    const [saving, setSaving] = useState(false);

    // Load categories from Firestore
    const loadCategories = async () => {
        try {
            const user = auth.currentUser;

            if (!user) return;

            setLoading(true);

            const data = await getAllCategories(user.uid);

            setCategories(data);
        } catch (error) {
            console.log('Error loading categories:', error);
            Alert.alert('Error', 'Failed to load categories.');
        } finally {
            setLoading(false);
        }
    };

    // Load categories whenever modal opens
    useEffect(() => {
        if (visible) {
            loadCategories();
        }
    }, [visible]);

    // Delete category
    const handleDeleteCategory = (category) => {
        if (category.isDefault) {
            Alert.alert(
                'Cannot delete',
                'Default categories cannot be deleted.'
            );
            return;
        }

        Alert.alert(
            'Delete category',
            `Are you sure you want to delete "${category.name}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',

                    onPress: async () => {
                        try {
                            const user = auth.currentUser;

                            if (!user) return;

                            await deleteCategory(user.uid, category.id);

                            setCategories((previous) =>
                                previous.filter(
                                    (item) => item.id !== category.id
                                )
                            );

                            onSuccess?.();

                        } catch (error) {
                            console.log('Error deleting category:', error);

                            Alert.alert(
                                'Error',
                                'Failed to delete category.'
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleAddCategory = async () => {
        const name = newCategoryName.trim();

        if (!name) {
            Alert.alert('Missing name', 'Please enter a category name.');
            return;
        }

        const user = auth.currentUser;

        if (!user) {
            Alert.alert('Error', 'You must be logged in.');
            return;
        }

        try {
            setSaving(true);

            await addNewCategory(user.uid, selectedIcon, false, name);

            setNewCategoryName('');
            setSelectedIcon('House');
            setShowAddForm(false);

            await loadCategories();
            onSuccess?.();

            Alert.alert('Success', 'Category added successfully!');
        } catch (error) {
            console.log('Error adding category:', error);
            Alert.alert('Error', 'Failed to add category.');
        } finally {
            setSaving(false);
        }
    };

    // Render category item
    const renderCategory = ({ item }) => {
        const CategoryIcon = icons[item.icon] || icons.Other;

        return (
            <View style={styles.categoryItem}>

                <View style={styles.categoryLeft}>

                    <View style={styles.iconContainer}>
                        {CategoryIcon && (
                            <CategoryIcon
                                size={21}
                                color={colors.primary}
                                strokeWidth={2}
                            />
                        )}
                    </View>

                    <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>
                            {item.name}
                        </Text>

                        <Text style={styles.categoryType}>
                            {item.isDefault ? 'Default category' : 'Custom category'}
                        </Text>
                    </View>

                </View>

                {item.isDefault ? (

                    <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>
                            Default
                        </Text>
                    </View>

                ) : (

                    <TouchableOpacity
                        style={styles.deleteButton}
                        activeOpacity={0.7}
                        onPress={() => handleDeleteCategory(item)}
                    >
                        <icons.Trash2
                            size={17}
                            color="#DC2626"
                        />
                    </TouchableOpacity>

                )}

            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >

            <View style={styles.container}>

                <StatusBar
                    barStyle="dark-content"
                    backgroundColor={colors.background}
                />

                {/* Header */}
                <View style={styles.header}>

                    <View>
                        <Text style={styles.title}>
                            Manage Categories
                        </Text>

                        <Text style={styles.subtitle}>
                            Add and manage your expense categories.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <icons.X
                            size={22}
                            color={colors.textPrimary}
                        />
                    </TouchableOpacity>

                </View>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddForm(!showAddForm)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.addButtonText}>
                        {showAddForm ? 'Cancel' : '+ Add Category'}
                    </Text>
                </TouchableOpacity>

                {showAddForm && (
                    <View style={styles.addForm}>
                        <Text style={styles.formTitle}>New category</Text>

                        <Text style={styles.inputLabel}>Category name</Text>

                        <TextInput
                            style={styles.nameInput}
                            placeholder="e.g. Pets"
                            placeholderTextColor={colors.textSecondary}
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                            maxLength={30}
                        />

                        <Text style={styles.inputLabel}>Choose an icon</Text>

                        <View style={styles.iconPicker}>
                        {availableIcons.map((iconName) => {
                            const IconComponent = icons[iconName];

                            if (!IconComponent) return null;

                            return (
                                <TouchableOpacity
                                    key={iconName}
                                    style={[
                                        styles.iconOption,
                                        selectedIcon === iconName && styles.selectedIconOption,
                                    ]}
                                    onPress={() => setSelectedIcon(iconName)}
                                >
                                    <IconComponent
                                        size={23}
                                        color={
                                            selectedIcon === iconName
                                                ? colors.primary
                                                : colors.textSecondary
                                        }
                                    />
                                </TouchableOpacity>
                            );
                        })}
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleAddCategory}
                            disabled={saving}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.saveButtonText}>
                                {saving ? 'Saving...' : 'Save Category'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Categories list */}
                {loading ? (

                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                        />
                    </View>

                ) : (

                    <FlatList
                        data={categories}
                        keyExtractor={(item) => item.id}
                        renderItem={renderCategory}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}

                        ListEmptyComponent={
                            <Text style={styles.emptyText}>
                                No categories found.
                            </Text>
                        }
                    />

                )}

            </View>

        </Modal>
    );
};

export default ManageCategoriesScreen;


// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
    addForm: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    },

    formTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
    },

    inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    },

    nameInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 16,
    },

    iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    },

    iconOption: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    },

    selectedIconOption: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
    },

    saveButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    },

    saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    },

    addButton: {
        backgroundColor: colors.primary,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },

    addButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },

    container: {
        flex: 1,
        backgroundColor: colors.background,

        paddingTop: Platform.select({
            ios: 50,
            android: StatusBar.currentHeight || 24,
            default: 20,
        }),

        paddingHorizontal: 16,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },

    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },

    subtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 5,
    },

    closeButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },

    listContent: {
        paddingBottom: 30,
        flexGrow: 1,
    },

    categoryItem: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },

    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 11,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    categoryInfo: {
        flex: 1,
    },

    categoryName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },

    categoryType: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 4,
    },

    defaultBadge: {
        backgroundColor: '#E2E8F0',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },

    defaultBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
    },

    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 9,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyText: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: 30,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

});
