import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { getCategories, createCategory, deleteCategory } from '../services/api';

const CategoriesScreen = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newName, setNewName] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await getCategories();
            setCategories(res.data);
        } catch (err) {
            console.error('Categories fetch error:', err);
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

    const handleAdd = async () => {
        if (!newName.trim()) return;
        try {
            await createCategory({ name: newName.trim(), type: 'BOTH' });
            setNewName('');
            setShowAdd(false);
            fetchData();
        } catch (err) {
            console.error('Create category error:', err);
            Alert.alert('Error', 'Could not create category. It may already exist.');
        }
    };

    const handleDelete = (cat) => {
        Alert.alert(
            'Delete Category',
            `Remove "${cat.name}"? This won't delete transactions using this category.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCategory(cat.id);
                            fetchData();
                        } catch (err) {
                            console.error('Delete category error:', err);
                            Alert.alert('Error', 'Could not delete category');
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

    const renderCategory = ({ item }) => {
        const typeLabel = item.type === 'OBLIGATION' ? 'Obligation' : item.type === 'TRANSACTION' ? 'Transaction' : 'Both';
        const dotColor = colors.chart[Math.abs((item.name || '').charCodeAt(0)) % colors.chart.length];

        return (
            <View style={styles.categoryRow}>
                <View style={[styles.categoryDot, { backgroundColor: dotColor }]} />
                <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <Text style={styles.categoryType}>{typeLabel}</Text>
                </View>
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item)}
                >
                    <Ionicons name="trash-outline" size={18} color={colors.textDim} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Add bar */}
            <View style={styles.addBar}>
                {showAdd ? (
                    <View style={styles.addRow}>
                        <TextInput
                            style={styles.addInput}
                            placeholder="New category name"
                            placeholderTextColor={colors.textDim}
                            value={newName}
                            onChangeText={setNewName}
                            autoFocus
                            onSubmitEditing={handleAdd}
                            returnKeyType="done"
                        />
                        <TouchableOpacity style={styles.addSubmit} onPress={handleAdd}>
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addCancel} onPress={() => { setShowAdd(false); setNewName(''); }}>
                            <Ionicons name="close" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowAdd(true)}>
                        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                        <Text style={styles.addButtonText}>Add Category</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Count */}
            <View style={styles.countBar}>
                <Text style={styles.countText}>
                    {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
                </Text>
            </View>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={renderCategory}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="pricetags-outline" size={48} color={colors.textDim} />
                        <Text style={styles.emptyText}>No categories yet</Text>
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

    // Add
    addBar: {
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    addButton: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    },
    addButtonText: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.semibold },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    addInput: {
        flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
        borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        color: colors.text, fontSize: fontSize.md,
    },
    addSubmit: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    addCancel: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    },

    // Count
    countBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    countText: { fontSize: fontSize.sm, color: colors.textDim },

    // List
    listContent: { paddingBottom: spacing.xxxl },

    // Category row
    categoryRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
        borderBottomWidth: 1, borderBottomColor: colors.border + '40',
    },
    categoryDot: {
        width: 10, height: 10, borderRadius: 5, marginRight: spacing.md,
    },
    categoryInfo: { flex: 1 },
    categoryName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
    categoryType: { fontSize: fontSize.xs, color: colors.textDim, marginTop: 2 },
    deleteBtn: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },

    // Empty
    emptyState: { alignItems: 'center', padding: spacing.xxxl * 2 },
    emptyText: { color: colors.textDim, fontSize: fontSize.md, marginTop: spacing.sm, fontStyle: 'italic' },
});

export default CategoriesScreen;
