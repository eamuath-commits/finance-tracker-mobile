import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';
import {
    getRules, addRule, updateRule, deleteRule,
    isCaptureEnabled, setCaptureEnabled,
    matchesRule, getActivityLog, clearActivityLog,
} from '../services/smsRules';
import {
    checkSMSPermission, requestSMSPermission,
    startSMSListener, stopSMSListener, isListening, testSMS,
} from '../services/smsService';
import FormModal, { FormField, SegmentedControl, formInputStyle, showCardActions } from '../components/FormModal';
import FloatingActionButton from '../components/FloatingActionButton';

const SMSCaptureScreen = () => {
    const [captureEnabled, setCaptureEnabledState] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('checking');
    const [rules, setRules] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'log'

    // Rule form state
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [ruleForm, setRuleForm] = useState({
        name: '',
        enabled: true,
        senders: '',
        contentFilters: [{ type: 'text', value: '' }],
    });

    // Test SMS state
    const [showTestModal, setShowTestModal] = useState(false);
    const [testSender, setTestSender] = useState('');
    const [testBody, setTestBody] = useState('');
    const [testResult, setTestResult] = useState(null);

    const isAndroid = Platform.OS === 'android';

    // --- Data Loading ---
    const loadData = useCallback(async () => {
        const [rulesData, enabled, log] = await Promise.all([
            getRules(),
            isCaptureEnabled(),
            getActivityLog(),
        ]);
        setRules(rulesData);
        setCaptureEnabledState(enabled);
        setActivityLog(log);

        if (isAndroid) {
            const perm = await checkSMSPermission();
            setPermissionStatus(perm);
        } else {
            setPermissionStatus('unavailable');
        }
    }, [isAndroid]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    // --- Master Toggle ---
    const handleToggleCapture = async (value) => {
        setCaptureEnabledState(value);
        await setCaptureEnabled(value);

        if (value && isAndroid && permissionStatus === 'granted') {
            await startSMSListener();
        } else {
            stopSMSListener();
        }
    };

    // --- Permission ---
    const handleRequestPermission = async () => {
        const result = await requestSMSPermission();
        setPermissionStatus(result);
        if (result === 'granted' && captureEnabled) {
            await startSMSListener();
        }
    };

    // --- Rule CRUD ---
    const openRuleModal = (rule = null) => {
        if (rule) {
            setEditingRule(rule);
            setRuleForm({
                name: rule.name,
                enabled: rule.enabled,
                senders: rule.senders.join(', '),
                contentFilters: rule.contentFilters.length > 0
                    ? [...rule.contentFilters]
                    : [{ type: 'text', value: '' }],
            });
        } else {
            setEditingRule(null);
            setRuleForm({
                name: '',
                enabled: true,
                senders: '',
                contentFilters: [{ type: 'text', value: '' }],
            });
        }
        setShowRuleModal(true);
    };

    const handleSaveRule = async () => {
        if (!ruleForm.name) return Alert.alert('Error', 'Rule name is required');
        if (!ruleForm.senders.trim()) return Alert.alert('Error', 'At least one sender is required');

        const senders = ruleForm.senders.split(',').map((s) => s.trim()).filter(Boolean);
        const contentFilters = ruleForm.contentFilters.filter((f) => f.value.trim());

        const ruleData = {
            name: ruleForm.name,
            enabled: ruleForm.enabled,
            senders,
            contentFilters,
        };

        if (editingRule) {
            await updateRule(editingRule.id, ruleData);
        } else {
            await addRule(ruleData);
        }
        setShowRuleModal(false);
        loadData();
    };

    const handleDeleteRule = async () => {
        if (!editingRule) return;
        await deleteRule(editingRule.id);
        setShowRuleModal(false);
        loadData();
    };

    const handleRuleLongPress = (rule) => {
        showCardActions(rule.name, {
            onEdit: () => openRuleModal(rule),
            onDelete: async () => {
                await deleteRule(rule.id);
                loadData();
            },
            extraActions: [
                {
                    label: rule.enabled ? 'Disable' : 'Enable',
                    onPress: async () => {
                        await updateRule(rule.id, { enabled: !rule.enabled });
                        loadData();
                    },
                },
            ],
        });
    };

    // --- Content Filters ---
    const addFilter = () => {
        setRuleForm((prev) => ({
            ...prev,
            contentFilters: [...prev.contentFilters, { type: 'text', value: '' }],
        }));
    };

    const removeFilter = (index) => {
        setRuleForm((prev) => ({
            ...prev,
            contentFilters: prev.contentFilters.filter((_, i) => i !== index),
        }));
    };

    const updateFilter = (index, field, value) => {
        setRuleForm((prev) => ({
            ...prev,
            contentFilters: prev.contentFilters.map((f, i) =>
                i === index ? { ...f, [field]: value } : f
            ),
        }));
    };

    // --- Test SMS ---
    const handleTestSMS = async () => {
        if (!testSender && !testBody) return;
        const result = await testSMS(testSender, testBody);
        setTestResult(result);
    };

    // --- Clear Log ---
    const handleClearLog = () => {
        Alert.alert('Clear Log', 'Remove all activity log entries?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear',
                style: 'destructive',
                onPress: async () => {
                    await clearActivityLog();
                    setActivityLog([]);
                },
            },
        ]);
    };

    // === iOS Fallback ===
    if (!isAndroid) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.iosCard}>
                    <View style={styles.iosIconContainer}>
                        <Ionicons name="lock-closed" size={48} color={colors.warning} />
                    </View>
                    <Text style={styles.iosTitle}>Not Available on iOS</Text>
                    <Text style={styles.iosDesc}>
                        Apple does not allow third-party apps to read SMS messages.
                        This is a system-level restriction that applies to all apps on the App Store.
                    </Text>
                    <View style={styles.iosDivider} />
                    <View style={styles.iosInfoRow}>
                        <Ionicons name="logo-android" size={24} color={colors.success} />
                        <Text style={styles.iosInfoText}>
                            This feature is available on Android devices, where the app can monitor
                            incoming bank SMS and automatically log transactions.
                        </Text>
                    </View>
                    <View style={styles.iosInfoRow}>
                        <Ionicons name="globe-outline" size={24} color={colors.primary} />
                        <Text style={styles.iosInfoText}>
                            You can still manually add transactions or use the web dashboard
                            to manage your finances from any device.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        );
    }

    // === Android Main UI ===
    return (
        <View style={styles.container}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Master Toggle Card */}
                <View style={styles.masterCard}>
                    <View style={styles.masterRow}>
                        <View style={styles.masterLeft}>
                            <View style={[styles.statusDot, captureEnabled && permissionStatus === 'granted' ? styles.statusActive : styles.statusInactive]} />
                            <View>
                                <Text style={styles.masterTitle}>SMS Capture</Text>
                                <Text style={styles.masterSubtitle}>
                                    {captureEnabled && permissionStatus === 'granted'
                                        ? 'Actively monitoring incoming SMS'
                                        : captureEnabled && permissionStatus !== 'granted'
                                            ? 'Permission required to start'
                                            : 'Disabled'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={captureEnabled}
                            onValueChange={handleToggleCapture}
                            trackColor={{ false: colors.surfaceLight, true: colors.success + '60' }}
                            thumbColor={captureEnabled ? colors.success : colors.textDim}
                        />
                    </View>
                </View>

                {/* Permission Card */}
                {permissionStatus !== 'granted' && (
                    <View style={styles.permissionCard}>
                        <View style={styles.permissionIcon}>
                            <Ionicons
                                name={permissionStatus === 'denied' ? 'warning' : 'shield-checkmark-outline'}
                                size={24}
                                color={permissionStatus === 'denied' ? colors.warning : colors.textDim}
                            />
                        </View>
                        <View style={styles.permissionContent}>
                            <Text style={styles.permissionTitle}>
                                {permissionStatus === 'denied'
                                    ? 'SMS Permission Denied'
                                    : 'SMS Permission Required'}
                            </Text>
                            <Text style={styles.permissionDesc}>
                                Grant permission to read incoming SMS for automatic bank transaction capture.
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.permissionBtn} onPress={handleRequestPermission}>
                            <Text style={styles.permissionBtnText}>Grant</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Tabs */}
                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'rules' && styles.tabActive]}
                        onPress={() => setActiveTab('rules')}
                    >
                        <Ionicons name="filter-outline" size={16} color={activeTab === 'rules' ? colors.primary : colors.textDim} />
                        <Text style={[styles.tabText, activeTab === 'rules' && styles.tabTextActive]}>
                            Rules ({rules.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'log' && styles.tabActive]}
                        onPress={() => setActiveTab('log')}
                    >
                        <Ionicons name="time-outline" size={16} color={activeTab === 'log' ? colors.primary : colors.textDim} />
                        <Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>
                            Activity ({activityLog.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'test' && styles.tabActive]}
                        onPress={() => setActiveTab('test')}
                    >
                        <Ionicons name="flask-outline" size={16} color={activeTab === 'test' ? colors.primary : colors.textDim} />
                        <Text style={[styles.tabText, activeTab === 'test' && styles.tabTextActive]}>
                            Test
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Rules Tab */}
                {activeTab === 'rules' && (
                    <View>
                        {rules.length > 0 ? (
                            rules.map((rule) => (
                                <TouchableOpacity
                                    key={rule.id}
                                    style={[styles.ruleCard, !rule.enabled && styles.ruleDisabled]}
                                    activeOpacity={0.7}
                                    onPress={() => openRuleModal(rule)}
                                    onLongPress={() => handleRuleLongPress(rule)}
                                >
                                    <View style={styles.ruleHeader}>
                                        <View style={styles.ruleLeft}>
                                            <View style={[styles.ruleIndicator, { backgroundColor: rule.enabled ? colors.success : colors.textDim }]} />
                                            <Text style={styles.ruleName}>{rule.name}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                                    </View>

                                    <View style={styles.ruleDetails}>
                                        <View style={styles.ruleChips}>
                                            <Ionicons name="person-outline" size={12} color={colors.textDim} />
                                            {rule.senders.map((s, i) => (
                                                <View key={i} style={styles.ruleChip}>
                                                    <Text style={styles.ruleChipText}>{s}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        {rule.contentFilters.length > 0 && (
                                            <View style={styles.ruleChips}>
                                                <Ionicons name="text-outline" size={12} color={colors.textDim} />
                                                {rule.contentFilters.map((f, i) => (
                                                    <View key={i} style={[styles.ruleChip, f.type === 'regex' && styles.regexChip]}>
                                                        <Text style={styles.ruleChipText}>
                                                            {f.type === 'regex' ? `/${f.value}/` : f.value}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="filter-outline" size={48} color={colors.textDim} />
                                <Text style={styles.emptyText}>No rules configured</Text>
                                <Text style={styles.emptySubtext}>Tap + to add a capture rule</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Activity Log Tab */}
                {activeTab === 'log' && (
                    <View>
                        {activityLog.length > 0 && (
                            <TouchableOpacity style={styles.clearLogBtn} onPress={handleClearLog}>
                                <Ionicons name="trash-outline" size={14} color={colors.danger} />
                                <Text style={styles.clearLogText}>Clear Log</Text>
                            </TouchableOpacity>
                        )}
                        {activityLog.length > 0 ? (
                            activityLog.map((entry, idx) => (
                                <View key={idx} style={styles.logEntry}>
                                    <View style={styles.logIcon}>
                                        <Ionicons
                                            name={
                                                entry.status === 'skipped' ? 'remove-circle-outline' :
                                                entry.status === 'error' ? 'alert-circle-outline' :
                                                'checkmark-circle-outline'
                                            }
                                            size={20}
                                            color={
                                                entry.status === 'skipped' ? colors.textDim :
                                                entry.status === 'error' ? colors.danger :
                                                colors.success
                                            }
                                        />
                                    </View>
                                    <View style={styles.logContent}>
                                        <Text style={styles.logSender}>{entry.sender}</Text>
                                        <Text style={styles.logPreview} numberOfLines={1}>{entry.bodyPreview}</Text>
                                        <View style={styles.logMeta}>
                                            {entry.matched && (
                                                <Text style={styles.logRule}>→ {entry.ruleName}</Text>
                                            )}
                                            <Text style={styles.logTime}>
                                                {new Date(entry.timestamp).toLocaleTimeString()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.logBadge,
                                        {
                                            backgroundColor:
                                                entry.status === 'skipped' ? colors.surface :
                                                entry.status === 'error' ? colors.dangerBg :
                                                colors.successBg
                                        }
                                    ]}>
                                        <Text style={[
                                            styles.logBadgeText,
                                            {
                                                color:
                                                    entry.status === 'skipped' ? colors.textDim :
                                                    entry.status === 'error' ? colors.danger :
                                                    colors.success
                                            }
                                        ]}>
                                            {entry.status}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="time-outline" size={48} color={colors.textDim} />
                                <Text style={styles.emptyText}>No activity yet</Text>
                                <Text style={styles.emptySubtext}>Captured SMS will appear here</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Test Tab */}
                {activeTab === 'test' && (
                    <View style={styles.testContainer}>
                        <Text style={styles.testTitle}>SMS Rule Tester</Text>
                        <Text style={styles.testDesc}>
                            Paste a sample SMS to test if your rules would match it.
                        </Text>

                        <FormField label="Sender">
                            <TextInput
                                style={formInputStyle}
                                value={testSender}
                                onChangeText={setTestSender}
                                placeholder="e.g. AlRajhi"
                                placeholderTextColor={colors.textDim}
                            />
                        </FormField>

                        <FormField label="Message Body">
                            <TextInput
                                style={[formInputStyle, { minHeight: 100, textAlignVertical: 'top' }]}
                                value={testBody}
                                onChangeText={setTestBody}
                                placeholder="Paste SMS content here..."
                                placeholderTextColor={colors.textDim}
                                multiline
                            />
                        </FormField>

                        <TouchableOpacity style={styles.testBtn} onPress={handleTestSMS}>
                            <Ionicons name="flask" size={18} color="#FFFFFF" />
                            <Text style={styles.testBtnText}>Test Match</Text>
                        </TouchableOpacity>

                        {testResult && (
                            <View style={[
                                styles.testResultCard,
                                { borderColor: testResult.matched ? colors.success : colors.danger }
                            ]}>
                                <Ionicons
                                    name={testResult.matched ? 'checkmark-circle' : 'close-circle'}
                                    size={32}
                                    color={testResult.matched ? colors.success : colors.danger}
                                />
                                <View style={styles.testResultContent}>
                                    <Text style={[
                                        styles.testResultTitle,
                                        { color: testResult.matched ? colors.success : colors.danger }
                                    ]}>
                                        {testResult.matched ? 'Match Found!' : 'No Match'}
                                    </Text>
                                    {testResult.matched && (
                                        <Text style={styles.testResultRule}>
                                            Matched rule: {testResult.ruleName}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: spacing.xxxl * 3 }} />
            </ScrollView>

            {/* FAB — only on rules tab */}
            {activeTab === 'rules' && (
                <FloatingActionButton onPress={() => openRuleModal()} />
            )}

            {/* Rule Form Modal */}
            <FormModal
                visible={showRuleModal}
                onClose={() => setShowRuleModal(false)}
                title={editingRule ? 'Edit Rule' : 'New Rule'}
                onSubmit={handleSaveRule}
                submitLabel={editingRule ? 'Save' : 'Create'}
                onDelete={editingRule ? handleDeleteRule : undefined}
            >
                <FormField label="Rule Name" required>
                    <TextInput
                        style={formInputStyle}
                        value={ruleForm.name}
                        onChangeText={(t) => setRuleForm((p) => ({ ...p, name: t }))}
                        placeholder="e.g. AlRajhi Bank"
                        placeholderTextColor={colors.textDim}
                    />
                </FormField>

                <FormField label="Senders" required hint="Comma-separated sender names or numbers">
                    <TextInput
                        style={formInputStyle}
                        value={ruleForm.senders}
                        onChangeText={(t) => setRuleForm((p) => ({ ...p, senders: t }))}
                        placeholder="AlRajhi, ALRAJHI, 1151"
                        placeholderTextColor={colors.textDim}
                    />
                </FormField>

                <FormField label="Content Filters" hint="Message must match ALL filters">
                    {ruleForm.contentFilters.map((filter, idx) => (
                        <View key={idx} style={styles.filterRow}>
                            <TouchableOpacity
                                style={styles.filterTypeBtn}
                                onPress={() => updateFilter(idx, 'type', filter.type === 'text' ? 'regex' : 'text')}
                            >
                                <Text style={[
                                    styles.filterTypeText,
                                    filter.type === 'regex' && { color: colors.warning }
                                ]}>
                                    {filter.type === 'regex' ? 'Regex' : 'Text'}
                                </Text>
                            </TouchableOpacity>
                            <TextInput
                                style={[formInputStyle, { flex: 1 }]}
                                value={filter.value}
                                onChangeText={(t) => updateFilter(idx, 'value', t)}
                                placeholder={filter.type === 'regex' ? '\\d+\\.\\d{2}' : 'SAR'}
                                placeholderTextColor={colors.textDim}
                            />
                            {ruleForm.contentFilters.length > 1 && (
                                <TouchableOpacity style={styles.filterRemoveBtn} onPress={() => removeFilter(idx)}>
                                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addFilterBtn} onPress={addFilter}>
                        <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                        <Text style={styles.addFilterText}>Add Filter</Text>
                    </TouchableOpacity>
                </FormField>

                <FormField label="Enabled">
                    <View style={styles.enabledRow}>
                        <Text style={styles.enabledLabel}>
                            {ruleForm.enabled ? 'Active — will match incoming SMS' : 'Disabled — rule will be skipped'}
                        </Text>
                        <Switch
                            value={ruleForm.enabled}
                            onValueChange={(v) => setRuleForm((p) => ({ ...p, enabled: v }))}
                            trackColor={{ false: colors.surfaceLight, true: colors.success + '60' }}
                            thumbColor={ruleForm.enabled ? colors.success : colors.textDim}
                        />
                    </View>
                </FormField>
            </FormModal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { padding: spacing.lg },

    // Master toggle
    masterCard: {
        backgroundColor: colors.surface, borderRadius: borderRadius.lg,
        padding: spacing.xl, borderWidth: 1, borderColor: colors.border,
        marginBottom: spacing.lg,
    },
    masterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    masterLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    masterTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
    masterSubtitle: { fontSize: fontSize.xs, color: colors.textDim, marginTop: 2 },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    statusActive: { backgroundColor: colors.success },
    statusInactive: { backgroundColor: colors.textDim },

    // Permission
    permissionCard: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        backgroundColor: colors.warning + '10', borderRadius: borderRadius.lg,
        padding: spacing.lg, borderWidth: 1, borderColor: colors.warning + '30',
        marginBottom: spacing.lg,
    },
    permissionIcon: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: colors.warning + '20',
        alignItems: 'center', justifyContent: 'center',
    },
    permissionContent: { flex: 1 },
    permissionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
    permissionDesc: { fontSize: fontSize.xs, color: colors.textDim, marginTop: 2 },
    permissionBtn: {
        backgroundColor: colors.warning, paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    },
    permissionBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#000' },

    // Tabs
    tabRow: {
        flexDirection: 'row', backgroundColor: colors.surface,
        borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
        marginBottom: spacing.lg, overflow: 'hidden',
    },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.xs, paddingVertical: spacing.md,
    },
    tabActive: { backgroundColor: colors.primary + '15', borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textDim },
    tabTextActive: { color: colors.primary },

    // Rule Cards
    ruleCard: {
        backgroundColor: colors.surface, borderRadius: borderRadius.lg,
        borderWidth: 1, borderColor: colors.border,
        padding: spacing.lg, marginBottom: spacing.md,
    },
    ruleDisabled: { opacity: 0.5 },
    ruleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    ruleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    ruleIndicator: { width: 8, height: 8, borderRadius: 4 },
    ruleName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
    ruleDetails: { gap: spacing.xs, marginLeft: spacing.xl },
    ruleChips: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
    ruleChip: {
        backgroundColor: colors.surfaceLight, paddingHorizontal: spacing.sm,
        paddingVertical: 2, borderRadius: borderRadius.sm,
    },
    regexChip: { backgroundColor: colors.warning + '20', borderWidth: 1, borderColor: colors.warning + '40' },
    ruleChipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontFamily: 'monospace' },

    // Filter form
    filterRow: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm,
    },
    filterTypeBtn: {
        backgroundColor: colors.surfaceLight, paddingHorizontal: spacing.md,
        paddingVertical: spacing.md, borderRadius: borderRadius.sm,
        minWidth: 60, alignItems: 'center',
    },
    filterTypeText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
    filterRemoveBtn: { padding: spacing.xs },
    addFilterBtn: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
        paddingVertical: spacing.sm, marginTop: spacing.xs,
    },
    addFilterText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
    enabledRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: colors.surface, borderRadius: borderRadius.sm,
        padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    },
    enabledLabel: { fontSize: fontSize.sm, color: colors.textSecondary, flex: 1, marginRight: spacing.md },

    // Activity Log
    clearLogBtn: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
        alignSelf: 'flex-end', marginBottom: spacing.md,
    },
    clearLogText: { fontSize: fontSize.sm, color: colors.danger },
    logEntry: {
        flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
        backgroundColor: colors.surface, borderRadius: borderRadius.md,
        padding: spacing.md, borderWidth: 1, borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    logIcon: { marginTop: 2 },
    logContent: { flex: 1 },
    logSender: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
    logPreview: { fontSize: fontSize.xs, color: colors.textDim, marginTop: 2 },
    logMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
    logRule: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold },
    logTime: { fontSize: fontSize.xs, color: colors.textDim },
    logBadge: {
        paddingHorizontal: spacing.sm, paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
    logBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },

    // Test
    testContainer: { },
    testTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.xs },
    testDesc: { fontSize: fontSize.sm, color: colors.textDim, marginBottom: spacing.xl },
    testBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: spacing.sm, backgroundColor: colors.primary,
        paddingVertical: spacing.md, borderRadius: borderRadius.md,
        marginTop: spacing.md,
    },
    testBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#FFFFFF' },
    testResultCard: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        backgroundColor: colors.surface, borderRadius: borderRadius.lg,
        padding: spacing.xl, borderWidth: 2, marginTop: spacing.xl,
    },
    testResultContent: { flex: 1 },
    testResultTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    testResultRule: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },

    // Empty
    emptyState: { alignItems: 'center', padding: spacing.xxxl },
    emptyText: { color: colors.textDim, fontSize: fontSize.md, marginTop: spacing.sm, fontWeight: fontWeight.semibold },
    emptySubtext: { color: colors.textDim, fontSize: fontSize.sm, marginTop: spacing.xs, fontStyle: 'italic' },

    // iOS
    iosCard: {
        backgroundColor: colors.surface, borderRadius: borderRadius.lg,
        padding: spacing.xxl, borderWidth: 1, borderColor: colors.border,
        alignItems: 'center',
    },
    iosIconContainer: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: colors.warning + '15',
        alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
    },
    iosTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center', marginBottom: spacing.md },
    iosDesc: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    iosDivider: {
        height: 1, backgroundColor: colors.border,
        alignSelf: 'stretch', marginVertical: spacing.xl,
    },
    iosInfoRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
        alignSelf: 'stretch', marginBottom: spacing.lg,
    },
    iosInfoText: { fontSize: fontSize.sm, color: colors.textSecondary, flex: 1, lineHeight: 20 },
});

export default SMSCaptureScreen;
