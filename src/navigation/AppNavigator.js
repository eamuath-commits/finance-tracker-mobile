import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import AccountsScreen from '../screens/AccountsScreen';
import CreditCardDetailScreen from '../screens/CreditCardDetailScreen';
import MoreScreen from '../screens/MoreScreen';
import ObligationsScreen from '../screens/ObligationsScreen';
import LoansScreen from '../screens/LoansScreen';
import MerchantsScreen from '../screens/MerchantsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const TransactionsStack = createNativeStackNavigator();
const AccountsStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

const screenOptions = {
    headerStyle: {
        backgroundColor: colors.background,
    },
    headerTintColor: colors.text,
    headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
    },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    contentStyle: {
        backgroundColor: colors.background,
    },
};

// --- Dashboard Stack ---
const DashboardStackScreen = () => (
    <DashboardStack.Navigator screenOptions={screenOptions}>
        <DashboardStack.Screen
            name="DashboardHome"
            component={DashboardScreen}
            options={{ title: 'Overview' }}
        />
        <DashboardStack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{ title: 'Transaction' }}
        />
    </DashboardStack.Navigator>
);

// --- Transactions Stack ---
const TransactionsStackScreen = () => (
    <TransactionsStack.Navigator screenOptions={screenOptions}>
        <TransactionsStack.Screen
            name="TransactionsList"
            component={TransactionsScreen}
            options={{ title: 'Transactions' }}
        />
        <TransactionsStack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{ title: 'Transaction' }}
        />
    </TransactionsStack.Navigator>
);

// --- Accounts Stack ---
const AccountsStackScreen = () => (
    <AccountsStack.Navigator screenOptions={screenOptions}>
        <AccountsStack.Screen
            name="AccountsList"
            component={AccountsScreen}
            options={{ title: 'Accounts' }}
        />
        <AccountsStack.Screen
            name="CreditCardDetail"
            component={CreditCardDetailScreen}
            options={{ title: 'Credit Card' }}
        />
        <AccountsStack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{ title: 'Transaction' }}
        />
    </AccountsStack.Navigator>
);

// --- More Stack ---
const MoreStackScreen = () => (
    <MoreStack.Navigator screenOptions={screenOptions}>
        <MoreStack.Screen
            name="MoreHome"
            component={MoreScreen}
            options={{ title: 'More' }}
        />
        <MoreStack.Screen
            name="Obligations"
            component={ObligationsScreen}
            options={{ title: 'Obligations' }}
        />
        <MoreStack.Screen
            name="Loans"
            component={LoansScreen}
            options={{ title: 'Loans' }}
        />
        <MoreStack.Screen
            name="Merchants"
            component={MerchantsScreen}
            options={{ title: 'Merchants' }}
        />
        <MoreStack.Screen
            name="Categories"
            component={CategoriesScreen}
            options={{ title: 'Categories' }}
        />
        <MoreStack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{ title: 'Transaction' }}
        />
    </MoreStack.Navigator>
);

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
                    headerShown: false, // Stack navigators handle headers
                })}
            >
                <Tab.Screen
                    name="Dashboard"
                    component={DashboardStackScreen}
                    options={{ title: 'Overview' }}
                />
                <Tab.Screen
                    name="Transactions"
                    component={TransactionsStackScreen}
                />
                <Tab.Screen
                    name="Accounts"
                    component={AccountsStackScreen}
                />
                <Tab.Screen
                    name="More"
                    component={MoreStackScreen}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
