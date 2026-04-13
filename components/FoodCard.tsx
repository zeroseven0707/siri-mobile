import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { UtensilsCrossed } from 'lucide-react-native';
import { storageUrl } from '../lib/storage';

export default function FoodCard({ item, onPress }: { item: FoodItem; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.imageBox}>
        {item.image
          ? <Image source={{ uri: storageUrl(item.image)! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <UtensilsCrossed size={30} color="#D1D5DB" />}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>Rp {Number(item.price).toLocaleString('id-ID')}</Text>
        {item.store && <Text style={styles.store} numberOfLines={1}>{item.store.name}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginRight: 16, width: 160, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  imageBox: { height: 80, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  info: { padding: 10 },
  name: { fontWeight: '600', color: '#1F2937', fontSize: 14 },
  price: { color: '#6C63FF', fontWeight: '700', fontSize: 14, marginTop: 4 },
  store: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
});
