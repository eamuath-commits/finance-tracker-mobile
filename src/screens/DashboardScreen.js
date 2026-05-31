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
import { getAccounts, getTransactions, getAllocationAnalysis, getObligationsMonthlyStatus } from '../services/api';
import SummaryCard from '../components/SummaryCard';
import TransactionRow from '../components/TransactionRow';

const DashboardScreen = ({ navigation }) => {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [obligations, setObligations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedAccountId, setSelectedAccountId] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [accRes, txRes, analysisRes, oblRes] = await Promise.all([
                getAccounts(),
                getTransactions(0, 5000),
                getAllocationAnalysis().catch(() => ({ data: null })),
                getObligationsMonthlyStatus(0).catch(() => ({ data: null })),
            ]);
            setAccounts(accRes.data);
            setTransactions(txRes.data);
            setAnalysis(analysisRes.data);
            setObligations(oblRes.data);
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

    // Filtered transactions based on selected account
    const filteredTransactions = useMemo(() => {
        if (!selectedAccountId) return transactions;
        return transactions.filter((tx) => tx.account_id === selectedAccountId);
    }, [transactions, selectedAccountId]);

    // Monthly summary
    const summary = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthTxs = filteredTransactions.filter(
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
    }, [filteredTransactions]);

    // Total balance — selected account or all
    const totalBalance = useMemo(() => {
        if (selectedAccountId) {
            const acc = accounts.find((a) => a.id === selectedAccountId);
            return acc ? acc.current_balance || 0 : 0;
        }
        return accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    }, [accounts, selectedAccountId]);

    const selectedAccountName = useMemo(() => {
        if (!selectedAccountId) return null;
        const acc = accounts.find((a) => a.id === selectedAccountId);
        return acc ? acc.name : null;
    }, [accounts, selectedAccountId]);

    // Spending by category (all debits, matching web app)
    const categorySpending = useMemo(() => {
        const debits = filteredTransactions.filter((tx) => tx.type === 'debit');
        const catMap = {};
        debits.forEach((tx) => {
            const cat = tx.category || 'Uncategorized';
            catMap[cat] = (catMap[cat] || 0) + (tx.amount || 0);
        });
        const sorted = Object.entries(catMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);
        const maxAmount = sorted.length > 0 ? sorted[0].amount : 1;
        return { categories: sorted, maxAmount };
    }, [filteredTransactions]);

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
        <View style={styles.container}>
            {/* — Sticky Account Filter — */}
            <View style={styles.stickyFilterBar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    <TouchableOpacity
                        style={[styles.filterChip, !selectedAccountId && styles.filterChipActive]}
                        onPress={() => setSelectedAccountId(null)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="layers-outline"
                            size={14}
                            color={!selectedAccountId ? '#FFFFFF' : colors.textMuted}
                        />
                        <Text
                            style={[styles.filterChipText, !selectedAccountId && styles.filterChipTextActive]}
                        >
                            All Accounts
                        </Text>
                    </TouchableOpacity>
                    {accounts.map((acc) => (
                        <TouchableOpacity
                            key={acc.id}
                            style={[styles.filterChip, selectedAccountId === acc.id && styles.filterChipActive]}
                            onPress={() => setSelectedAccountId(acc.id)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="wallet-outline"
                                size={14}
                                color={selectedAccountId === acc.id ? '#FFFFFF' : colors.textMuted}
                            />
                            <Text
                                style={[styles.filterChipText, selectedAccountId === acc.id && styles.filterChipTextActive]}
                                numberOfLines={1}
                            >
                                {acc.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* — Scrollable Content — */}
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* — Welcome & Total Balance — */}
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeText}>Welcome back, Muath</Text>
                    <View style={styles.totalBalanceCard}>
                        <Text style={styles.totalBalanceLabel}>
                            {selectedAccountName || 'Total Balance'}
                        </Text>
                        <Text style={styles.totalBalanceValue}>
                            {formatNumber(totalBalance)} SAR
                        </Text>
                        <Text style={styles.accountCount}>
                            {selectedAccountId
                                ? 'Filtered view'
                                : `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
                        </Text>
                    </View>
                </View>

                {/* — Monthly Summary Cards — */}
                <Text style={styles.sectionLabel}>{summary.monthName}</Text>
                <View style={styles.summaryRow}>
                    <SummaryCard label="Income" value={summary.income} icon="trending-up" iconColor={colors.success} prefix="+" />
                    <View style={{ width: spacing.md }} />
                    <SummaryCard label="Expenses" value={summary.expenses} icon="trending-down" iconColor={colors.danger} prefix="-" />
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
                    <SummaryCard label="Transactions" value={summary.count} icon="receipt-outline" iconColor={colors.primary} isCount />
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
                                <Text style={styles.analysisItemValue}>{formatNumber(analysis.liquid_cash)} SAR</Text>
                            </View>
                            <View style={styles.analysisItem}>
                                <Text style={styles.analysisItemLabel}>Upcoming Bills</Text>
                                <Text style={styles.analysisItemValue}>{formatNumber(analysis.unpaid_obligations_this_month)} SAR</Text>
                            </View>
                            <View
                                style={[styles.analysisItem, {
                                    backgroundColor: analysis.freedom_cash >= 0 ? colors.successBg : colors.dangerBg,
                                }]}
                            >
                                <Text style={styles.analysisItemLabel}>Safe to Spend</Text>
                                <Text
                                    style={[styles.analysisItemValue, {
                                        color: analysis.freedom_cash >= 0 ? colors.successLight : colors.dangerLight,
                                    }]}
                                >
                                    {formatNumber(analysis.freedom_cash)} SAR
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* — Spending by Category — */}
                {categorySpending.categories.length > 0 && (
                    <View style={styles.categorySection}>
                        <Text style={styles.sectionLabel}>Spending by Category</Text>
                        <View style={styles.categoryCard}>
                            {categorySpending.categories.slice(0, 8).map((cat, idx) => (
                                <View key={cat.name} style={styles.categoryRow}>
                                    <View style={styles.categoryInfo}>
                                        <View
                                            style={[styles.categoryDot, { backgroundColor: colors.chart[idx % colors.chart.length] }]}
                                        />
                                        <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                                    </View>
                                    <View style={styles.categoryBarContainer}>
                                        <View style={styles.categoryBarBg}>
                                            <View
                                                style={[styles.categoryBarFill, {
                                                    width: `${(cat.amount / categorySpending.maxAmount) * 100}%`,
                                                    backgroundColor: colors.chart[idx % colors.chart.length],
                                                }]}
                                            />
                                        </View>
                                        <Text style={styles.categoryAmount}>{formatNumber(cat.amount)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* — Recent Transactions — */}
                <View style={styles.recentHeader}>
                    <Text style={styles.sectionLabel}>Recent Transactions</Text>
                </View>
                <View style={styles.transactionsList}>
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.slice(0, 10).map((tx) => (
                            <TransactionRow
                                key={tx.id}
                                transaction={tx}
                                onPress={(t) => navigation.navigate('TransactionDetail', { transaction: t })}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={32} color={colors.textDim} />
                            <Text style={styles.emptyText}>No transactions yet</Text>
                        </View>
                    )}
                </View>

                {/* — Obligations Widget — */}
                {obligations && obligations.total_obligations > 0 && (
                    <View style={styles.obligationsWidget}>
                        <View style={styles.obligationsHeader}>
                            <Text style={styles.sectionLabel}>Obligations This Month</Text>
                            <TouchableOpacity
                                onPress={() => navigation.getParent()?.navigate('More', { screen: 'Obligations' })}
                            >
                                <Text style={styles.viewAllLink}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.obligationsCard}>
                            <View style={styles.obligationsStats}>
                                <View style={styles.oblStat}>
                                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                                    <Text style={[styles.oblStatValue, { color: colors.successLight }]}>{obligations.paid_count}</Text>
                                    <Text style={styles.oblStatLabel}>Paid</Text>
                                </View>
                                <View style={styles.oblDivider} />
                                <View style={styles.oblStat}>
                                    <Ionicons name="ellipse-outline" size={16} color={colors.textDim} />
                                    <Text style={styles.oblStatValue}>{obligations.unpaid_count}</Text>
                                    <Text style={styles.oblStatLabel}>Unpaid</Text>
                                </View>
                                {obligations.overdue_count > 0 && (
                                    <>
                                        <View style={styles.oblDivider} />
                                        <View style={styles.oblStat}>
                                            <Ionicons name="alert-circle" size={16} color={colors.danger} />
                                            <Text style={[styles.oblStatValue, { color: colors.dangerLight }]}>{obligations.overdue_count}</Text>
                                            <Text style={styles.oblStatLabel}>Overdue</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                            <View style={styles.oblAmountRow}>
                                <Text style={styles.oblAmountLabel}>Remaining</Text>
                                <Text style={[styles.oblAmountValue, { color: obligations.remaining > 0 ? colors.dangerLight : colors.successLight }]}>
                                    {formatNumber(obligations.remaining)} SAR
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: spacing.xxxl * 2 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollArea: {
        flex: 1,
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

    // Sticky filter bar
    stickyFilterBar: {
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: spacing.sm,
    },
    filterScrollContent: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textMuted,
    },
    filterChipTextActive: {
        color: '#FFFFFF',
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

    // Category spending
    categorySection: {
        marginBottom: spacing.xxl,
    },
    categoryCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 110,
        marginRight: spacing.md,
    },
    categoryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.sm,
    },
    categoryName: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        flex: 1,
    },
    categoryBarContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    categoryBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: colors.surfaceLight,
        borderRadius: 3,
        overflow: 'hidden',
    },
    categoryBarFill: {
        height: 6,
        borderRadius: 3,
    },
    categoryAmount: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.textMuted,
        width: 70,
        textAlign: 'right',
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

    // Obligations Widget
    obligationsWidget: {
        marginTop: spacing.xxl,
    },
    obligationsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    viewAllLink: {
        fontSize: fontSize.sm,
        color: colors.primary,
        fontWeight: fontWeight.semibold,
    },
    obligationsCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
    },
    obligationsStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    oblStat: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        gap: 4,
    },
    oblStatValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    oblStatLabel: {
        fontSize: fontSize.xs,
        color: colors.textDim,
    },
    oblDivider: {
        width: 1,
        height: 32,
        backgroundColor: colors.border,
    },
    oblAmountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    oblAmountLabel: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    oblAmountValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
});

export default DashboardScreen;
