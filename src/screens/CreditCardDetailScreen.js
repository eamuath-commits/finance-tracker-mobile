import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';
import { getCreditCard, getCreditCardTransactions } from '../services/api';
import TransactionRow from '../components/TransactionRow';

const CreditCardDetailScreen = ({ route, navigation }) => {
    const { cardId, card: passedCard } = route.params || {};
    const [card, setCard] = useState(passedCard || null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const id = cardId || passedCard?.id;
            const [cardRes, txRes] = await Promise.all([
                getCreditCard(id),
                getCreditCardTransactions(id),
            ]);
            setCard(cardRes.data);
            setTransactions(txRes.data);
        } catch (err) {
            console.error('Credit card detail fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [cardId, passedCard]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleTransactionPress = (tx) => {
        navigation.navigate('TransactionDetail', { transaction: tx });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!card) {
        return (
            <View style={styles.center}>
                <Ionicons name="card-outline" size={48} color={colors.textDim} />
                <Text style={styles.errorText}>Card not found</Text>
            </View>
        );
    }

    const utilization = card.credit_limit > 0
        ? Math.round((card.current_balance / card.credit_limit) * 100)
        : 0;
    const availableCredit = Math.max(0, (card.credit_limit || 0) - (card.current_balance || 0));
    const isHighUtil = utilization > 80;

    const renderHeader = () => (
        <View>
            {/* Card Hero */}
            <View style={styles.cardHero}>
                <View style={styles.cardVisual}>
                    <View style={styles.cardTop}>
                        <View style={styles.bankInfo}>
                            <Ionicons name="card" size={28} color={colors.warning} />
                            <View>
                                <Text style={styles.cardName} numberOfLines={1}>
                                    {card.name || `${card.bank_name} Card`}
                                </Text>
                                {card.bank_name && (
                                    <Text style={styles.cardBank}>{card.bank_name}</Text>
                                )}
                            </View>
                        </View>
                        <Text style={styles.cardDigits}>•••• {card.last_4_digits || '????'}</Text>
                    </View>

                    <View style={styles.cardBalance}>
                        <Text style={styles.balanceLabel}>Current Balance</Text>
                        <Text style={[styles.balanceValue, { color: colors.dangerLight }]}>
                            {formatNumber(card.current_balance || 0)} SAR
                        </Text>
                    </View>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Credit Limit</Text>
                    <Text style={styles.statValue}>{formatNumber(card.credit_limit || 0)} SAR</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Available</Text>
                    <Text style={[styles.statValue, { color: colors.successLight }]}>
                        {formatNumber(availableCredit)} SAR
                    </Text>
                </View>
            </View>

            {/* Utilization bar */}
            {card.credit_limit > 0 && (
                <View style={styles.utilizationCard}>
                    <View style={styles.utilizationHeader}>
                        <Text style={styles.utilizationLabel}>Credit Utilization</Text>
                        <Text style={[styles.utilizationPercent, { color: isHighUtil ? colors.danger : colors.success }]}>
                            {utilization}%
                        </Text>
                    </View>
                    <View style={styles.utilizationBar}>
                        <View
                            style={[styles.utilizationFill, {
                                width: `${Math.min(utilization, 100)}%`,
                                backgroundColor: isHighUtil ? colors.danger : utilization > 50 ? colors.warning : colors.success,
                            }]}
                        />
                    </View>
                </View>
            )}

            {/* Billing info */}
            {(card.statement_day || card.due_day || card.apr) && (
                <View style={styles.billingCard}>
                    {card.statement_day && (
                        <View style={styles.billingItem}>
                            <Ionicons name="calendar-outline" size={16} color={colors.textDim} />
                            <Text style={styles.billingLabel}>Statement Day</Text>
                            <Text style={styles.billingValue}>{card.statement_day}</Text>
                        </View>
                    )}
                    {card.due_day && (
                        <View style={styles.billingItem}>
                            <Ionicons name="alarm-outline" size={16} color={colors.textDim} />
                            <Text style={styles.billingLabel}>Due Day</Text>
                            <Text style={styles.billingValue}>{card.due_day}</Text>
                        </View>
                    )}
                    {card.apr && (
                        <View style={styles.billingItem}>
                            <Ionicons name="trending-up-outline" size={16} color={colors.textDim} />
                            <Text style={styles.billingLabel}>APR</Text>
                            <Text style={styles.billingValue}>{card.apr}%</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Transactions header */}
            <View style={styles.txHeader}>
                <Text style={styles.sectionLabel}>Transactions</Text>
                <Text style={styles.txCount}>{transactions.length} total</Text>
            </View>
        </View>
    );

    return (
        <FlatList
            style={styles.container}
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <TransactionRow transaction={item} onPress={handleTransactionPress} />
            )}
            ListHeaderComponent={renderHeader}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={32} color={colors.textDim} />
                    <Text style={styles.emptyText}>No transactions for this card</Text>
                </View>
            }
            contentContainerStyle={styles.listContent}
        />
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { paddingBottom: spacing.xxxl },
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background,
    },
    errorText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.lg },

    // Card hero
    cardHero: { padding: spacing.lg },
    cardVisual: {
        backgroundColor: colors.surface, borderRadius: borderRadius.lg,
        padding: spacing.xl, borderWidth: 1, borderColor: colors.border,
    },
    cardTop: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: spacing.xxl,
    },
    bankInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    cardName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
    cardBank: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
    cardDigits: {
        fontSize: fontSize.md, color: colors.textDim, fontFamily: 'monospace', letterSpacing: 2,
    },
    cardBalance: {},
    balanceLabel: {
        fontSize: fontSize.xs, color: colors.textDim, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 4,
    },
    balanceValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold },

    // Stats
    statsGrid: {
        flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md,
    },
    statCard: {
        flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md,
        padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
    },
    statLabel: {
        fontSize: fontSize.xs, color: colors.textDim, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 4,
    },
    statValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },

    // Utilization
    utilizationCard: {
        marginHorizontal: spacing.lg, marginBottom: spacing.md,
        backgroundColor: colors.surface, borderRadius: borderRadius.md,
        padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
    },
    utilizationHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: spacing.sm,
    },
    utilizationLabel: {
        fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium,
    },
    utilizationPercent: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    utilizationBar: {
        height: 8, backgroundColor: colors.surfaceLight, borderRadius: 4, overflow: 'hidden',
    },
    utilizationFill: { height: 8, borderRadius: 4 },

    // Billing
    billingCard: {
        marginHorizontal: spacing.lg, marginBottom: spacing.md,
        backgroundColor: colors.surface, borderRadius: borderRadius.md,
        padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
        flexDirection: 'row', justifyContent: 'space-around',
    },
    billingItem: { alignItems: 'center', gap: 4 },
    billingLabel: { fontSize: fontSize.xs, color: colors.textDim },
    billingValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },

    // Transactions
    txHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
    },
    sectionLabel: {
        fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textDim,
        textTransform: 'uppercase', letterSpacing: 1,
    },
    txCount: { fontSize: fontSize.sm, color: colors.textDim },

    // Empty
    emptyState: { alignItems: 'center', padding: spacing.xxxl },
    emptyText: { color: colors.textDim, fontSize: fontSize.md, marginTop: spacing.sm, fontStyle: 'italic' },
});

export default CreditCardDetailScreen;
