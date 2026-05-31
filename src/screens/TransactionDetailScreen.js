import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';
import { getTransaction, updateTransaction, deleteTransaction, getAccounts, getCategories } from '../services/api';

const TransactionDetailScreen = ({ route, navigation }) => {
    const { transactionId, transaction: passedTx } = route.params || {};
    const [transaction, setTransaction] = useState(passedTx || null);
    const [loading, setLoading] = useState(!passedTx);
    const [editing, setEditing] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);

    // Edit form state
    const [editForm, setEditForm] = useState({});

    const fetchTransaction = useCallback(async () => {
        if (passedTx && !transactionId) return;
        try {
            setLoading(true);
            const res = await getTransaction(transactionId || passedTx?.id);
            setTransaction(res.data);
        } catch (err) {
            console.error('Failed to fetch transaction:', err);
            Alert.alert('Error', 'Could not load transaction details');
        } finally {
            setLoading(false);
        }
    }, [transactionId, passedTx]);

    useEffect(() => {
        fetchTransaction();
    }, [fetchTransaction]);

    // Load accounts and categories when entering edit mode
    const startEditing = async () => {
        setEditForm({
            merchant: transaction.merchant || '',
            amount: String(transaction.amount || ''),
            category: transaction.category || '',
            type: transaction.type || 'debit',
            notes: transaction.notes || '',
            fees: String(transaction.fees || '0'),
        });

        try {
            const [accRes, catRes] = await Promise.all([
                getAccounts().catch(() => ({ data: [] })),
                getCategories().catch(() => ({ data: [] })),
            ]);
            setAccounts(accRes.data);
            setCategories(catRes.data);
        } catch (_) { }

        setEditing(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                merchant: editForm.merchant || undefined,
                amount: parseFloat(editForm.amount) || transaction.amount,
                category: editForm.category || undefined,
                type: editForm.type,
                notes: editForm.notes || undefined,
                fees: parseFloat(editForm.fees) || 0,
            };
            await updateTransaction(transaction.id, payload);
            Alert.alert('Success', 'Transaction updated');
            setEditing(false);
            fetchTransaction();
        } catch (err) {
            console.error('Update failed:', err);
            Alert.alert('Error', 'Could not update transaction');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTransaction(transaction.id);
                            Alert.alert('Deleted', 'Transaction has been removed');
                            navigation.goBack();
                        } catch (err) {
                            console.error('Delete failed:', err);
                            Alert.alert('Error', 'Could not delete transaction');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!transaction) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.textDim} />
                <Text style={styles.errorText}>Transaction not found</Text>
            </View>
        );
    }

    const isCredit = transaction.type === 'credit';
    const merchantName = transaction.merchant || 'Unknown';
    const dateStr = transaction.timestamp
        ? new Date(transaction.timestamp).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : 'Unknown date';
    const timeStr = transaction.timestamp
        ? new Date(transaction.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        })
        : '';

    if (editing) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.editHeader}>
                    <Text style={styles.editTitle}>Edit Transaction</Text>
                </View>

                {/* Merchant */}
                <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Merchant</Text>
                    <TextInput
                        style={styles.textInput}
                        value={editForm.merchant}
                        onChangeText={(t) => setEditForm((p) => ({ ...p, merchant: t }))}
                        placeholder="Merchant name"
                        placeholderTextColor={colors.textDim}
                    />
                </View>

                {/* Amount */}
                <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Amount (SAR)</Text>
                    <TextInput
                        style={styles.textInput}
                        value={editForm.amount}
                        onChangeText={(t) => setEditForm((p) => ({ ...p, amount: t }))}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={colors.textDim}
                    />
                </View>

                {/* Type Toggle */}
                <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Type</Text>
                    <View style={styles.typeToggle}>
                        {['debit', 'credit'].map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.typeButton, editForm.type === t && styles.typeButtonActive]}
                                onPress={() => setEditForm((p) => ({ ...p, type: t }))}
                            >
                                <Ionicons
                                    name={t === 'debit' ? 'arrow-up' : 'arrow-down'}
                                    size={16}
                                    color={editForm.type === t ? '#FFFFFF' : colors.textMuted}
                                />
                                <Text style={[styles.typeText, editForm.type === t && styles.typeTextActive]}>
                                    {t === 'debit' ? 'Expense' : 'Income'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Category */}
                <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Category</Text>
                    <TextInput
                        style={styles.textInput}
                        value={editForm.category}
                        onChangeText={(t) => setEditForm((p) => ({ ...p, category: t }))}
                        placeholder="Category"
                        placeholderTextColor={colors.textDim}
                    />
                    {categories.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {categories.slice(0, 10).map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.catChip, editForm.category === cat.name && styles.catChipActive]}
                                    onPress={() => setEditForm((p) => ({ ...p, category: cat.name }))}
                                >
                                    <Text style={[styles.catChipText, editForm.category === cat.name && styles.catChipTextActive]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Notes */}
                <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Notes</Text>
                    <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={editForm.notes}
                        onChangeText={(t) => setEditForm((p) => ({ ...p, notes: t }))}
                        placeholder="Optional notes..."
                        placeholderTextColor={colors.textDim}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Fees */}
                <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Fees (SAR)</Text>
                    <TextInput
                        style={styles.textInput}
                        value={editForm.fees}
                        onChangeText={(t) => setEditForm((p) => ({ ...p, fees: t }))}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={colors.textDim}
                    />
                </View>

                {/* Actions */}
                <View style={styles.editActions}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        <Text style={styles.saveText}>Save Changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Hero Amount */}
            <View style={styles.heroSection}>
                <View style={[styles.heroIcon, { backgroundColor: isCredit ? colors.successBg : colors.dangerBg }]}>
                    <Ionicons
                        name={isCredit ? 'arrow-down' : 'arrow-up'}
                        size={32}
                        color={isCredit ? colors.success : colors.danger}
                    />
                </View>
                <Text style={[styles.heroAmount, { color: isCredit ? colors.successLight : colors.dangerLight }]}>
                    {isCredit ? '+' : '-'}{formatNumber(transaction.amount || 0)} SAR
                </Text>
                <Text style={styles.heroMerchant}>{merchantName}</Text>
                <Text style={styles.heroDate}>{dateStr} · {timeStr}</Text>
            </View>

            {/* Details Card */}
            <View style={styles.detailCard}>
                <DetailRow label="Category" value={transaction.category || '—'} icon="pricetag-outline" />
                <DetailRow label="Type" value={isCredit ? 'Income / Credit' : 'Expense / Debit'} icon={isCredit ? 'arrow-down' : 'arrow-up'} />
                <DetailRow label="Status" value={transaction.status || 'completed'} icon="checkmark-circle-outline" />
                {transaction.balance_after_transaction != null && (
                    <DetailRow label="Balance After" value={`${formatNumber(transaction.balance_after_transaction)} SAR`} icon="wallet-outline" />
                )}
                {transaction.fees > 0 && (
                    <DetailRow label="Fees" value={`${formatNumber(transaction.fees)} SAR`} icon="cash-outline" />
                )}
                {transaction.original_currency && transaction.original_currency !== 'SAR' && (
                    <DetailRow
                        label="Original Amount"
                        value={`${formatNumber(transaction.original_amount)} ${transaction.original_currency}`}
                        icon="globe-outline"
                    />
                )}
                {transaction.notes && (
                    <DetailRow label="Notes" value={transaction.notes} icon="document-text-outline" />
                )}
                {transaction.source && (
                    <DetailRow label="Source" value={transaction.source} icon="phone-portrait-outline" />
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.editButton} onPress={startEditing}>
                    <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: spacing.xxxl * 2 }} />
        </ScrollView>
    );
};

const DetailRow = ({ label, value, icon }) => (
    <View style={styles.detailRow}>
        <Ionicons name={icon} size={18} color={colors.textDim} style={styles.detailIcon} />
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={3}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { padding: spacing.lg },
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: colors.background, padding: spacing.xxl,
    },
    errorText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.lg, textAlign: 'center' },

    // Hero
    heroSection: { alignItems: 'center', paddingVertical: spacing.xxxl },
    heroIcon: {
        width: 64, height: 64, borderRadius: 32,
        alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
    },
    heroAmount: { fontSize: 36, fontWeight: fontWeight.extrabold },
    heroMerchant: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.sm },
    heroDate: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },

    // Detail Card
    detailCard: {
        backgroundColor: colors.surface, borderRadius: borderRadius.lg,
        borderWidth: 1, borderColor: colors.border, padding: spacing.lg,
    },
    detailRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.border + '60',
    },
    detailIcon: { marginRight: spacing.md, width: 20 },
    detailLabel: { fontSize: fontSize.sm, color: colors.textDim, width: 110 },
    detailValue: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text, flex: 1, textAlign: 'right' },

    // Actions
    actionRow: {
        flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl,
    },
    editButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.sm, backgroundColor: colors.primary + '15',
        paddingVertical: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary + '30',
    },
    editButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
    deleteButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.sm, backgroundColor: colors.dangerBg,
        paddingVertical: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.danger + '30',
    },
    deleteButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.danger },

    // Edit Mode
    editHeader: { marginBottom: spacing.xxl },
    editTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
    formField: { marginBottom: spacing.xl },
    fieldLabel: {
        fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary,
        marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    textInput: {
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
        borderRadius: borderRadius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        color: colors.text, fontSize: fontSize.md,
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    typeToggle: { flexDirection: 'row', gap: spacing.md },
    typeButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
        backgroundColor: colors.surface, paddingVertical: spacing.md, borderRadius: borderRadius.sm,
        borderWidth: 1, borderColor: colors.border,
    },
    typeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textMuted },
    typeTextActive: { color: '#FFFFFF' },
    chipScroll: { marginTop: spacing.sm },
    catChip: {
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
        borderRadius: borderRadius.full, backgroundColor: colors.surfaceLight, marginRight: spacing.sm,
    },
    catChipActive: { backgroundColor: colors.primary },
    catChipText: { fontSize: fontSize.sm, color: colors.textMuted },
    catChipTextActive: { color: '#FFFFFF' },
    editActions: { marginTop: spacing.xxl, gap: spacing.md },
    saveButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
        backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.md,
    },
    saveText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#FFFFFF' },
    cancelButton: {
        alignItems: 'center', paddingVertical: spacing.lg,
    },
    cancelText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textMuted },
});

export default TransactionDetailScreen;
