import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AccountsScreen from '../screens/AccountsScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createBottomTabNavigator();

const getTabIcon = (routeName, focused) => {
    const iconMap = {
        Dashboard: focused ? 'home' : 'home-outline',
        Transactions: focused ? 'receipt' : 'receipt-outline',
        Accounts: focused ? 'wallet' : 'wallet-outline',
        More: focused ? 'menu' : 'menu-outline',
    };
    return iconMap[routeName] || 'ellipsis-horizontal';
};

const AppNavigator = () => {
    return (
        <NavigationContainer
            theme={{
                dark: true,
                colors: {
                    primary: colors.primary,
                    background: colors.background,
                    card: colors.surface,
                    text: colors.text,
                    border: colors.border,
                    notification: colors.danger,
                },
                fonts: {
                    regular: { fontFamily: 'System', fontWeight: '400' },
                    medium: { fontFamily: 'System', fontWeight: '500' },
                    bold: { fontFamily: 'System', fontWeight: '700' },
                    heavy: { fontFamily: 'System', fontWeight: '800' },
                },
            }}
        >
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        const iconName = getTabIcon(route.name, focused);
                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textDim,
                    tabBarStyle: {
                        backgroundColor: colors.surface,
                        borderTopColor: colors.border,
                        borderTopWidth: 1,
                        height: 88,
                        paddingBottom: 30,
                        paddingTop: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                    },
                    headerStyle: {
                        backgroundColor: colors.background,
                        shadowColor: 'transparent',
                        elevation: 0,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                    },
                    headerTintColor: colors.text,
                    headerTitleStyle: {
                        fontWeight: '700',
                        fontSize: 18,
                    },
                })}
            >
                <Tab.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{ title: 'Overview' }}
                />
                <Tab.Screen
                    name="Transactions"
                    component={TransactionsScreen}
                />
                <Tab.Screen
                    name="Accounts"
                    component={AccountsScreen}
                />
                <Tab.Screen
                    name="More"
                    component={MoreScreen}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
