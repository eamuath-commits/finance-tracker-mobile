import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows } from '../theme';

const FloatingActionButton = ({ onPress, icon = 'add', color = colors.primary, size = 56 }) => {
    return (
        <TouchableOpacity
            style={[
                styles.fab,
                shadows.card,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Ionicons name={icon} size={28} color="#FFFFFF" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
});

export default FloatingActionButton;
