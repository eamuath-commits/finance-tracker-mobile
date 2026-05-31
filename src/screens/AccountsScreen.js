import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';
import { getAccounts, getCreditCards, createAccount, updateAccount, deleteAccount, createCreditCard, updateCreditCard, deleteCreditCard } from '../services/api';
import AccountCard from '../components/AccountCard';
import FloatingActionButton from '../components/FloatingActionButton';
import FormModal, { FormField, SegmentedControl, formInputStyle, showCardActions } from '../components/FormModal';

const AccountsScreen = ({ navigation }) => {
    const [accounts, setAccounts] = useState([]);
    const [creditCards, setCreditCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Account form state
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [accountForm, setAccountForm] = useState({
        name: '', account_type: 'Checking', last_4_digits: '', current_balance: '',
        bank_name: '', credit_limit: '', is_income: false, notes: '',
    });

    // Credit card form state
    const [showCCModal, setShowCCModal] = useState(false);
    const [editingCC, setEditingCC] = useState(null);
    const [ccForm, setCCForm] = useState({
        name: '', bank_name: '', last_4_digits: '', credit_limit: '',
        current_balance: '', statement_day: '', due_day: '', apr: '',
    });

    const fetchData = useCallback(async () => {
        try {
            const [accRes, ccRes] = await Promise.all([
                getAccounts(),
                getCreditCards(),
            ]);
            setAccounts(accRes.data);
            setCreditCards(ccRes.data);
        } catch (err) {
            console.error('Accounts fetch error:', err);
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

    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    }, [accounts]);

    const totalCreditUsed = useMemo(() => {
        return creditCards.reduce((sum, cc) => sum + (cc.current_balance || 0), 0);
    }, [creditCards]);

    const totalCreditLimit = useMemo(() => {
        return creditCards.reduce((sum, cc) => sum + (cc.credit_limit || 0), 0);
    }, [creditCards]);

    // --- Account CRUD ---
    const openAccountModal = (acc = null) => {
        if (acc) {
            setEditingAccount(acc);
            setAccountForm({
                name: acc.name || '', account_type: acc.account_type || 'Checking',
                last_4_digits: acc.last_4_digits || '', current_balance: String(acc.current_balance || ''),
                bank_name: acc.bank_name || '', credit_limit: String(acc.credit_limit || ''),
                is_income: acc.is_income || false, notes: acc.notes || '',
            });
        } else {
            setEditingAccount(null);
            setAccountForm({ name: '', account_type: 'Checking', last_4_digits: '', current_balance: '', bank_name: '', credit_limit: '', is_income: false, notes: '' });
        }
        setShowAccountModal(true);
    };

    const handleSaveAccount = async () => {
        if (!accountForm.name) return Alert.alert('Error', 'Account name is required');
        try {
            const payload = {
                ...accountForm,
                current_balance: parseFloat(accountForm.current_balance) || 0,
                credit_limit: accountForm.account_type === 'Credit Card' ? (parseFloat(accountForm.credit_limit) || null) : null,
            };
            if (editingAccount) {
                await updateAccount(editingAccount.id, payload);
            } else {
                await createAccount(payload);
            }
            setShowAccountModal(false);
            fetchData();
        } catch (err) {
            console.error('Save account error:', err);
            Alert.alert('Error', 'Could not save account');
        }
    };

    const handleDeleteAccount = async () => {
        if (!editingAccount) return;
        try {
            await deleteAccount(editingAccount.id);
            setShowAccountModal(false);
            fetchData();
        } catch (err) {
            Alert.alert('Error', 'Could not delete account');
        }
    };

    // --- Credit Card CRUD ---
    const openCCModal = (cc = null) => {
        if (cc) {
            setEditingCC(cc);
            setCCForm({
                name: cc.name || '', bank_name: cc.bank_name || '',
                last_4_digits: cc.last_4_digits || '', credit_limit: String(cc.credit_limit || ''),
                current_balance: String(cc.current_balance || ''), statement_day: String(cc.statement_day || ''),
                due_day: String(cc.due_day || ''), apr: String(cc.apr || ''),
            });
        } else {
            setEditingCC(null);
            setCCForm({ name: '', bank_name: '', last_4_digits: '', credit_limit: '', current_balance: '', statement_day: '', due_day: '', apr: '' });
        }
        setShowCCModal(true);
    };

    const handleSaveCC = async () => {
        if (!ccForm.name) return Alert.alert('Error', 'Card name is required');
        try {
            const payload = {
                ...ccForm,
                credit_limit: parseFloat(ccForm.credit_limit) || 0,
                current_balance: parseFloat(ccForm.current_balance) || 0,
                statement_day: parseInt(ccForm.statement_day) || null,
                due_day: parseInt(ccForm.due_day) || null,
                apr: parseFloat(ccForm.apr) || null,
            };
            if (editingCC) {
                await updateCreditCard(editingCC.id, payload);
            } else {
                await createCreditCard(payload);
            }
            setShowCCModal(false);
            fetchData();
        } catch (err) {
            Alert.alert('Error', 'Could not save credit card');
        }
    };

    const handleDeleteCC = async () => {
        if (!editingCC) return;
        try {
            await deleteCreditCard(editingCC.id);
            setShowCCModal(false);
            fetchData();
        } catch (err) {
            Alert.alert('Error', 'Could not delete credit card');
        }
    };

    const handleAccountPress = (account) => {
        navigation.navigate('Transactions', { accountId: account.id });
    };

    const handleAccountLongPress = (account) => {
        showCardActions(account.name, {
            onEdit: () => openAccountModal(account),
            onDelete: async () => {
                try { await deleteAccount(account.id); fetchData(); }
                catch { Alert.alert('Error', 'Could not delete account'); }
            },
        });
    };

    const handleCreditCardPress = (cc) => {
        navigation.navigate('CreditCardDetail', { cardId: cc.id, card: cc });
    };

    const handleCreditCardLongPress = (cc) => {
        showCardActions(cc.name || 'Credit Card', {
            onEdit: () => openCCModal(cc),
            onDelete: async () => {
                try { await deleteCreditCard(cc.id); fetchData(); }
                catch { Alert.alert('Error', 'Could not delete card'); }
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
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                />
            }
        >
            {/* — Total Balance Summary — */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Balance</Text>
                        <Text style={styles.summaryValue}>{formatNumber(totalBalance)} SAR</Text>
                    </View>
                </View>
                {creditCards.length > 0 && (
                    <View style={[styles.summaryRow, { marginTop: spacing.md }]}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Credit Used</Text>
                            <Text style={[styles.summaryValueSm, { color: colors.dangerLight }]}>
                                {formatNumber(totalCreditUsed)} SAR
                            </Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Credit Limit</Text>
                            <Text style={styles.summaryValueSm}>
                                {formatNumber(totalCreditLimit)} SAR
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* — Bank Accounts — */}
            <Text style={styles.sectionLabel}>Bank Accounts</Text>
            {accounts.length > 0 ? (
                accounts.map((acc) => (
                    <AccountCard
                        key={acc.id}
                        account={acc}
                        onPress={handleAccountPress}
                        onLongPress={handleAccountLongPress}
                    />
                ))
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="wallet-outline" size={32} color={colors.textDim} />
                    <Text style={styles.emptyText}>No accounts added yet</Text>
                </View>
            )}

            {/* — Credit Cards — */}
            {creditCards.length > 0 && (
                <>
                    <Text style={[styles.sectionLabel, { marginTop: spacing.xxl }]}>
                        Credit Cards
                    </Text>
                    {creditCards.map((cc) => (
                        <TouchableOpacity
                            key={cc.id}
                            style={styles.creditCard}
                            activeOpacity={0.7}
                            onPress={() => handleCreditCardPress(cc)}
                            onLongPress={() => handleCreditCardLongPress(cc)}
                        >
                            <View style={[styles.ccAccent, { backgroundColor: colors.warning }]} />
                            <View style={styles.ccContent}>
                                <View style={styles.ccHeader}>
                                    <View style={styles.ccIconContainer}>
                                        <Ionicons name="card-outline" size={20} color={colors.warning} />
                                    </View>
                                    <View style={styles.ccTitleArea}>
                                        <Text style={styles.ccName} numberOfLines={1}>
                                            {cc.name || `${cc.bank_name} Card`}
                                        </Text>
                                        {cc.bank_name && (
                                            <Text style={styles.ccBank}>{cc.bank_name}</Text>
                                        )}
                                    </View>
                                    <Text style={styles.ccDigits}>
                                        •••• {cc.last_4_digits || '????'}
                                    </Text>
                                </View>

                                <View style={styles.ccBalanceRow}>
                                    <View>
                                        <Text style={styles.ccBalanceLabel}>Balance</Text>
                                        <Text style={[styles.ccBalance, { color: colors.dangerLight }]}>
                                            {formatNumber(cc.current_balance || 0)} SAR
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.ccBalanceLabel}>Limit</Text>
                                        <Text style={styles.ccBalance}>
                                            {formatNumber(cc.credit_limit || 0)} SAR
                                        </Text>
                                    </View>
                                </View>

                                {/* Usage bar */}
                                {cc.credit_limit > 0 && (
                                    <View style={styles.usageBarContainer}>
                                        <View style={styles.usageBarBg}>
                                            <View
                                                style={[
                                                    styles.usageBarFill,
                                                    {
                                                        width: `${Math.min(
                                                            ((cc.current_balance || 0) / cc.credit_limit) * 100,
                                                            100
                                                        )}%`,
                                                        backgroundColor:
                                                            (cc.current_balance || 0) / cc.credit_limit > 0.8
                                                                ? colors.danger
                                                                : colors.warning,
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.usageText}>
                                            {Math.round(
                                                ((cc.current_balance || 0) / cc.credit_limit) * 100
                                            )}
                                            % used
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </>
            )}

            <View style={{ height: spacing.xxxl * 3 }} />
        </ScrollView>

        {/* FAB */}
        <FloatingActionButton
            onPress={() => {
                Alert.alert('Add New', 'What would you like to add?', [
                    { text: 'Bank Account', onPress: () => openAccountModal() },
                    { text: 'Credit Card', onPress: () => openCCModal() },
                    { text: 'Cancel', style: 'cancel' },
                ]);
            }}
        />

        {/* Account Modal */}
        <FormModal
            visible={showAccountModal}
            onClose={() => setShowAccountModal(false)}
            title={editingAccount ? 'Edit Account' : 'New Account'}
            onSubmit={handleSaveAccount}
            submitLabel={editingAccount ? 'Save' : 'Create'}
            onDelete={editingAccount ? handleDeleteAccount : undefined}
        >
            <FormField label="Account Name" required>
                <TextInput
                    style={formInputStyle}
                    value={accountForm.name}
                    onChangeText={(t) => setAccountForm((p) => ({ ...p, name: t }))}
                    placeholder="e.g. Main Checking"
                    placeholderTextColor={colors.textDim}
                />
            </FormField>

            <FormField label="Account Type">
                <SegmentedControl
                    options={[
                        { value: 'Checking', label: 'Checking', icon: 'wallet-outline' },
                        { value: 'Savings', label: 'Savings', icon: 'cash-outline' },
                    ]}
                    value={accountForm.account_type}
                    onChange={(v) => setAccountForm((p) => ({ ...p, account_type: v }))}
                />
            </FormField>

            <FormField label="Bank Name">
                <TextInput
                    style={formInputStyle}
                    value={accountForm.bank_name}
                    onChangeText={(t) => setAccountForm((p) => ({ ...p, bank_name: t }))}
                    placeholder="e.g. Al Rajhi Bank"
                    placeholderTextColor={colors.textDim}
                />
            </FormField>

            <FormField label="Last 4 Digits">
                <TextInput
                    style={formInputStyle}
                    value={accountForm.last_4_digits}
                    onChangeText={(t) => setAccountForm((p) => ({ ...p, last_4_digits: t.slice(0, 4) }))}
                    placeholder="1234"
                    placeholderTextColor={colors.textDim}
                    keyboardType="number-pad"
                    maxLength={4}
                />
            </FormField>

            <FormField label="Current Balance (SAR)">
                <TextInput
                    style={formInputStyle}
                    value={accountForm.current_balance}
                    onChangeText={(t) => setAccountForm((p) => ({ ...p, current_balance: t }))}
                    placeholder="0.00"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                />
            </FormField>

            <FormField label="Notes">
                <TextInput
                    style={[formInputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
                    value={accountForm.notes}
                    onChangeText={(t) => setAccountForm((p) => ({ ...p, notes: t }))}
                    placeholder="Optional notes"
                    placeholderTextColor={colors.textDim}
                    multiline
                />
            </FormField>
        </FormModal>

        {/* Credit Card Modal */}
        <FormModal
            visible={showCCModal}
            onClose={() => setShowCCModal(false)}
            title={editingCC ? 'Edit Credit Card' : 'New Credit Card'}
            onSubmit={handleSaveCC}
            submitLabel={editingCC ? 'Save' : 'Create'}
            onDelete={editingCC ? handleDeleteCC : undefined}
        >
            <FormField label="Card Name" required>
                <TextInput
                    style={formInputStyle}
                    value={ccForm.name}
                    onChangeText={(t) => setCCForm((p) => ({ ...p, name: t }))}
                    placeholder="e.g. Visa Platinum"
                    placeholderTextColor={colors.textDim}
                />
            </FormField>

            <FormField label="Bank Name">
                <TextInput
                    style={formInputStyle}
                    value={ccForm.bank_name}
                    onChangeText={(t) => setCCForm((p) => ({ ...p, bank_name: t }))}
                    placeholder="e.g. Al Rajhi Bank"
                    placeholderTextColor={colors.textDim}
                />
            </FormField>

            <FormField label="Last 4 Digits">
                <TextInput
                    style={formInputStyle}
                    value={ccForm.last_4_digits}
                    onChangeText={(t) => setCCForm((p) => ({ ...p, last_4_digits: t.slice(0, 4) }))}
                    placeholder="1234"
                    placeholderTextColor={colors.textDim}
                    keyboardType="number-pad"
                    maxLength={4}
                />
            </FormField>

            <FormField label="Credit Limit (SAR)" required>
                <TextInput
                    style={formInputStyle}
                    value={ccForm.credit_limit}
                    onChangeText={(t) => setCCForm((p) => ({ ...p, credit_limit: t }))}
                    placeholder="50000"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                />
            </FormField>

            <FormField label="Current Balance (SAR)">
                <TextInput
                    style={formInputStyle}
                    value={ccForm.current_balance}
                    onChangeText={(t) => setCCForm((p) => ({ ...p, current_balance: t }))}
                    placeholder="0.00"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                />
            </FormField>

            <FormField label="Statement Day" hint="Day of month (1-31)">
                <TextInput
                    style={formInputStyle}
                    value={ccForm.statement_day}
                    onChangeText={(t) => setCCForm((p) => ({ ...p, statement_day: t }))}
                    placeholder="25"
                    placeholderTextColor={colors.textDim}
                    keyboardType="number-pad"
                />
            </FormField>

            <FormField label="Due Day" hint="Day of month (1-31)">
                <TextInput
                    style={formInputStyle}
                    value={ccForm.due_day}
                    onChangeText={(t) => setCCForm((p) => ({ ...p, due_day: t }))}
                    placeholder="15"
                    placeholderTextColor={colors.textDim}
                    keyboardType="number-pad"
                />
            </FormField>

            <FormField label="APR (%)">
                <TextInput
                    style={formInputStyle}
                    value={ccForm.apr}
                    onChangeText={(t) => setCCForm((p) => ({ ...p, apr: t }))}
                    placeholder="24.99"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                />
            </FormField>
        </FormModal>
    </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        padding: spacing.lg,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },

    // Summary
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xxl,
    },
    summaryRow: {
        flexDirection: 'row',
    },
    summaryItem: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    summaryValue: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.extrabold,
        color: colors.text,
    },
    summaryValueSm: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },

    // Section
    sectionLabel: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxxl,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyText: {
        color: colors.textDim,
        fontSize: fontSize.md,
        marginTop: spacing.sm,
        fontStyle: 'italic',
    },

    // Credit Cards
    creditCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    ccAccent: {
        width: 4,
    },
    ccContent: {
        flex: 1,
        padding: spacing.lg,
    },
    ccHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    ccIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.warning + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    ccTitleArea: {
        flex: 1,
    },
    ccName: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    ccBank: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    ccDigits: {
        fontSize: fontSize.sm,
        color: colors.textDim,
        fontFamily: 'monospace',
        letterSpacing: 2,
    },
    ccBalanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    ccBalanceLabel: {
        fontSize: fontSize.xs,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    ccBalance: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    usageBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    usageBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: colors.surfaceLight,
        borderRadius: 3,
        overflow: 'hidden',
    },
    usageBarFill: {
        height: 6,
        borderRadius: 3,
    },
    usageText: {
        fontSize: fontSize.xs,
        color: colors.textDim,
    },
});

export default AccountsScreen;
