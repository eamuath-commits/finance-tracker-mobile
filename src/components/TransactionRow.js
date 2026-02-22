import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';

const TransactionRow = ({ transaction, onPress }) => {
    const isCredit = transaction.type === 'credit';
    const merchantName = transaction.merchant_info?.name || transaction.merchant || 'Unknown';
    const category = transaction.category || '';
    const amount = transaction.amount || 0;
    const date = transaction.timestamp
        ? new Date(transaction.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        })
        : '';

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={() => onPress?.(transaction)}
            activeOpacity={0.6}
        >
            {/* Logo / Avatar */}
            <View style={[styles.avatar, { backgroundColor: isCredit ? colors.successBg : colors.dangerBg }]}>
                <Ionicons
                    name={isCredit ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={isCredit ? colors.success : colors.danger}
                />
            </View>

            {/* Merchant + Category */}
            <View style={styles.info}>
                <Text style={styles.merchant} numberOfLines={1}>
                    {merchantName}
                </Text>
                {category ? (
                    <Text style={styles.category} numberOfLines={1}>
                        {category}
                    </Text>
                ) : null}
            </View>

            {/* Amount + Date */}
            <View style={styles.amountContainer}>
                <Text style={[styles.amount, { color: isCredit ? colors.successLight : colors.dangerLight }]}>
                    {isCredit ? '+' : '-'}{formatNumber(amount)}
                </Text>
                <Text style={styles.date}>{date}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '60',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    info: {
        flex: 1,
        marginRight: spacing.sm,
    },
    merchant: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    category: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        marginTop: 2,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    date: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        marginTop: 2,
    },
});

export default TransactionRow;
