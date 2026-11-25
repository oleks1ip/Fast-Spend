import React, { useEffect, useState } from 'react';
import {
    View,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './src/firebase/firebase';
import AuthNavigator from './src/navigation/authNavigation';
import MainNavigator from './src/navigation/mainNavigation';
import { colors } from './src/theme/colors';
import { ensureUserProfile } from './src/firebase/userServise';

export default function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          try {
            if (currentUser) {
              await ensureUserProfile(currentUser);
            }

            setUser(currentUser);
          } catch (error) {
            console.error('User profile error:', error);
            setUser(currentUser);
          } finally {
            setIsLoading(false);
          }
        });

        return unsubscribe;
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
