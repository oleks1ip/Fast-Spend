import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { colors } from '../theme/colors';
import { registerUser } from '../firebase/auth';

export default function RegisterScreen({ navigation }) {

    // Form input states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Password visibility states
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    // Handle user registration

    const handleRegister = async () => {
        if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
            Alert.alert('Validation Error', 'Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Validation Error', 'Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            Alert.alert(
                'Validation Error',
                'Password must be at least 8 characters long.'
            );
            return;
        }

        if (!/\d/.test(password)) {
            Alert.alert(
                'Validation Error',
                'Password must include at least one number.'
            );
            return;
        }

        try {
            await registerUser(fullName, email, password);

            // Firebase automatically signs in the newly registered user.
            // App.js will detect the authenticated user.

        } catch (error) {
            console.error('Registration Error:', error);

            let message = 'Something went wrong. Please try again.';

            if (error.code === 'auth/email-already-in-use') {
                message = 'An account with this email already exists.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Your password is too weak.';
            }

            Alert.alert('Registration Failed', message);
        }
    };


    return (
        // Main keyboard avoiding container
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.innerContainer}
        >
            {/* Scrollable form content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* Header section */}
                <View style={styles.headerSection}>
                    <Text style={styles.mainTitle}>Create your account</Text>
                    <Text style={styles.subtitle}>
                        Your everyday spending, a little clearer.
                    </Text>
                </View>

                {/* Logo and app name */}
                <View style={styles.brandRow}>
                    <Image
                        source={require('../assets/icons/logo.png')}
                        style={styles.logoIcon}
                    />
                    <Text style={styles.appName}>Fast Spend</Text>
                </View>

                {/* Full name input */}
                <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>Full name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Alex Johnson"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="words"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>

                {/* Email input */}
                <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>Email address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                {/* Password input */}
                <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>Password</Text>

                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="••••••••••••"
                            placeholderTextColor={colors.textMuted}
                            secureTextEntry={!isPasswordVisible}
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TouchableOpacity
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            style={styles.eyeIconContainer}
                        >
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.passwordSubtext}>
                        At least 8 characters, including a number.
                    </Text>
                </View>

                {/* Confirm password input */}
                <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>Confirm password</Text>

                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="••••••••••••"
                            placeholderTextColor={colors.textMuted}
                            secureTextEntry={!isConfirmPasswordVisible}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <TouchableOpacity
                            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                            style={styles.eyeIconContainer}
                        >
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Register button */}
                <TouchableOpacity
                    style={styles.registerBtn}
                    onPress={handleRegister}
                >
                    <Text style={styles.registerBtnText}>Register</Text>
                </TouchableOpacity>

                {/* Navigate to login screen */}
                <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginText}>
                        Already have an account?{' '}
                        <Text style={styles.loginBold}>Log In</Text>
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Styles
const styles = StyleSheet.create({

    // Main container
    innerContainer: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: colors.background,
    },

    // ScrollView content and vertical spacing
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingTop: 40,
        paddingBottom: 40,
    },

    // Header section
    headerSection: {
        marginBottom: 24,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },

    // Logo and app name
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        marginRight: 12,
    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },

    // Input fields
    inputCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.background,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        fontSize: 16,
        color: colors.textPrimary,
        paddingVertical: 4,
    },

    // Password input layout
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eyeIconContainer: {
        paddingLeft: 8,
    },
    passwordSubtext: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 6,
    },

    // Register button
    registerBtn: {
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    registerBtnText: {
        color: colors.textLight,
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Navigate to login button
    loginBtn: {
        alignItems: 'center',
        marginBottom: 20,
    },
    loginText: {
        fontSize: 14,
        color: colors.primary,
    },
    loginBold: {
        fontWeight: 'bold',
    },
});
