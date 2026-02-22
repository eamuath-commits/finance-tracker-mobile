import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';
import { getTransactions, getAccounts, getCreditCards } from '../services/api';
import TransactionRow from '../components/TransactionRow';

const TransactionsScreen = () => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [creditCards, setCreditCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'debit', 'credit'
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [txRes, accRes, ccRes] = await Promise.all([
                getTransactions(),
                getAccounts(),
                getCreditCards(),
            ]);
            setTransactions(txRes.data);
            setAccounts(accRes.data);
            setCreditCards(ccRes.data);
        } catch (err) {
            console.error('Transactions fetch error:', err);
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

    // Filtered transactions
    const filteredTransactions = useMemo(() => {
        let filtered = transactions;

        // Search
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter((tx) => {
                return (
                    (tx.merchant || '').toLowerCase().includes(term) ||
                    (tx.category || '').toLowerCase().includes(term) ||
                    (tx.notes || '').toLowerCase().includes(term) ||
                    tx.amount?.toString().includes(term)
                );
            });
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter((tx) => tx.type === typeFilter);
        }

        // Sort by date descending
        return filtered.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
    }, [transactions, searchTerm, typeFilter]);

    // Totals
    const totals = useMemo(() => {
        let totalCredit = 0;
        let totalDebit = 0;
        filteredTransactions.forEach((tx) => {
            if (tx.type === 'credit') totalCredit += tx.amount || 0;
            else totalDebit += tx.amount || 0;
        });
        return { totalCredit, totalDebit, net: totalCredit - totalDebit };
    }, [filteredTransactions]);

    const clearFilters = () => {
        setSearchTerm('');
        setTypeFilter('all');
    };

    const hasFilters = searchTerm || typeFilter !== 'all';

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* — Search Bar — */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={18} color={colors.textDim} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search merchant, category, amount..."
                        placeholderTextColor={colors.textDim}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        returnKeyType="search"
                    />
                    {searchTerm ? (
                        <TouchableOpacity onPress={() => setSearchTerm('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textDim} />
                        </TouchableOpacity>
                    ) : null}
                </View>

                <TouchableOpacity
                    style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Ionicons
                        name="filter"
                        size={18}
                        color={showFilters ? colors.primary : colors.textMuted}
                    />
                </TouchableOpacity>
            </View>

            {/* — Filter Chips — */}
            {showFilters && (
                <View style={styles.filterRow}>
                    {['all', 'debit', 'credit'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.filterChip,
                                typeFilter === type && styles.filterChipActive,
                            ]}
                            onPress={() => setTypeFilter(type)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    typeFilter === type && styles.filterChipTextActive,
                                ]}
                            >
                                {type === 'all' ? 'All' : type === 'debit' ? 'Expenses' : 'Income'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {hasFilters && (
                        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                            <Ionicons name="close" size={14} color={colors.textMuted} />
                            <Text style={styles.clearText}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* — Totals Bar — */}
            <View style={styles.totalsBar}>
                <View style={styles.totalItem}>
                    <Text style={styles.totalLabel}>Credit</Text>
                    <Text style={[styles.totalValue, { color: colors.successLight }]}>
                        +{formatNumber(totals.totalCredit)}
                    </Text>
                </View>
                <View style={[styles.totalItem, styles.totalDivider]}>
                    <Text style={styles.totalLabel}>Debit</Text>
                    <Text style={[styles.totalValue, { color: colors.dangerLight }]}>
                        -{formatNumber(totals.totalDebit)}
                    </Text>
                </View>
                <View style={styles.totalItem}>
                    <Text style={styles.totalLabel}>Net</Text>
                    <Text
                        style={[
                            styles.totalValue,
                            { color: totals.net >= 0 ? colors.successLight : colors.dangerLight },
                        ]}
                    >
                        {totals.net >= 0 ? '+' : ''}{formatNumber(totals.net)}
                    </Text>
                </View>
                <View style={styles.totalCount}>
                    <Text style={styles.countText}>{filteredTransactions.length}</Text>
                </View>
            </View>

            {/* — Transaction List — */}
            <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <TransactionRow transaction={item} />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                contentContainerStyle={
                    filteredTransactions.length === 0 ? styles.emptyContainer : styles.listContent
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={colors.textDim} />
                        <Text style={styles.emptyText}>
                            {hasFilters ? 'No transactions match your filters' : 'No transactions yet'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },

    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        gap: spacing.sm,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: fontSize.md,
        paddingVertical: spacing.md,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterButtonActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '15',
    },

    // Filters
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.sm,
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterChipActive: {
        backgroundColor: colors.primary + '20',
        borderColor: colors.primary,
    },
    filterChipText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        fontWeight: fontWeight.medium,
    },
    filterChipTextActive: {
        color: colors.primary,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: 4,
    },
    clearText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },

    // Totals
    totalsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    totalItem: {
        flex: 1,
    },
    totalDivider: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        marginHorizontal: spacing.sm,
    },
    totalLabel: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        marginBottom: 2,
    },
    totalValue: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
    totalCount: {
        backgroundColor: colors.primary + '20',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginLeft: spacing.sm,
    },
    countText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },

    // List
    listContent: {
        paddingBottom: spacing.xxxl,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxxl * 2,
    },
    emptyText: {
        color: colors.textDim,
        fontSize: fontSize.md,
        marginTop: spacing.md,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});

export default TransactionsScreen;
