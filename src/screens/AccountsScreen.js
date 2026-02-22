import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';
import { getAccounts, getCreditCards } from '../services/api';
import AccountCard from '../components/AccountCard';

const AccountsScreen = ({ navigation }) => {
    const [accounts, setAccounts] = useState([]);
    const [creditCards, setCreditCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [accRes, ccRes] = await Promise.all([
                getAccounts(),
                getCreditCards(),
            ]);
            setAccounts(accRes.data);
            setCreditCards(ccRes.data);
        } catch (err) {
            console.error('Accounts fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    }, [accounts]);

    const totalCreditUsed = useMemo(() => {
        return creditCards.reduce((sum, cc) => sum + (cc.current_balance || 0), 0);
    }, [creditCards]);

    const totalCreditLimit = useMemo(() => {
        return creditCards.reduce((sum, cc) => sum + (cc.credit_limit || 0), 0);
    }, [creditCards]);

    const handleAccountPress = (account) => {
        // Navigate to transactions filtered by this account
        navigation.navigate('Transactions', { accountId: account.id });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                />
            }
        >
            {/* — Total Balance Summary — */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Balance</Text>
                        <Text style={styles.summaryValue}>{formatNumber(totalBalance)} SAR</Text>
                    </View>
                </View>
                {creditCards.length > 0 && (
                    <View style={[styles.summaryRow, { marginTop: spacing.md }]}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Credit Used</Text>
                            <Text style={[styles.summaryValueSm, { color: colors.dangerLight }]}>
                                {formatNumber(totalCreditUsed)} SAR
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Credit Limit</Text>
                            <Text style={styles.summaryValueSm}>
                                {formatNumber(totalCreditLimit)} SAR
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* — Bank Accounts — */}
            <Text style={styles.sectionLabel}>Bank Accounts</Text>
            {accounts.length > 0 ? (
                accounts.map((acc) => (
                    <AccountCard key={acc.id} account={acc} onPress={handleAccountPress} />
                ))
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="wallet-outline" size={32} color={colors.textDim} />
                    <Text style={styles.emptyText}>No accounts added yet</Text>
                </View>
            )}

            {/* — Credit Cards — */}
            {creditCards.length > 0 && (
                <>
                    <Text style={[styles.sectionLabel, { marginTop: spacing.xxl }]}>
                        Credit Cards
                    </Text>
                    {creditCards.map((cc) => (
                        <TouchableOpacity
                            key={cc.id}
                            style={styles.creditCard}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.ccAccent, { backgroundColor: colors.warning }]} />
                            <View style={styles.ccContent}>
                                <View style={styles.ccHeader}>
                                    <View style={styles.ccIconContainer}>
                                        <Ionicons name="card-outline" size={20} color={colors.warning} />
                                    </View>
                                    <View style={styles.ccTitleArea}>
                                        <Text style={styles.ccName} numberOfLines={1}>
                                            {cc.name || `${cc.bank_name} Card`}
                                        </Text>
                                        {cc.bank_name && (
                                            <Text style={styles.ccBank}>{cc.bank_name}</Text>
                                        )}
                                    </View>
                                    <Text style={styles.ccDigits}>
                                        •••• {cc.last_4_digits || '????'}
                                    </Text>
                                </View>

                                <View style={styles.ccBalanceRow}>
                                    <View>
                                        <Text style={styles.ccBalanceLabel}>Balance</Text>
                                        <Text style={[styles.ccBalance, { color: colors.dangerLight }]}>
                                            {formatNumber(cc.current_balance || 0)} SAR
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.ccBalanceLabel}>Limit</Text>
                                        <Text style={styles.ccBalance}>
                                            {formatNumber(cc.credit_limit || 0)} SAR
                                        </Text>
                                    </View>
                                </View>

                                {/* Usage bar */}
                                {cc.credit_limit > 0 && (
                                    <View style={styles.usageBarContainer}>
                                        <View style={styles.usageBarBg}>
                                            <View
                                                style={[
                                                    styles.usageBarFill,
                                                    {
                                                        width: `${Math.min(
                                                            ((cc.current_balance || 0) / cc.credit_limit) * 100,
                                                            100
                                                        )}%`,
                                                        backgroundColor:
                                                            (cc.current_balance || 0) / cc.credit_limit > 0.8
                                                                ? colors.danger
                                                                : colors.warning,
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.usageText}>
                                            {Math.round(
                                                ((cc.current_balance || 0) / cc.credit_limit) * 100
                                            )}
                                            % used
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </>
            )}

            <View style={{ height: spacing.xxxl }} />
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },

    // Summary
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xxl,
    },
    summaryRow: {
        flexDirection: 'row',
    },
    summaryItem: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    summaryValue: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.extrabold,
        color: colors.text,
    },
    summaryValueSm: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },

    // Section
    sectionLabel: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxxl,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyText: {
        color: colors.textDim,
        fontSize: fontSize.md,
        marginTop: spacing.sm,
        fontStyle: 'italic',
    },

    // Credit Cards
    creditCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    ccAccent: {
        width: 4,
    },
    ccContent: {
        flex: 1,
        padding: spacing.lg,
    },
    ccHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    ccIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.warning + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    ccTitleArea: {
        flex: 1,
    },
    ccName: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    ccBank: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    ccDigits: {
        fontSize: fontSize.sm,
        color: colors.textDim,
        fontFamily: 'monospace',
        letterSpacing: 2,
    },
    ccBalanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    ccBalanceLabel: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    ccBalance: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    usageBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    usageBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: colors.surfaceLight,
        borderRadius: 3,
        overflow: 'hidden',
    },
    usageBarFill: {
        height: 6,
        borderRadius: 3,
    },
    usageText: {
        fontSize: fontSize.xs,
        color: colors.textDim,
    },
});

export default AccountsScreen;
