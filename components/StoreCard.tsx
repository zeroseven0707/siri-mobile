import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Store } from '../types';

export default function StoreCard({ store, onPress }: { store: Store; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.imageBox}>
        {store.image
          ? <Image source={{ uri: store.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <Ionicons name="storefront-outline" size={36} color="#D1D5DB" />}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
        <Text style={styles.address} numberOfLines={1}>{store.address}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: store.is_open ? '#22C55E' : '#EF4444' }]} />
          <Text style={[styles.statusText, { color: store.is_open ? '#16A34A' : '#DC2626' }]}>
            {store.is_open ? 'Buka' : 'Tutup'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginRight: 16, width: 176, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  imageBox: { height: 96, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  info: { padding: 12 },
  name: { fontWeight: '600', color: '#1F2937', fontSize: 14 },
  address: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
});
