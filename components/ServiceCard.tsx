import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Service } from '../types';

const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: 'fast-food-outline', ojek: 'bicycle-outline', car: 'car-outline', delivery: 'cube-outline',
};
const SERVICE_COLORS: Record<string, string> = {
  food: '#FFF7ED', ojek: '#F0FDF4', car: '#EFF6FF', delivery: '#FAF5FF',
};
const ICON_COLORS: Record<string, string> = {
  food: '#F97316', ojek: '#22C55E', car: '#3B82F6', delivery: '#A855F7',
};

export default function ServiceCard({ service, onPress }: { service: Service; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[styles.icon, { backgroundColor: SERVICE_COLORS[service.slug] ?? '#F3F4F6' }]}>
        <Ionicons name={SERVICE_ICONS[service.slug] ?? 'apps-outline'} size={26} color={ICON_COLORS[service.slug] ?? '#6C63FF'} />
      </View>
      <Text style={styles.label} numberOfLines={2}>{service.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginRight: 16, width: 64 },
  icon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  label: { fontSize: 12, textAlign: 'center', color: '#374151', fontWeight: '500' },
});
