import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

const FormModal = ({ visible, onClose, title, children, onSubmit, submitLabel = 'Save', onDelete, deleteLabel = 'Delete' }) => {
    const handleDelete = () => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                        <Ionicons name="close" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    {onSubmit ? (
                        <TouchableOpacity onPress={onSubmit} style={styles.headerButton}>
                            <Text style={styles.submitText}>{submitLabel}</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerButton} />
                    )}
                </View>

                {/* Body */}
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={styles.bodyContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {children}

                    {/* Delete button at bottom */}
                    {onDelete && (
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                            <Text style={styles.deleteButtonText}>{deleteLabel}</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

/**
 * Reusable form field wrapper with label
 */
export const FormField = ({ label, required, children, hint }) => (
    <View style={styles.field}>
        <Text style={styles.fieldLabel}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
        </Text>
        {children}
        {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
);

/**
 * Segmented control for selecting between options
 */
export const SegmentedControl = ({ options, value, onChange }) => (
    <View style={styles.segmentedContainer}>
        {options.map((opt) => {
            const isActive = value === opt.value;
            return (
                <TouchableOpacity
                    key={opt.value}
                    style={[styles.segment, isActive && styles.segmentActive]}
                    onPress={() => onChange(opt.value)}
                >
                    {opt.icon && (
                        <Ionicons
                            name={opt.icon}
                            size={16}
                            color={isActive ? '#FFFFFF' : colors.textMuted}
                        />
                    )}
                    <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

/**
 * Computed/preview field with label and value
 */
export const ComputedField = ({ label, value, color, icon }) => (
    <View style={styles.computedField}>
        <View style={styles.computedHeader}>
            {icon && <Ionicons name={icon} size={14} color={colors.textDim} />}
            <Text style={styles.computedLabel}>{label}</Text>
        </View>
        <Text style={[styles.computedValue, color && { color }]}>{value}</Text>
    </View>
);

/**
 * Long-press action menu for cards
 */
export const showCardActions = (title, { onEdit, onDelete, extraActions = [] }) => {
    const buttons = [];

    if (onEdit) {
        buttons.push({ text: 'Edit', onPress: onEdit });
    }

    extraActions.forEach((action) => {
        buttons.push({ text: action.label, onPress: action.onPress });
    });

    if (onDelete) {
        buttons.push({
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
                Alert.alert(
                    'Confirm Delete',
                    `Are you sure you want to delete "${title}"?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: onDelete },
                    ]
                );
            },
        });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(title, undefined, buttons);
};

export const formInputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
};

export const pickerContainerStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    },
    headerButton: {
        minWidth: 60,
        alignItems: 'center',
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
        flex: 1,
        textAlign: 'center',
    },
    submitText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        padding: spacing.xl,
        paddingBottom: spacing.xxxl * 3,
    },
    field: {
        marginBottom: spacing.xl,
    },
    fieldLabel: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    required: {
        color: colors.danger,
    },
    fieldHint: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },

    // Delete
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        marginTop: spacing.xxl,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    deleteButtonText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.danger,
    },

    // Segmented Control
    segmentedContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    segment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.md,
    },
    segmentActive: {
        backgroundColor: colors.primary,
    },
    segmentText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.textMuted,
    },
    segmentTextActive: {
        color: '#FFFFFF',
    },

    // Computed Field
    computedField: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
    },
    computedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    computedLabel: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    computedValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
});

export default FormModal;
