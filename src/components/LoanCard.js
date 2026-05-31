import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';

const LoanCard = ({ loan, onLongPress }) => {
    const remaining = loan.remaining_balance || 0;
    const principal = loan.principal_amount || 1;
    const paidPercent = Math.max(0, Math.min(100, ((principal - remaining) / principal) * 100));
    const monthlyPayment = loan.monthly_payment || 0;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => onLongPress?.(loan)}
        >
        <View style={styles.card}>
            <View style={[styles.accent, { backgroundColor: colors.warning }]} />
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="trending-down-outline" size={20} color={colors.warning} />
                    </View>
                    <View style={styles.titleArea}>
                        <Text style={styles.name} numberOfLines={1}>{loan.name}</Text>
                        {loan.due_day ? (
                            <Text style={styles.subtitle}>Due day {loan.due_day}</Text>
                        ) : null}
                    </View>
                </View>

                {/* Balance info */}
                <View style={styles.balanceRow}>
                    <View style={styles.balanceItem}>
                        <Text style={styles.balanceLabel}>Remaining</Text>
                        <Text style={[styles.balanceValue, { color: colors.dangerLight }]}>
                            {formatNumber(remaining)} SAR
                        </Text>
                    </View>
                    <View style={styles.balanceItem}>
                        <Text style={styles.balanceLabel}>Monthly</Text>
                        <Text style={styles.balanceValue}>
                            {formatNumber(monthlyPayment)} SAR
                        </Text>
                    </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[styles.progressFill, { width: `${paidPercent}%` }]}
                        />
                    </View>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progressText}>
                            {Math.round(paidPercent)}% paid
                        </Text>
                        <Text style={styles.progressText}>
                            {formatNumber(principal)} SAR total
                        </Text>
                    </View>
                </View>

                {/* Extra details */}
                {(loan.interest_rate || loan.term_months) ? (
                    <View style={styles.detailsRow}>
                        {loan.interest_rate ? (
                            <View style={styles.detailChip}>
                                <Ionicons name="trending-up-outline" size={12} color={colors.textDim} />
                                <Text style={styles.detailText}>{loan.interest_rate}% APR</Text>
                            </View>
                        ) : null}
                        {loan.term_months ? (
                            <View style={styles.detailChip}>
                                <Ionicons name="calendar-outline" size={12} color={colors.textDim} />
                                <Text style={styles.detailText}>{loan.term_months} months</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    accent: {
        width: 4,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.warning + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    titleArea: {
        flex: 1,
    },
    name: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    balanceItem: {},
    balanceLabel: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    progressContainer: {
        marginBottom: spacing.sm,
    },
    progressBar: {
        height: 6,
        backgroundColor: colors.surfaceLight,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        fontSize: fontSize.xs,
        color: colors.textDim,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: fontSize.xs,
        color: colors.textDim,
    },
});

export default LoanCard;
