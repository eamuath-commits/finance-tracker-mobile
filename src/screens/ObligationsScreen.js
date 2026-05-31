import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';
import { getObligationsMonthlyStatus, payObligation, createObligation, updateObligation, deleteObligation, getCategories } from '../services/api';
import ObligationCard from '../components/ObligationCard';
import FloatingActionButton from '../components/FloatingActionButton';
import FormModal, { FormField, formInputStyle, pickerContainerStyle, showCardActions } from '../components/FormModal';

const ObligationsScreen = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [monthOffset, setMonthOffset] = useState(0);
    const [categories, setCategories] = useState([]);

    // Form state
    const [showModal, setShowModal] = useState(false);
    const [editingObl, setEditingObl] = useState(null);
    const [oblForm, setOblForm] = useState({
        name: '', provider: '', due_day: '', category: '', notes: '',
    });

    const fetchData = useCallback(async () => {
        try {
            const [res, catRes] = await Promise.all([
                getObligationsMonthlyStatus(monthOffset),
                getCategories(),
            ]);
            setData(res.data);
            setCategories(catRes.data || []);
        } catch (err) {
            console.error('Obligations fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [monthOffset]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handlePay = (obligation) => {
        const amount = obligation.expected_amount || 0;
        Alert.alert(
            `Pay ${obligation.name}`,
            `Mark as paid for ${formatNumber(amount)} SAR?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Payment',
                    onPress: async () => {
                        try {
                            await payObligation(obligation.id, {
                                amount,
                                billing_month: data.month,
                                status: 'PAID',
                            });
                            fetchData();
                        } catch (err) {
                            console.error('Pay obligation error:', err);
                            Alert.alert('Error', 'Could not record payment');
                        }
                    },
                },
            ]
        );
    };

    // --- CRUD ---
    const openModal = (obl = null) => {
        if (obl) {
            setEditingObl(obl);
            setOblForm({
                name: obl.name || '', provider: obl.provider || '',
                due_day: String(obl.due_day || ''), category: obl.category || '',
                notes: obl.notes || '',
            });
        } else {
            setEditingObl(null);
            setOblForm({ name: '', provider: '', due_day: '', category: '', notes: '' });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!oblForm.name) return Alert.alert('Error', 'Name is required');
        try {
            const payload = {
                name: oblForm.name,
                provider: oblForm.provider,
                due_day: parseInt(oblForm.due_day) || 1,
                category: oblForm.category,
                notes: oblForm.notes,
            };
            if (editingObl) {
                await updateObligation(editingObl.id, payload);
            } else {
                await createObligation(payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            Alert.alert('Error', 'Could not save obligation');
        }
    };

    const handleDelete = async () => {
        if (!editingObl) return;
        try {
            await deleteObligation(editingObl.id);
            setShowModal(false);
            fetchData();
        } catch (err) {
            Alert.alert('Error', 'Could not delete obligation');
        }
    };

    const handleLongPress = (obl) => {
        showCardActions(obl.name, {
            onEdit: () => openModal(obl),
            onDelete: async () => {
                try { await deleteObligation(obl.id); fetchData(); }
                catch { Alert.alert('Error', 'Could not delete'); }
            },
            extraActions: [
                { label: 'Record Payment', onPress: () => handlePay(obl) },
            ],
        });
    };

    // Group obligations by category
    const groupedObligations = useMemo(() => {
        if (!data?.obligations) return [];
        const groups = {};
        data.obligations.forEach((obl) => {
            const cat = obl.category || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(obl);
        });
        return Object.entries(groups).map(([category, items]) => ({
            category,
            items,
            total: items.reduce((s, o) => s + (o.expected_amount || 0), 0),
            paidCount: items.filter((o) => o.status === 'PAID').length,
        }));
    }, [data]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Month Navigation */}
            <View style={styles.monthNav}>
                <TouchableOpacity
                    style={styles.monthButton}
                    onPress={() => setMonthOffset((p) => p - 1)}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textMuted} />
                </TouchableOpacity>
                <View style={styles.monthCenter}>
                    <Text style={styles.monthLabel}>{data?.month_label || 'Loading...'}</Text>
                    {monthOffset !== 0 && (
                        <TouchableOpacity onPress={() => setMonthOffset(0)}>
                            <Text style={styles.todayLink}>Go to Current</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.monthButton}
                    onPress={() => setMonthOffset((p) => p + 1)}
                >
                    <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Summary Cards */}
                {data && (
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Expected</Text>
                            <Text style={styles.summaryValue}>
                                {formatNumber(data.total_expected)} SAR
                            </Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Paid</Text>
                            <Text style={[styles.summaryValue, { color: colors.successLight }]}>
                                {formatNumber(data.total_paid)} SAR
                            </Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Remaining</Text>
                            <Text style={[styles.summaryValue, { color: data.remaining > 0 ? colors.dangerLight : colors.successLight }]}>
                                {formatNumber(data.remaining)} SAR
                            </Text>
                        </View>
                    </View>
                )}

                {/* Status pills */}
                {data && (
                    <View style={styles.statusRow}>
                        <View style={[styles.statusPill, { backgroundColor: colors.successBg }]}>
                            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                            <Text style={[styles.statusPillText, { color: colors.success }]}>
                                {data.paid_count} Paid
                            </Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: colors.surface }]}>
                            <Ionicons name="ellipse-outline" size={14} color={colors.textDim} />
                            <Text style={[styles.statusPillText, { color: colors.textDim }]}>
                                {data.unpaid_count} Unpaid
                            </Text>
                        </View>
                        {data.overdue_count > 0 && (
                            <View style={[styles.statusPill, { backgroundColor: colors.dangerBg }]}>
                                <Ionicons name="alert-circle" size={14} color={colors.danger} />
                                <Text style={[styles.statusPillText, { color: colors.danger }]}>
                                    {data.overdue_count} Overdue
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Grouped Obligations */}
                {groupedObligations.map((group) => (
                    <View key={group.category} style={styles.groupSection}>
                        <View style={styles.groupHeader}>
                            <Text style={styles.groupTitle}>{group.category}</Text>
                            <Text style={styles.groupSubtitle}>
                                {group.paidCount}/{group.items.length} · {formatNumber(group.total)} SAR
                            </Text>
                        </View>
                        {group.items.map((obl) => (
                            <ObligationCard
                                key={obl.id}
                                obligation={obl}
                                onPay={handlePay}
                                onLongPress={handleLongPress}
                            />
                        ))}
                    </View>
                ))}

                {(!data?.obligations || data.obligations.length === 0) && (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={48} color={colors.textDim} />
                        <Text style={styles.emptyText}>No obligations found</Text>
                    </View>
                )}

                <View style={{ height: spacing.xxxl * 3 }} />
            </ScrollView>

            {/* FAB */}
            <FloatingActionButton onPress={() => openModal()} />

            {/* Obligation Modal */}
            <FormModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                title={editingObl ? 'Edit Obligation' : 'New Obligation'}
                onSubmit={handleSave}
                submitLabel={editingObl ? 'Save' : 'Create'}
                onDelete={editingObl ? handleDelete : undefined}
            >
                <FormField label="Provider" hint="e.g. STC, Mobily">
                    <TextInput
                        style={formInputStyle}
                        value={oblForm.provider}
                        onChangeText={(t) => setOblForm((p) => ({ ...p, provider: t }))}
                        placeholder="Provider name"
                        placeholderTextColor={colors.textDim}
                    />
                </FormField>

                <FormField label="Name" required>
                    <TextInput
                        style={formInputStyle}
                        value={oblForm.name}
                        onChangeText={(t) => setOblForm((p) => ({ ...p, name: t }))}
                        placeholder="e.g. Internet, Phone"
                        placeholderTextColor={colors.textDim}
                    />
                </FormField>

                <FormField label="Due Day" required hint="Day of month (1-31)">
                    <TextInput
                        style={formInputStyle}
                        value={oblForm.due_day}
                        onChangeText={(t) => setOblForm((p) => ({ ...p, due_day: t }))}
                        placeholder="15"
                        placeholderTextColor={colors.textDim}
                        keyboardType="number-pad"
                    />
                </FormField>

                <FormField label="Category">
                    <View style={pickerContainerStyle}>
                        <Picker
                            selectedValue={oblForm.category}
                            onValueChange={(v) => setOblForm((p) => ({ ...p, category: v }))}
                            style={{ color: colors.text }}
                            dropdownIconColor={colors.textMuted}
                        >
                            <Picker.Item label="-- Select Category --" value="" color={colors.textDim} />
                            {categories.map((c) => (
                                <Picker.Item key={c.id} label={c.name} value={c.name} />
                            ))}
                        </Picker>
                    </View>
                </FormField>

                <FormField label="Notes">
                    <TextInput
                        style={[formInputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
                        value={oblForm.notes}
                        onChangeText={(t) => setOblForm((p) => ({ ...p, notes: t }))}
                        placeholder="Optional details"
                        placeholderTextColor={colors.textDim}
                        multiline
                    />
                </FormField>
            </FormModal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollArea: { flex: 1 },
    contentContainer: { padding: spacing.lg },
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: colors.background,
    },

    // Month nav
    monthNav: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: colors.background,
    },
    monthButton: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    monthCenter: { alignItems: 'center' },
    monthLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
    todayLink: { fontSize: fontSize.xs, color: colors.primary, marginTop: 2 },

    // Summary
    summaryRow: {
        flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg,
    },
    summaryCard: {
        flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md,
        padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    },
    summaryLabel: {
        fontSize: fontSize.xs, color: colors.textDim,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
    },
    summaryValue: {
        fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text,
    },

    // Status pills
    statusRow: {
        flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl,
    },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    statusPillText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

    // Group
    groupSection: { marginBottom: spacing.xxl },
    groupHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: spacing.md,
    },
    groupTitle: {
        fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textSecondary,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    groupSubtitle: { fontSize: fontSize.xs, color: colors.textDim },

    // Empty
    emptyState: { alignItems: 'center', padding: spacing.xxxl },
    emptyText: {
        color: colors.textDim, fontSize: fontSize.md, marginTop: spacing.sm, fontStyle: 'italic',
    },
});

export default ObligationsScreen;
