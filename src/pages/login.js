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
import { loginUser } from '../firebase/auth';

export default function LoginScreen({ navigation }) {

    // Form input states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Handle user login

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Error', 'Please enter both email and password!');
            return;
        }

        try {
            await loginUser(email, password);

            // App.js will detect the authenticated user
            // and switch to the main app automatically.

        } catch (error) {
            console.error('Login Error:', error);

            let message = 'Something went wrong. Please try again.';

            if (
                error.code === 'auth/invalid-credential' ||
                error.code === 'auth/user-not-found' ||
                error.code === 'auth/wrong-password'
            ) {
                message = 'Invalid email or password!';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many attempts. Please try again later.';
            }

            Alert.alert('Login Failed', message);
        }
    };


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.innerContainer}
        >

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* Header section */}
                <View style={styles.headerSection}>
                    <Text style={styles.mainTitle}>Welcome back</Text>
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

                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        autoCapitalize="none"
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                {/* Login button */}
                <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={handleLogin}
                >
                    <Text style={styles.loginBtnText}>Log In</Text>
                </TouchableOpacity>

                {/* Navigate to registration */}
                <TouchableOpacity
                    style={styles.registerBtn}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.registerText}>
                        New to Fast Spend?{' '}
                        <Text style={styles.registerBold}>Register</Text>
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}


// =======================
// ===== STYLES ==========
// =======================

const styles = StyleSheet.create({

    innerContainer: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: colors.background,
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingTop: 40,
        paddingBottom: 40,
    },

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

    loginBtn: {
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 20,
    },

    loginBtnText: {
        color: colors.textLight,
        fontSize: 16,
        fontWeight: 'bold',
    },

    registerBtn: {
        alignItems: 'center',
        marginBottom: 20,
    },

    registerText: {
        fontSize: 14,
        color: colors.primary,
    },

    registerBold: {
        fontWeight: 'bold',
    },
});
