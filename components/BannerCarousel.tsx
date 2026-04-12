import React, { useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { HomeSectionItem } from '../types';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 32;

export default function BannerCarousel({ items }: { items: HomeSectionItem[] }) {
  const [active, setActive] = useState(0);
  if (!items.length) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH))}
        renderItem={({ item }) => (
          <Pressable style={[styles.slide, { width: ITEM_WIDTH }]}>
            {item.image
              ? <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : (
                <View style={styles.fallback}>
                  <Text style={styles.title}>{item.title}</Text>
                  {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
                </View>
              )}
          </Pressable>
        )}
      />
      {items.length > 1 && (
        <View style={styles.dots}>
          {items.map((_, i) => (
            <View key={i} style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  slide: { height: 160, borderRadius: 16, overflow: 'hidden', backgroundColor: '#6C63FF' },
  fallback: { flex: 1, padding: 20, justifyContent: 'flex-end' },
  title: { color: '#fff', fontWeight: '700', fontSize: 18 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 4 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 16, backgroundColor: '#6C63FF' },
  dotInactive: { width: 6, backgroundColor: '#D1D5DB' },
});
