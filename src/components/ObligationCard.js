import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';

const statusConfig = {
    PAID: { color: colors.success, bg: colors.successBg, icon: 'checkmark-circle', label: 'Paid' },
    UNPAID: { color: colors.textDim, bg: colors.surface, icon: 'ellipse-outline', label: 'Unpaid' },
    OVERDUE: { color: colors.danger, bg: colors.dangerBg, icon: 'alert-circle', label: 'Overdue' },
    BUDGET: { color: colors.primary, bg: colors.primary + '15', icon: 'calculator-outline', label: 'Budget' },
};

const ObligationCard = ({ obligation, onPay, onLongPress }) => {
    const config = statusConfig[obligation.status] || statusConfig.UNPAID;
    const isPaid = obligation.status === 'PAID';
    const isOverdue = obligation.status === 'OVERDUE';

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => onLongPress?.(obligation)}
        >
        <View style={[styles.card, isOverdue && styles.cardOverdue]}>
            {/* Left accent */}
            <View style={[styles.accent, { backgroundColor: config.color }]} />

            <View style={styles.content}>
                {/* Top row: Name + Status */}
                <View style={styles.topRow}>
                    <View style={styles.nameArea}>
                        <Text style={styles.name} numberOfLines={1}>{obligation.name}</Text>
                        {obligation.category ? (
                            <Text style={styles.category} numberOfLines={1}>{obligation.category}</Text>
                        ) : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                        <Ionicons name={config.icon} size={12} color={config.color} />
                        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                </View>

                {/* Bottom row: Amount + Due + Action */}
                <View style={styles.bottomRow}>
                    <View style={styles.detailsArea}>
                        <Text style={styles.amount}>
                            {formatNumber(obligation.expected_amount || 0)} SAR
                        </Text>
                        {obligation.due_day ? (
                            <Text style={styles.dueDay}>Due day {obligation.due_day}</Text>
                        ) : null}
                    </View>

                    {!isPaid && onPay && (
                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={() => onPay(obligation)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            <Text style={styles.payText}>Pay</Text>
                        </TouchableOpacity>
                    )}

                    {isPaid && obligation.payment && (
                        <Text style={styles.paidAmount}>
                            {formatNumber(obligation.payment.amount || 0)} SAR
                        </Text>
                    )}
                </View>
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
    cardOverdue: {
        borderColor: colors.danger + '40',
    },
    accent: {
        width: 4,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    nameArea: {
        flex: 1,
        marginRight: spacing.md,
    },
    name: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    category: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    statusText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailsArea: {
        flex: 1,
    },
    amount: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textSecondary,
    },
    dueDay: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        marginTop: 2,
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    payText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: '#FFFFFF',
    },
    paidAmount: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.successLight,
    },
});

export default ObligationCard;
