import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';
import { getLoans, createLoan, updateLoan, deleteLoan } from '../services/api';
import LoanCard from '../components/LoanCard';
import FloatingActionButton from '../components/FloatingActionButton';
import FormModal, { FormField, ComputedField, formInputStyle, showCardActions } from '../components/FormModal';

const LoansScreen = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Form state
    const [showModal, setShowModal] = useState(false);
    const [editingLoan, setEditingLoan] = useState(null);
    const [loanForm, setLoanForm] = useState({
        name: '', principal_amount: '', interest_rate: '', term_months: '',
        monthly_payment: '', start_date: '', due_day: '', notes: '',
    });

    const fetchData = useCallback(async () => {
        try {
            const res = await getLoans();
            setLoans(res.data);
        } catch (err) {
            console.error('Loans fetch error:', err);
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

    const totals = useMemo(() => {
        const totalRemaining = loans.reduce((s, l) => s + (l.remaining_balance || 0), 0);
        const totalPrincipal = loans.reduce((s, l) => s + (l.principal_amount || 0), 0);
        const totalMonthly = loans.reduce((s, l) => s + (l.monthly_payment || 0), 0);
        return { totalRemaining, totalPrincipal, totalMonthly };
    }, [loans]);

    // Auto-calc monthly payment (flat rate formula from web)
    const autoPayment = useMemo(() => {
        const P = parseFloat(loanForm.principal_amount) || 0;
        const R = (parseFloat(loanForm.interest_rate) || 0) / 100;
        const N = parseFloat(loanForm.term_months) || 0;
        if (P > 0 && N > 0) {
            return (P + (P * R * (N / 12))) / N;
        }
        return 0;
    }, [loanForm.principal_amount, loanForm.interest_rate, loanForm.term_months]);

    // --- CRUD ---
    const openModal = (loan = null) => {
        if (loan) {
            setEditingLoan(loan);
            setLoanForm({
                name: loan.name || '', principal_amount: String(loan.principal_amount || ''),
                interest_rate: String(loan.interest_rate || ''), term_months: String(loan.term_months || ''),
                monthly_payment: String(loan.monthly_payment || ''),
                start_date: loan.start_date ? new Date(loan.start_date).toISOString().split('T')[0] : '',
                due_day: String(loan.due_day || ''), notes: loan.notes || '',
            });
        } else {
            setEditingLoan(null);
            setLoanForm({ name: '', principal_amount: '', interest_rate: '', term_months: '', monthly_payment: '', start_date: '', due_day: '', notes: '' });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!loanForm.name || !loanForm.principal_amount) return Alert.alert('Error', 'Name and principal are required');
        try {
            const payload = {
                name: loanForm.name,
                principal_amount: parseFloat(loanForm.principal_amount),
                interest_rate: parseFloat(loanForm.interest_rate) || 0,
                term_months: parseInt(loanForm.term_months) || 60,
                monthly_payment: loanForm.monthly_payment ? parseFloat(loanForm.monthly_payment) : null,
                start_date: loanForm.start_date || null,
                due_day: loanForm.due_day ? parseInt(loanForm.due_day) : null,
                notes: loanForm.notes,
            };
            if (editingLoan) {
                await updateLoan(editingLoan.id, payload);
            } else {
                await createLoan(payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            Alert.alert('Error', 'Could not save loan');
        }
    };

    const handleDeleteLoan = async () => {
        if (!editingLoan) return;
        try {
            await deleteLoan(editingLoan.id);
            setShowModal(false);
            fetchData();
        } catch (err) {
            Alert.alert('Error', 'Could not delete loan');
        }
    };

    const handleLongPress = (loan) => {
        showCardActions(loan.name, {
            onEdit: () => openModal(loan),
            onDelete: async () => {
                try { await deleteLoan(loan.id); fetchData(); }
                catch { Alert.alert('Error', 'Could not delete loan'); }
            },
        });
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
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
        >
            {/* Summary */}
            {loans.length > 0 && (
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Remaining</Text>
                            <Text style={[styles.summaryValue, { color: colors.dangerLight }]}>
                                {formatNumber(totals.totalRemaining)} SAR
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Monthly Payments</Text>
                            <Text style={styles.summaryValue}>
                                {formatNumber(totals.totalMonthly)} SAR
                            </Text>
                        </View>
                    </View>
                    {/* Overall progress */}
                    <View style={styles.overallProgress}>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${totals.totalPrincipal > 0
                                            ? Math.max(0, Math.min(100, ((totals.totalPrincipal - totals.totalRemaining) / totals.totalPrincipal) * 100))
                                            : 0
                                            }%`,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {totals.totalPrincipal > 0
                                ? `${Math.round(((totals.totalPrincipal - totals.totalRemaining) / totals.totalPrincipal) * 100)}% paid overall`
                                : '0% paid'}
                        </Text>
                    </View>
                </View>
            )}

            {/* Loans List */}
            <Text style={styles.sectionLabel}>Active Loans</Text>
            {loans.length > 0 ? (
                loans.map((loan) => <LoanCard key={loan.id} loan={loan} onLongPress={handleLongPress} />)
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="trending-down-outline" size={48} color={colors.textDim} />
                    <Text style={styles.emptyText}>No loans found</Text>
                </View>
            )}

            <View style={{ height: spacing.xxxl * 3 }} />
        </ScrollView>

        {/* FAB */}
        <FloatingActionButton onPress={() => openModal()} />

        {/* Loan Modal */}
        <FormModal
            visible={showModal}
            onClose={() => setShowModal(false)}
            title={editingLoan ? 'Edit Loan' : 'New Loan'}
            onSubmit={handleSave}
            submitLabel={editingLoan ? 'Save' : 'Create'}
            onDelete={editingLoan ? handleDeleteLoan : undefined}
        >
            <FormField label="Loan Name" required>
                <TextInput
                    style={formInputStyle}
                    value={loanForm.name}
                    onChangeText={(t) => setLoanForm((p) => ({ ...p, name: t }))}
                    placeholder="e.g. Home Loan"
                    placeholderTextColor={colors.textDim}
                />
            </FormField>

            <FormField label="Principal Amount (SAR)" required>
                <TextInput
                    style={formInputStyle}
                    value={loanForm.principal_amount}
                    onChangeText={(t) => setLoanForm((p) => ({ ...p, principal_amount: t }))}
                    placeholder="500000"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                />
            </FormField>

            <FormField label="Interest Rate (%)" hint="Flat rate per year">
                <TextInput
                    style={formInputStyle}
                    value={loanForm.interest_rate}
                    onChangeText={(t) => setLoanForm((p) => ({ ...p, interest_rate: t }))}
                    placeholder="3.1"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                />
            </FormField>

            <FormField label="Term (Months)">
                <TextInput
                    style={formInputStyle}
                    value={loanForm.term_months}
                    onChangeText={(t) => setLoanForm((p) => ({ ...p, term_months: t }))}
                    placeholder="60"
                    placeholderTextColor={colors.textDim}
                    keyboardType="number-pad"
                />
            </FormField>

            {/* Auto-calc preview */}
            {autoPayment > 0 && (
                <ComputedField
                    label="Estimated Monthly Payment"
                    value={`${formatNumber(autoPayment)} SAR`}
                    color={colors.successLight}
                    icon="calculator-outline"
                />
            )}

            <FormField label="Monthly Payment (SAR)" hint="Leave empty to use auto-calculated amount">
                <TextInput
                    style={formInputStyle}
                    value={loanForm.monthly_payment}
                    onChangeText={(t) => setLoanForm((p) => ({ ...p, monthly_payment: t }))}
                    placeholder={autoPayment > 0 ? `Auto: ${formatNumber(autoPayment)}` : 'Enter monthly payment'}
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                />
            </FormField>

            <FormField label="Start Date">
                <TextInput
                    style={formInputStyle}
                    value={loanForm.start_date}
                    onChangeText={(t) => setLoanForm((p) => ({ ...p, start_date: t }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textDim}
                />
            </FormField>

            <FormField label="Due Day" hint="Day of month (1-31)">
                <TextInput
                    style={formInputStyle}
                    value={loanForm.due_day}
                    onChangeText={(t) => setLoanForm((p) => ({ ...p, due_day: t }))}
                    placeholder="27"
                    placeholderTextColor={colors.textDim}
                    keyboardType="number-pad"
                />
            </FormField>

            <FormField label="Notes">
                <TextInput
                    style={[formInputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
                    value={loanForm.notes}
                    onChangeText={(t) => setLoanForm((p) => ({ ...p, notes: t }))}
                    placeholder="Loan details, bank info..."
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
    contentContainer: { padding: spacing.lg },
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background,
    },

    // Summary
    summaryCard: {
        backgroundColor: colors.surface, borderRadius: borderRadius.lg,
        padding: spacing.xl, borderWidth: 1, borderColor: colors.border,
        marginBottom: spacing.xxl,
    },
    summaryRow: { flexDirection: 'row', marginBottom: spacing.lg },
    summaryItem: { flex: 1 },
    summaryLabel: {
        fontSize: fontSize.xs, color: colors.textDim,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs,
    },
    summaryValue: {
        fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text,
    },
    overallProgress: {},
    progressBar: {
        height: 8, backgroundColor: colors.surfaceLight,
        borderRadius: 4, overflow: 'hidden', marginBottom: spacing.xs,
    },
    progressFill: {
        height: 8, borderRadius: 4, backgroundColor: colors.success,
    },
    progressText: { fontSize: fontSize.xs, color: colors.textDim, textAlign: 'right' },

    // Section
    sectionLabel: {
        fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textDim,
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md,
    },

    // Empty
    emptyState: {
        alignItems: 'center', padding: spacing.xxxl,
        backgroundColor: colors.surface, borderRadius: borderRadius.lg,
        borderWidth: 1, borderColor: colors.border,
    },
    emptyText: {
        color: colors.textDim, fontSize: fontSize.md, marginTop: spacing.sm, fontStyle: 'italic',
    },
});

export default LoansScreen;
