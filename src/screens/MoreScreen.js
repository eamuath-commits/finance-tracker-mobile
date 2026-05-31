import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { getBaseUrl, setBaseURL } from '../services/api';

const MoreScreen = ({ navigation }) => {
    const menuSections = [
        {
            title: 'Financial Management',
            items: [
                {
                    icon: 'calendar-outline',
                    label: 'Obligations',
                    subtitle: 'Monthly bills & subscriptions',
                    color: colors.primary,
                    screen: 'Obligations',
                },
                {
                    icon: 'trending-down-outline',
                    label: 'Loans',
                    subtitle: 'Track loan balances & payments',
                    color: colors.warning,
                    screen: 'Loans',
                },
                {
                    icon: 'card-outline',
                    label: 'Credit Cards',
                    subtitle: 'Card balances & limits',
                    color: colors.success,
                    onPress: () => navigation.navigate('Accounts'),
                },
                {
                    icon: 'storefront-outline',
                    label: 'Merchants',
                    subtitle: 'Top merchants & spending',
                    color: '#8B5CF6',
                    screen: 'Merchants',
                },
            ],
        },
        {
            title: 'Reports & Analysis',
            items: [
                {
                    icon: 'bar-chart-outline',
                    label: 'Reports',
                    subtitle: 'Spending trends & insights',
                    color: '#EC4899',
                    comingSoon: true,
                },
                {
                    icon: 'layers-outline',
                    label: 'Allocation',
                    subtitle: 'Budget allocation rules',
                    color: '#06B6D4',
                    comingSoon: true,
                },
                {
                    icon: 'pricetags-outline',
                    label: 'Categories',
                    subtitle: 'Manage transaction categories',
                    color: '#F97316',
                    screen: 'Categories',
                },
            ],
        },
        {
            title: 'Settings',
            items: [
                {
                    icon: 'server-outline',
                    label: 'API Configuration',
                    subtitle: `Current: ${getBaseUrl()}`,
                    color: colors.textMuted,
                    onPress: () => {
                        Alert.prompt(
                            'API URL',
                            'Enter the backend server URL (e.g. http://192.168.1.100:8000)',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Save',
                                    onPress: (url) => {
                                        if (url && url.startsWith('http')) {
                                            setBaseURL(url);
                                            Alert.alert('Success', `API URL updated to ${url}`);
                                        }
                                    },
                                },
                            ],
                            'plain-text',
                            getBaseUrl()
                        );
                    },
                },
                {
                    icon: 'information-circle-outline',
                    label: 'About',
                    subtitle: 'Finance Tracker Mobile v1.1.0',
                    color: colors.textMuted,
                },
            ],
        },
    ];

    const handleItemPress = (item) => {
        if (item.onPress) {
            item.onPress();
        } else if (item.screen) {
            navigation.navigate(item.screen);
        } else if (item.comingSoon) {
            Alert.alert('Coming Soon', `${item.label} will be available in a future update.`);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {/* Header */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>M</Text>
                </View>
                <View>
                    <Text style={styles.profileName}>Muath AlAsiri</Text>
                    <Text style={styles.profileSubtitle}>Finance Tracker</Text>
                </View>
            </View>

            {/* Menu Sections */}
            {menuSections.map((section) => (
                <View key={section.title} style={styles.section}>
                    <Text style={styles.sectionLabel}>{section.title}</Text>
                    <View style={styles.menuCard}>
                        {section.items.map((item, index) => (
                            <TouchableOpacity
                                key={item.label}
                                style={[
                                    styles.menuItem,
                                    index < section.items.length - 1 && styles.menuItemBorder,
                                ]}
                                onPress={() => handleItemPress(item)}
                                activeOpacity={0.6}
                            >
                                <View
                                    style={[
                                        styles.menuIcon,
                                        { backgroundColor: item.color + '15' },
                                    ]}
                                >
                                    <Ionicons name={item.icon} size={20} color={item.color} />
                                </View>
                                <View style={styles.menuText}>
                                    <View style={styles.menuLabelRow}>
                                        <Text style={styles.menuLabel}>{item.label}</Text>
                                        {item.comingSoon && (
                                            <View style={styles.comingSoonBadge}>
                                                <Text style={styles.comingSoonText}>Soon</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.menuSubtitle} numberOfLines={1}>
                                        {item.subtitle}
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={colors.textDim}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}

            <View style={{ height: spacing.xxxl * 2 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        padding: spacing.lg,
    },

    // Profile
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xxl,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.lg,
    },
    avatarText: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: '#FFFFFF',
    },
    profileName: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    profileSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },

    // Sections
    section: {
        marginBottom: spacing.xxl,
    },
    sectionLabel: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
        paddingLeft: spacing.xs,
    },
    menuCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '80',
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    menuText: {
        flex: 1,
        marginRight: spacing.sm,
    },
    menuLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    menuLabel: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    comingSoonBadge: {
        backgroundColor: colors.surfaceLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
    comingSoonText: {
        fontSize: 9,
        fontWeight: fontWeight.bold,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
});

export default MoreScreen;
