import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X, Star, MapPin } from 'lucide-react-native';
import api from '../lib/api';
import { storageUrl } from '../lib/storage';
import { useAuthStore } from '../lib/authStore';
import { fetchRouteInfo, formatDistance, formatDuration } from '../lib/deliveryFee';
import CustomHeader from '../components/CustomHeader';

const GREEN = '#2ECC71';
const DARK_GREEN = '#22A85A';

export default function StoresScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  // Map storeId → { distance_km, duration_minutes }
  const [routeMap, setRouteMap] = useState<Record<string, { distance_km: number; duration_minutes: number | null }>>({});

  const fetchStores = async (q = '', showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const endpoint = q ? `/search?q=${q}&type=store` : '/stores';
      const res = await api.get(endpoint);
      const data: any[] = res.data.data.stores || res.data.data || [];
      setStores(data);

      // Fetch jarak untuk semua store secara paralel (kalau user punya koordinat)
      if (user?.latitude && user?.longitude) {
        const entries = await Promise.all(
          data.map(async (s) => {
            if (!s.latitude || !s.longitude) return [s.id, null];
            const info = await fetchRouteInfo(s.latitude, s.longitude, user.latitude, user.longitude);
            return [s.id, info];
          })
        );
        const map: Record<string, any> = {};
        entries.forEach(([id, info]) => { if (id && info) map[id as string] = info; });
        setRouteMap(map);
      }
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchStores(query, false), 400);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <CustomHeader title="Semua Restoran" />

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari restoran..."
            value={query}
            onChangeText={setQuery}
            placeholderTextColor="#9CA3AF"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <X size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={GREEN} /></View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={s => s.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStores(query, false); }} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🍽️</Text>
              <Text style={styles.emptyTitle}>Tidak ada restoran</Text>
              <Text style={styles.emptyDesc}>Coba kata kunci lain</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/store/${item.id}` as any)}>
              <View style={styles.imgWrap}>
                {item.image
                  ? <Image source={{ uri: storageUrl(item.image)! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <Text style={{ fontSize: 36 }}>🍽️</Text>}
                <View style={[styles.statusBadge, { backgroundColor: item.is_open ? '#DCFCE7' : '#FEE2E2' }]}>
                  <View style={[styles.statusDot, { backgroundColor: item.is_open ? GREEN : '#EF4444' }]} />
                  <Text style={[styles.statusText, { color: item.is_open ? DARK_GREEN : '#DC2626' }]}>
                    {item.is_open ? 'Buka' : 'Tutup'}
                  </Text>
                </View>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.category}>{item.category?.name || 'Kuliner'}</Text>
                <View style={styles.meta}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.metaText}>{item.rating || '4.8'}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <MapPin size={12} color="#9CA3AF" />
                  <Text style={styles.metaText}>
                    {!user?.latitude || !user?.longitude
                      ? 'Atur lokasi'
                      : routeMap[item.id]
                        ? formatDistance(routeMap[item.id].distance_km)
                        : (!item.latitude || !item.longitude ? 'Jarak N/A' : '...')}
                  </Text>
                  {routeMap[item.id]?.duration_minutes && (
                    <>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>{formatDuration(routeMap[item.id].duration_minutes)}</Text>
                    </>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F7F8FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 18, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  imgWrap: { width: 100, height: 100, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  statusBadge: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '800', color: '#111827' },
  category: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  metaText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  metaDot: { color: '#D1D5DB', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});
