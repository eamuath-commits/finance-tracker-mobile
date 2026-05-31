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
import { getTransactions, getAccounts, getCreditCards, createTransaction } from '../services/api';
import TransactionRow from '../components/TransactionRow';
import FloatingActionButton from '../components/FloatingActionButton';
import FormModal, { FormField, formInputStyle } from '../components/FormModal';

const dateFilters = [
    { key: 'all', label: 'All Time' },
    { key: 'month', label: 'This Month' },
    { key: 'last', label: 'Last Month' },
    { key: 'week', label: 'This Week' },
];

const TransactionsScreen = ({ navigation }) => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [creditCards, setCreditCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'debit', 'credit'
    const [dateFilter, setDateFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({
        merchant: '',
        amount: '',
        type: 'debit',
        category: '',
        notes: '',
        account_id: '',
    });

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

    // Date filter boundaries
    const dateBounds = useMemo(() => {
        const now = new Date();
        switch (dateFilter) {
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            case 'last': {
                const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return { start: d, end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) };
            }
            case 'week': {
                const d = new Date(now);
                d.setDate(d.getDate() - d.getDay());
                d.setHours(0, 0, 0, 0);
                return d;
            }
            default:
                return null;
        }
    }, [dateFilter]);

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

        // Date filter
        if (dateFilter !== 'all' && dateBounds) {
            if (dateBounds.start && dateBounds.end) {
                // last month
                filtered = filtered.filter((tx) => {
                    const d = new Date(tx.timestamp);
                    return d >= dateBounds.start && d <= dateBounds.end;
                });
            } else {
                filtered = filtered.filter((tx) => new Date(tx.timestamp) >= dateBounds);
            }
        }

        // Sort by date descending
        return filtered.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
    }, [transactions, searchTerm, typeFilter, dateFilter, dateBounds]);

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
        setDateFilter('all');
    };

    const hasFilters = searchTerm || typeFilter !== 'all' || dateFilter !== 'all';

    const handleTransactionPress = (tx) => {
        navigation.navigate('TransactionDetail', { transaction: tx });
    };

    const handleCreate = async () => {
        if (!createForm.merchant || !createForm.amount) return;
        try {
            await createTransaction({
                merchant: createForm.merchant,
                amount: parseFloat(createForm.amount),
                type: createForm.type,
                category: createForm.category || undefined,
                notes: createForm.notes || undefined,
                account_id: createForm.account_id || undefined,
                status: 'completed',
                timestamp: new Date().toISOString(),
            });
            setShowCreate(false);
            setCreateForm({ merchant: '', amount: '', type: 'debit', category: '', notes: '', account_id: '' });
            fetchData();
        } catch (err) {
            console.error('Create transaction error:', err);
        }
    };

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
                <View style={styles.filterArea}>
                    {/* Type filters */}
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
                    </View>

                    {/* Date filters */}
                    <View style={styles.filterRow}>
                        {dateFilters.map((d) => (
                            <TouchableOpacity
                                key={d.key}
                                style={[
                                    styles.filterChip,
                                    dateFilter === d.key && styles.filterChipActive,
                                ]}
                                onPress={() => setDateFilter(d.key)}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        dateFilter === d.key && styles.filterChipTextActive,
                                    ]}
                                >
                                    {d.label}
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
                renderItem={({ item }) => (
                    <TransactionRow transaction={item} onPress={handleTransactionPress} />
                )}
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

            {/* FAB */}
            <FloatingActionButton onPress={() => setShowCreate(true)} />

            {/* Create Transaction Modal */}
            <FormModal
                visible={showCreate}
                onClose={() => setShowCreate(false)}
                title="New Transaction"
                onSubmit={handleCreate}
                submitLabel="Create"
            >
                <FormField label="Merchant" required>
                    <TextInput
                        style={formInputStyle}
                        value={createForm.merchant}
                        onChangeText={(t) => setCreateForm((p) => ({ ...p, merchant: t }))}
                        placeholder="Enter merchant name"
                        placeholderTextColor={colors.textDim}
                    />
                </FormField>

                <FormField label="Amount (SAR)" required>
                    <TextInput
                        style={formInputStyle}
                        value={createForm.amount}
                        onChangeText={(t) => setCreateForm((p) => ({ ...p, amount: t }))}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={colors.textDim}
                    />
                </FormField>

                <FormField label="Type">
                    <View style={styles.typeToggle}>
                        {['debit', 'credit'].map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.typeBtn, createForm.type === t && styles.typeBtnActive]}
                                onPress={() => setCreateForm((p) => ({ ...p, type: t }))}
                            >
                                <Ionicons
                                    name={t === 'debit' ? 'arrow-up' : 'arrow-down'}
                                    size={16}
                                    color={createForm.type === t ? '#FFFFFF' : colors.textMuted}
                                />
                                <Text style={[styles.typeLabel, createForm.type === t && styles.typeLabelActive]}>
                                    {t === 'debit' ? 'Expense' : 'Income'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </FormField>

                <FormField label="Account">
                    <View style={styles.accountPicker}>
                        {accounts.map((acc) => (
                            <TouchableOpacity
                                key={acc.id}
                                style={[styles.accountChip, createForm.account_id === acc.id && styles.accountChipActive]}
                                onPress={() => setCreateForm((p) => ({ ...p, account_id: acc.id }))}
                            >
                                <Text style={[styles.accountChipText, createForm.account_id === acc.id && styles.accountChipTextActive]}>
                                    {acc.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </FormField>

                <FormField label="Category">
                    <TextInput
                        style={formInputStyle}
                        value={createForm.category}
                        onChangeText={(t) => setCreateForm((p) => ({ ...p, category: t }))}
                        placeholder="Category (optional)"
                        placeholderTextColor={colors.textDim}
                    />
                </FormField>

                <FormField label="Notes">
                    <TextInput
                        style={[formInputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
                        value={createForm.notes}
                        onChangeText={(t) => setCreateForm((p) => ({ ...p, notes: t }))}
                        placeholder="Notes (optional)"
                        placeholderTextColor={colors.textDim}
                        multiline
                    />
                </FormField>
            </FormModal>
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
    filterArea: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.sm,
    },
    filterRow: {
        flexDirection: 'row',
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
        paddingBottom: spacing.xxxl * 3,
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

    // Create form
    typeToggle: { flexDirection: 'row', gap: spacing.md },
    typeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
        backgroundColor: colors.surface, paddingVertical: spacing.md, borderRadius: borderRadius.sm,
        borderWidth: 1, borderColor: colors.border,
    },
    typeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeLabel: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textMuted },
    typeLabelActive: { color: '#FFFFFF' },
    accountPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    accountChip: {
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
        borderRadius: borderRadius.full, backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border,
    },
    accountChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    accountChipText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },
    accountChipTextActive: { color: '#FFFFFF' },
});

export default TransactionsScreen;
