import { Platform, PermissionsAndroid } from 'react-native';
import { ingestSMS } from './api';
import { getRules, findMatchingRule, addLogEntry, isCaptureEnabled } from './smsRules';

// Track listener state
let listenerSubscription = null;
let isListenerActive = false;

/**
 * Check if SMS permissions are granted (Android only)
 */
export const checkSMSPermission = async () => {
    if (Platform.OS !== 'android') return 'unavailable';

    try {
        const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
        );
        return granted ? 'granted' : 'denied';
    } catch (err) {
        console.error('checkSMSPermission error:', err);
        return 'denied';
    }
};

/**
 * Request SMS permission at runtime (Android only)
 */
export const requestSMSPermission = async () => {
    if (Platform.OS !== 'android') return 'unavailable';

    try {
        const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
            PermissionsAndroid.PERMISSIONS.READ_SMS,
        ]);

        const receiveGranted =
            result[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] ===
            PermissionsAndroid.RESULTS.GRANTED;

        return receiveGranted ? 'granted' : 'denied';
    } catch (err) {
        console.error('requestSMSPermission error:', err);
        return 'denied';
    }
};

/**
 * Handle an incoming SMS — match against rules and forward if needed
 */
export const handleIncomingSMS = async (sender, body) => {
    try {
        // Check if capture is enabled
        const enabled = await isCaptureEnabled();
        if (!enabled) return;

        // Load rules and find match
        const rules = await getRules();
        const matchedRule = findMatchingRule(sender, body, rules);

        if (!matchedRule) {
            // No match — log and skip
            await addLogEntry({
                sender,
                bodyPreview: body.substring(0, 80),
                matched: false,
                ruleName: null,
                status: 'skipped',
            });
            return;
        }

        // Match found — forward to backend
        try {
            const response = await ingestSMS(sender, body);
            const status = response?.data?.status || 'sent';

            await addLogEntry({
                sender,
                bodyPreview: body.substring(0, 80),
                matched: true,
                ruleName: matchedRule.name,
                status,
            });

            console.log(`[SMS-CAPTURE] Forwarded SMS from ${sender} (rule: ${matchedRule.name}) → ${status}`);
        } catch (apiErr) {
            console.error('[SMS-CAPTURE] API error:', apiErr);
            await addLogEntry({
                sender,
                bodyPreview: body.substring(0, 80),
                matched: true,
                ruleName: matchedRule.name,
                status: 'error',
                error: apiErr.message,
            });
        }
    } catch (err) {
        console.error('[SMS-CAPTURE] handleIncomingSMS error:', err);
    }
};

/**
 * Start the SMS listener (Android only)
 * Uses expo-sms-listener if available, otherwise falls back gracefully
 */
export const startSMSListener = async () => {
    if (Platform.OS !== 'android') return false;
    if (isListenerActive) return true;

    try {
        // Dynamic import — won't crash on iOS or if module not installed
        const SMSListener = require('expo-sms-listener');

        if (SMSListener && SMSListener.addSMSListener) {
            listenerSubscription = SMSListener.addSMSListener((event) => {
                const { sender, body, message } = event;
                handleIncomingSMS(
                    sender || event.originatingAddress || 'Unknown',
                    body || message || ''
                );
            });
            isListenerActive = true;
            console.log('[SMS-CAPTURE] Listener started');
            return true;
        }
    } catch (err) {
        // Module not installed — use fallback polling or manual mode
        console.warn('[SMS-CAPTURE] expo-sms-listener not available:', err.message);
    }

    return false;
};

/**
 * Stop the SMS listener
 */
export const stopSMSListener = () => {
    if (listenerSubscription) {
        listenerSubscription.remove();
        listenerSubscription = null;
    }
    isListenerActive = false;
    console.log('[SMS-CAPTURE] Listener stopped');
};

/**
 * Get current listener status
 */
export const isListening = () => isListenerActive;

/**
 * Test a sample SMS against all rules (for the rule tester UI)
 */
export const testSMS = async (sender, body) => {
    const rules = await getRules();
    const matched = findMatchingRule(sender, body, rules);
    return {
        matched: !!matched,
        ruleName: matched?.name || null,
        ruleId: matched?.id || null,
    };
};
