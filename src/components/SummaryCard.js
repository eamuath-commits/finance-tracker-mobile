import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';

const SummaryCard = ({ label, value, icon, iconColor, prefix, isCount = false }) => {
    const displayColor = iconColor || colors.primary;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.label}>{label}</Text>
                <Ionicons name={icon} size={18} color={displayColor} />
            </View>
            <Text style={[styles.value, { color: displayColor }]}>
                {isCount ? value : `${prefix || ''}${formatNumber(value)} SAR`}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    label: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
    },
});

export default SummaryCard;
