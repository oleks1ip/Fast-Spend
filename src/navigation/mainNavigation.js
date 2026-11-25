
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../pages/home';
import AnalyticsScreen from '../pages/analytics';
import HistoryScreen from '../pages/history';
import SettingsScreen from '../pages/settings';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    display: 'none',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
            />

            <Tab.Screen
                name="Analytics"
                component={AnalyticsScreen}
            />

            <Tab.Screen
                name="History"
                component={HistoryScreen}
            />

            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
            />
        </Tab.Navigator>
    );
}
