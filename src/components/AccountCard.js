import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';

const AccountCard = ({ account, onPress }) => {
    const balance = account.current_balance || 0;
    const isNegative = balance < 0;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress?.(account)}
            activeOpacity={0.7}
        >
            {/* Left accent bar */}
            <View style={[styles.accent, { backgroundColor: colors.primary }]} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.titleArea}>
                        <Text style={styles.name} numberOfLines={1}>{account.name}</Text>
                        {account.bank_name ? (
                            <Text style={styles.bank} numberOfLines={1}>{account.bank_name}</Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.balanceArea}>
                    <Text style={styles.balanceLabel}>Balance</Text>
                    <Text style={[styles.balance, isNegative && styles.balanceNegative]}>
                        {formatNumber(Math.abs(balance))} SAR
                    </Text>
                </View>

                {account.last_4_digits || account.first_4_digits ? (
                    <View style={styles.footer}>
                        <Text style={styles.digits}>
                            {account.first_4_digits ? `${account.first_4_digits} •••• ` : '•••• '}
                            {account.last_4_digits || ''}
                        </Text>
                    </View>
                ) : null}
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
        backgroundColor: colors.primary + '15',
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
    bank: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    balanceArea: {
        marginBottom: spacing.sm,
    },
    balanceLabel: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    balance: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.extrabold,
        color: colors.text,
    },
    balanceNegative: {
        color: colors.dangerLight,
    },
    footer: {
        marginTop: spacing.xs,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    digits: {
        fontSize: fontSize.sm,
        color: colors.textDim,
        fontFamily: 'monospace',
        letterSpacing: 2,
    },
});

export default AccountCard;
