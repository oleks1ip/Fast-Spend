import { useState, useEffect } from 'react';
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
import { updateUserData } from '../firebase/userServise';
import { getUserData } from '../firebase/userServise';

export default function UserInfoUpdate({ visible, onClose, onSuccess }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Load user information when modal opens
    useEffect(() => {
        if (visible) {
            loadUserData();
        }
    }, [visible]);

    const loadUserData = async () => {
        const user = auth.currentUser;

        if (!user) return;

        try {
            const data = await getUserData(user.uid);

            setFullName(data?.fullName || '');
            setEmail(user.email || '');
        } catch (error) {
            console.error('Failed to load user information:', error);
            Alert.alert('Error', 'Could not load user information.');
        }
    };

    // Save updated name
    const handleSave = async () => {
        const user = auth.currentUser;

        if (!user) return;

        if (!fullName.trim()) {
            Alert.alert('Invalid name', 'Please enter your full name.');
            return;
        }

        try {
            setLoading(true);

            await updateUserData(user.uid, {
                fullName: fullName.trim(),
            });

            Alert.alert(
                'Success',
                'Your information has been updated.'
            );

            if (onSuccess) {
                onSuccess();
            }

            onClose();

        } catch (error) {
            console.error('Failed to update user:', error);

            Alert.alert(
                'Error',
                'Could not update your information. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const initials = fullName.trim()
        ? fullName.trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase()
        : '?';

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.modalCard}>
                    <ScrollView showsVerticalScrollIndicator={false}>

                        <Text style={styles.headerTitle}>
                            Update User Information
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            Keep your account details up to date.
                        </Text>

                        {/* PROFILE PICTURE */}
                        <View style={styles.profileSection}>
                            <View style={styles.profilePicture}>
                                <Text style={styles.profileInitials}>
                                    {initials}
                                </Text>
                            </View>

                            <Text style={styles.profileHint}>
                                Profile picture
                            </Text>

                            <Text style={styles.profileHintSmall}>
                                Photo upload coming soon
                            </Text>
                        </View>

                        {/* FULL NAME */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                Full Name
                            </Text>

                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter your full name"
                                placeholderTextColor="#A0AEC0"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* EMAIL */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                Email Address
                            </Text>

                            <TextInput
                                style={[styles.textInput, { backgroundColor: '#F7FAFC' }]}
                                value={email}
                                editable={false}
                                placeholder="Email address"
                                placeholderTextColor="#A0AEC0"
                            />

                            <Text style={styles.profileHintSmall}>
                                Email is managed by your account authentication.
                            </Text>
                        </View>

                        {/* BUTTONS */}
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={styles.saveBtnText}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelBtnText}>
                                Cancel
                            </Text>
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
        marginBottom: 24,
        marginTop: 4,
    },

    profileSection: {
        alignItems: 'center',
        marginBottom: 28,
    },

    profilePicture: {
        width: 85,
        height: 85,
        borderRadius: 43,
        backgroundColor: '#E6F4EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },

    profileInitials: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#005D4B',
    },

    profileHint: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A202C',
    },

    profileHintSmall: {
        fontSize: 12,
        color: '#A0AEC0',
        marginTop: 3,
    },

    inputContainer: {
        marginBottom: 18,
    },

    inputLabel: {
        fontSize: 13,
        color: '#718096',
        marginBottom: 7,
        fontWeight: '600',
    },

    textInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#1A202C',
        backgroundColor: '#FFFFFF',
    },

    saveBtn: {
        backgroundColor: '#005D4B',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 12,
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