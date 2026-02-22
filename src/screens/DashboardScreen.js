import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { getAccounts, getTransactions, getObligations, getAllocationAnalysis } from '../services/api';
import SummaryCard from '../components/SummaryCard';
import TransactionRow from '../components/TransactionRow';

const DashboardScreen = () => {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [accRes, txRes, analysisRes] = await Promise.all([
                getAccounts(),
                getTransactions(),
                getAllocationAnalysis().catch(() => ({ data: null })),
            ]);
            setAccounts(accRes.data);
            setTransactions(txRes.data);
            setAnalysis(analysisRes.data);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError('Could not connect to the server. Make sure the backend is running.');
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

    // Monthly summary
    const summary = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthTxs = transactions.filter(
            (tx) => new Date(tx.timestamp) >= monthStart
        );
        const income = monthTxs
            .filter((tx) => tx.type === 'credit')
            .reduce((s, tx) => s + tx.amount, 0);
        const expenses = monthTxs
            .filter((tx) => tx.type === 'debit')
            .reduce((s, tx) => s + tx.amount, 0);
        return {
            income,
            expenses,
            net: income - expenses,
            count: monthTxs.length,
            monthName: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
        };
    }, [transactions]);

    // Total balance across all accounts
    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    }, [accounts]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Ionicons name="cloud-offline-outline" size={48} color={colors.textDim} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
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
            {/* — Welcome & Total Balance — */}
            <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>Welcome back, Muath</Text>
                <View style={styles.totalBalanceCard}>
                    <Text style={styles.totalBalanceLabel}>Total Balance</Text>
                    <Text style={styles.totalBalanceValue}>
                        {formatNumber(totalBalance)} SAR
                    </Text>
                    <Text style={styles.accountCount}>
                        {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            {/* — Monthly Summary Cards — */}
            <Text style={styles.sectionLabel}>{summary.monthName}</Text>
            <View style={styles.summaryRow}>
                <SummaryCard
                    label="Income"
                    value={summary.income}
                    icon="trending-up"
                    iconColor={colors.success}
                    prefix="+"
                />
                <View style={{ width: spacing.md }} />
                <SummaryCard
                    label="Expenses"
                    value={summary.expenses}
                    icon="trending-down"
                    iconColor={colors.danger}
                    prefix="-"
                />
            </View>
            <View style={styles.summaryRow}>
                <SummaryCard
                    label="Net"
                    value={Math.abs(summary.net)}
                    icon="cash-outline"
                    iconColor={summary.net >= 0 ? colors.success : colors.danger}
                    prefix={summary.net >= 0 ? '+' : '-'}
                />
                <View style={{ width: spacing.md }} />
                <SummaryCard
                    label="Transactions"
                    value={summary.count}
                    icon="receipt-outline"
                    iconColor={colors.primary}
                    isCount
                />
            </View>

            {/* — Smart Analysis — */}
            {analysis && (
                <View style={styles.analysisCard}>
                    <View style={styles.analysisHeader}>
                        <Ionicons name="bulb-outline" size={18} color={colors.warningLight} />
                        <Text style={styles.analysisTitle}>Smart Analysis</Text>
                    </View>
                    <Text style={styles.analysisMessage}>{analysis.message}</Text>
                    <View style={styles.analysisGrid}>
                        <View style={styles.analysisItem}>
                            <Text style={styles.analysisItemLabel}>Liquid Cash</Text>
                            <Text style={styles.analysisItemValue}>
                                {formatNumber(analysis.liquid_cash)} SAR
                            </Text>
                        </View>
                        <View style={styles.analysisItem}>
                            <Text style={styles.analysisItemLabel}>Upcoming Bills</Text>
                            <Text style={styles.analysisItemValue}>
                                {formatNumber(analysis.unpaid_obligations_this_month)} SAR
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.analysisItem,
                                {
                                    backgroundColor:
                                        analysis.freedom_cash >= 0 ? colors.successBg : colors.dangerBg,
                                },
                            ]}
                        >
                            <Text style={styles.analysisItemLabel}>Safe to Spend</Text>
                            <Text
                                style={[
                                    styles.analysisItemValue,
                                    {
                                        color:
                                            analysis.freedom_cash >= 0
                                                ? colors.successLight
                                                : colors.dangerLight,
                                    },
                                ]}
                            >
                                {formatNumber(analysis.freedom_cash)} SAR
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* — Recent Transactions — */}
            <View style={styles.recentHeader}>
                <Text style={styles.sectionLabel}>Recent Transactions</Text>
            </View>
            <View style={styles.transactionsList}>
                {transactions.length > 0 ? (
                    transactions.slice(0, 10).map((tx) => (
                        <TransactionRow key={tx.id} transaction={tx} />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={32} color={colors.textDim} />
                        <Text style={styles.emptyText}>No transactions yet</Text>
                    </View>
                )}
            </View>

            {/* Bottom spacer */}
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
        padding: spacing.xxl,
    },
    errorText: {
        color: colors.textMuted,
        fontSize: fontSize.md,
        textAlign: 'center',
        marginTop: spacing.lg,
        lineHeight: 22,
    },
    retryButton: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
    },
    retryText: {
        color: colors.text,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.md,
    },

    // Welcome
    welcomeSection: {
        marginBottom: spacing.xxl,
    },
    welcomeText: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    totalBalanceCard: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.xxl,
    },
    totalBalanceLabel: {
        fontSize: fontSize.sm,
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    totalBalanceValue: {
        fontSize: fontSize.title,
        fontWeight: fontWeight.extrabold,
        color: '#FFFFFF',
    },
    accountCount: {
        fontSize: fontSize.sm,
        color: 'rgba(255,255,255,0.6)',
        marginTop: spacing.xs,
    },

    // Summary
    sectionLabel: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },

    // Analysis
    analysisCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: spacing.md,
        marginBottom: spacing.xxl,
    },
    analysisHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    analysisTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.warningLight,
        marginLeft: spacing.sm,
    },
    analysisMessage: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: spacing.lg,
    },
    analysisGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    analysisItem: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    analysisItemLabel: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        textTransform: 'uppercase',
        marginBottom: spacing.xs,
    },
    analysisItemValue: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },

    // Transactions
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    transactionsList: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxxl,
    },
    emptyText: {
        color: colors.textDim,
        fontSize: fontSize.md,
        marginTop: spacing.sm,
        fontStyle: 'italic',
    },
});

export default DashboardScreen;
