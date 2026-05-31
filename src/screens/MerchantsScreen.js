import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, formatNumber } from '../theme';
import { getMerchants } from '../services/api';

const MerchantsScreen = () => {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const res = await getMerchants();
            setMerchants(res.data);
        } catch (err) {
            console.error('Merchants fetch error:', err);
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

    const filteredMerchants = useMemo(() => {
        if (!searchTerm.trim()) return merchants;
        const term = searchTerm.toLowerCase();
        return merchants.filter(
            (m) =>
                (m.name || '').toLowerCase().includes(term) ||
                (m.display_name || '').toLowerCase().includes(term) ||
                (m.category || '').toLowerCase().includes(term)
        );
    }, [merchants, searchTerm]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const renderMerchant = ({ item }) => {
        const name = item.display_name || item.name;
        const initial = name ? name.charAt(0).toUpperCase() : '?';
        const categoryColor = colors.chart[Math.abs(name.charCodeAt(0)) % colors.chart.length];

        return (
            <View style={styles.merchantCard}>
                <View style={[styles.merchantAvatar, { backgroundColor: categoryColor + '20' }]}>
                    <Text style={[styles.merchantInitial, { color: categoryColor }]}>{initial}</Text>
                </View>
                <View style={styles.merchantInfo}>
                    <Text style={styles.merchantName} numberOfLines={1}>{name}</Text>
                    {item.category && (
                        <Text style={styles.merchantCategory} numberOfLines={1}>{item.category}</Text>
                    )}
                </View>
                {item.aliases && item.aliases.length > 0 && (
                    <View style={styles.aliasCount}>
                        <Text style={styles.aliasText}>{item.aliases.length} alias{item.aliases.length > 1 ? 'es' : ''}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={colors.textDim} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search merchants..."
                    placeholderTextColor={colors.textDim}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {/* Count */}
            <View style={styles.countBar}>
                <Text style={styles.countText}>
                    {filteredMerchants.length} merchant{filteredMerchants.length !== 1 ? 's' : ''}
                </Text>
            </View>

            <FlatList
                data={filteredMerchants}
                keyExtractor={(item) => item.id}
                renderItem={renderMerchant}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="storefront-outline" size={48} color={colors.textDim} />
                        <Text style={styles.emptyText}>
                            {searchTerm ? 'No merchants match your search' : 'No merchants yet'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background,
    },

    // Search
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm,
        backgroundColor: colors.surface, borderRadius: borderRadius.sm,
        borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md,
    },
    searchIcon: { marginRight: spacing.sm },
    searchInput: {
        flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: spacing.md,
    },

    // Count
    countBar: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
    countText: { fontSize: fontSize.sm, color: colors.textDim },

    // List
    listContent: { paddingBottom: spacing.xxxl },

    // Merchant card
    merchantCard: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
        borderBottomWidth: 1, borderBottomColor: colors.border + '40',
    },
    merchantAvatar: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
    },
    merchantInitial: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    merchantInfo: { flex: 1, marginRight: spacing.sm },
    merchantName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
    merchantCategory: { fontSize: fontSize.xs, color: colors.textDim, marginTop: 2 },
    aliasCount: {
        backgroundColor: colors.surfaceLight, paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs, borderRadius: borderRadius.full,
    },
    aliasText: { fontSize: fontSize.xs, color: colors.textMuted },

    // Empty
    emptyState: { alignItems: 'center', padding: spacing.xxxl * 2 },
    emptyText: { color: colors.textDim, fontSize: fontSize.md, marginTop: spacing.sm, fontStyle: 'italic' },
});

export default MerchantsScreen;
