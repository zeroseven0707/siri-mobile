import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import api from '../lib/api';
import { storageUrl } from '../lib/storage';
import CustomHeader from '../components/CustomHeader';

const GREEN = '#2ECC71';
const DARK_GREEN = '#22A85A';

export default function FoodsScreen() {
  const router = useRouter();
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const fetchFoods = async (q = '', showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const endpoint = q ? `/search?q=${q}&type=food` : '/foods';
      const res = await api.get(endpoint);
      setFoods(res.data.data.foods || res.data.data || []);
    } catch {
      setFoods([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchFoods(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchFoods(query, false), 400);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <CustomHeader title="Semua Menu Makanan" />

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari makanan..."
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
          data={foods}
          keyExtractor={f => f.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFoods(query, false); }} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🍱</Text>
              <Text style={styles.emptyTitle}>Tidak ada menu</Text>
              <Text style={styles.emptyDesc}>Coba kata kunci lain</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/food/${item.id}` as any)}>
              <View style={styles.imgWrap}>
                {item.image
                  ? <Image source={{ uri: storageUrl(item.image)! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <Text style={{ fontSize: 32 }}>🍱</Text>}
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                {item.store && <Text style={styles.storeName} numberOfLines={1}>{item.store.name}</Text>}
                <Text style={styles.price}>Rp {Number(item.price).toLocaleString('id-ID')}</Text>
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
  list: { padding: 16 },
  row: { gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  imgWrap: { height: 120, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  info: { padding: 12 },
  name: { fontSize: 13, fontWeight: '800', color: '#111827', lineHeight: 18 },
  storeName: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  price: { fontSize: 14, fontWeight: '800', color: DARK_GREEN, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});
