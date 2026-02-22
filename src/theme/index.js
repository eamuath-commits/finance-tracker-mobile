/**
 * Design system for Finance Tracker Mobile
 * Matches the web app's dark slate/blue palette
 */

export const colors = {
    // Backgrounds
    background: '#0F172A',     // slate-900
    surface: '#1E293B',        // slate-800
    surfaceLight: '#334155',   // slate-700
    surfaceHighlight: '#475569', // slate-600

    // Primary
    primary: '#3B82F6',        // blue-500
    primaryDark: '#2563EB',    // blue-600
    primaryLight: '#60A5FA',   // blue-400

    // Semantic
    success: '#10B981',        // emerald-500
    successLight: '#34D399',   // emerald-400
    successBg: 'rgba(16, 185, 129, 0.1)',
    danger: '#EF4444',         // red-500
    dangerLight: '#F87171',    // red-400
    dangerBg: 'rgba(239, 68, 68, 0.1)',
    warning: '#F59E0B',        // amber-500
    warningLight: '#FBBF24',   // amber-400

    // Text
    text: '#F1F5F9',           // slate-100
    textSecondary: '#CBD5E1',  // slate-300
    textMuted: '#94A3B8',      // slate-400
    textDim: '#64748B',        // slate-500

    // Borders
    border: '#334155',         // slate-700
    borderLight: '#475569',    // slate-600

    // Chart colors
    chart: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'],
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};

export const fontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    title: 32,
};

export const fontWeight = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
};

export const shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
};

/**
 * Format a number as SAR currency
 */
export const formatCurrency = (value) => {
    const num = Math.round(Number(value) * 100) / 100;
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
};

/**
 * Format a number with commas only (no currency suffix)
 */
export const formatNumber = (value) => {
    const num = Math.round(Number(value) * 100) / 100;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default {
    colors,
    spacing,
    borderRadius,
    fontSize,
    fontWeight,
    shadows,
    formatCurrency,
    formatNumber,
};
