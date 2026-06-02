import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const RULES_KEY = '@sms_capture_rules';
const MASTER_TOGGLE_KEY = '@sms_capture_enabled';
const ACTIVITY_LOG_KEY = '@sms_capture_log';
const MAX_LOG_ENTRIES = 50;

/**
 * Default SMS capture rules for Saudi banks
 */
const DEFAULT_RULES = [
    {
        id: 'default-alrajhi',
        name: 'AlRajhi Bank',
        enabled: true,
        senders: ['AlRajhi', 'ALRAJHI', '1151'],
        contentFilters: [
            { type: 'text', value: 'SAR' },
        ],
    },
    {
        id: 'default-stc',
        name: 'STC Pay',
        enabled: true,
        senders: ['STC', 'STC Pay', 'STPay'],
        contentFilters: [
            { type: 'text', value: 'SAR' },
        ],
    },
    {
        id: 'default-jazira',
        name: 'Bank AlJazira',
        enabled: true,
        senders: ['JAZIRA', 'BAJ', '1157'],
        contentFilters: [
            { type: 'text', value: 'SAR' },
        ],
    },
    {
        id: 'default-alinma',
        name: 'Alinma Bank',
        enabled: true,
        senders: ['Alinma', 'ALINMA'],
        contentFilters: [
            { type: 'text', value: 'SAR' },
        ],
    },
];

// --- Rules CRUD ---

export const getRules = async () => {
    try {
        const json = await AsyncStorage.getItem(RULES_KEY);
        if (json) return JSON.parse(json);
        // First launch: seed defaults
        await AsyncStorage.setItem(RULES_KEY, JSON.stringify(DEFAULT_RULES));
        return DEFAULT_RULES;
    } catch (err) {
        console.error('getRules error:', err);
        return DEFAULT_RULES;
    }
};

export const saveRules = async (rules) => {
    try {
        await AsyncStorage.setItem(RULES_KEY, JSON.stringify(rules));
    } catch (err) {
        console.error('saveRules error:', err);
    }
};

export const addRule = async (rule) => {
    const rules = await getRules();
    const newRule = { ...rule, id: uuidv4() };
    rules.push(newRule);
    await saveRules(rules);
    return newRule;
};

export const updateRule = async (id, updates) => {
    const rules = await getRules();
    const idx = rules.findIndex((r) => r.id === id);
    if (idx >= 0) {
        rules[idx] = { ...rules[idx], ...updates };
        await saveRules(rules);
    }
    return rules;
};

export const deleteRule = async (id) => {
    let rules = await getRules();
    rules = rules.filter((r) => r.id !== id);
    await saveRules(rules);
    return rules;
};

// --- Master Toggle ---

export const isCaptureEnabled = async () => {
    try {
        const val = await AsyncStorage.getItem(MASTER_TOGGLE_KEY);
        return val === 'true';
    } catch {
        return false;
    }
};

export const setCaptureEnabled = async (enabled) => {
    await AsyncStorage.setItem(MASTER_TOGGLE_KEY, enabled ? 'true' : 'false');
};

// --- Rule Matching ---

/**
 * Test if an SMS matches a specific rule
 * @param {string} sender - SMS sender address
 * @param {string} body - SMS body text
 * @param {object} rule - Rule object
 * @returns {boolean}
 */
export const matchesRule = (sender, body, rule) => {
    if (!rule.enabled) return false;

    // Check sender filter (any match = pass)
    const senderLower = (sender || '').toLowerCase();
    const senderMatch = rule.senders.some((s) =>
        senderLower.includes(s.toLowerCase())
    );
    if (!senderMatch) return false;

    // Check content filters (all must match = AND logic)
    const bodyLower = (body || '').toLowerCase();
    const contentMatch = rule.contentFilters.every((filter) => {
        if (filter.type === 'regex') {
            try {
                return new RegExp(filter.value, 'i').test(body);
            } catch {
                return false; // Invalid regex
            }
        }
        // Plain text match
        return bodyLower.includes(filter.value.toLowerCase());
    });

    return contentMatch;
};

/**
 * Find the first matching rule for an SMS
 */
export const findMatchingRule = (sender, body, rules) => {
    return rules.find((rule) => matchesRule(sender, body, rule));
};

// --- Activity Log ---

export const getActivityLog = async () => {
    try {
        const json = await AsyncStorage.getItem(ACTIVITY_LOG_KEY);
        return json ? JSON.parse(json) : [];
    } catch {
        return [];
    }
};

export const addLogEntry = async (entry) => {
    try {
        const log = await getActivityLog();
        log.unshift({
            ...entry,
            timestamp: new Date().toISOString(),
        });
        // Keep only last N entries
        const trimmed = log.slice(0, MAX_LOG_ENTRIES);
        await AsyncStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(trimmed));
        return trimmed;
    } catch (err) {
        console.error('addLogEntry error:', err);
    }
};

export const clearActivityLog = async () => {
    await AsyncStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify([]));
};
