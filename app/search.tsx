import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X, UtensilsCrossed, Store } from 'lucide-react-native';
import { storageUrl } from '../lib/storage';
import api from '../lib/api';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 1) {
        fetchResults();
      } else {
        setResults([]);
      }
    }, 500); // debounce 500ms
    return () => clearTimeout(timer);
  }, [query]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
      const d = res.data?.data || {};
      const stores = (d.stores || []).map((s: any) => ({ ...s, _type: 'store' }));
      const foods = (d.foods || []).map((f: any) => ({ ...f, _type: 'food' }));
      setResults([...stores, ...foods]);
    } catch (err) {
      console.log('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePressItem = (item: any) => {
    if (item._type === 'store') {
       router.push(`/store/${item.id}` as any);
    } else {
       router.push(`/food/${item.id}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.flex}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header Search Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1F2937" />
        </Pressable>
        <View style={styles.searchBox}>
          <Search size={20} color="#9CA3AF" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Cari Nasi, Ayam, atau Toko..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
             <Pressable onPress={() => setQuery('')}>
                <X size={20} color="#D1D5DB" />
             </Pressable>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
             <ActivityIndicator size="large" color={GREEN} />
             <Text style={styles.loadingText}>Mencari "{query}"...</Text>
          </View>
        ) : query.length > 1 && results.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 50 }}>🔍</Text>
            <Text style={styles.emptyTitle}>Hasil tidak ditemukan</Text>
            <Text style={styles.emptyText}>Coba gunakan kata kunci lain</Text>
          </View>
        ) : query.length <= 1 ? (
          <View style={styles.center}>
            <UtensilsCrossed size={60} color="#E5E7EB" />
            <Text style={styles.helpText}>Ketik nama makanan atau nama warung</Text>
          </View>
        ) : (
          <FlatList 
            data={results}
            keyExtractor={(item, idx) => item.id || idx.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => handlePressItem(item)}>
                {item.image ? (
                  <Image source={{ uri: storageUrl(item.image)! }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    {item._type === 'store' ? <Store size={30} color="#9CA3AF" /> : <UtensilsCrossed size={30} color="#9CA3AF" />}
                  </View>
                )}
                <View style={styles.info}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.typeBadge, { backgroundColor: item._type === 'store' ? '#E0E7FF' : '#FFF7ED' }]}>
                      <Text style={[styles.typeText, { color: item._type === 'store' ? '#4338CA' : '#C2410C' }]}>
                        {item._type === 'store' ? 'Mitra Toko' : 'Menu Makanan'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.name}>{item.name}</Text>
                  
                  {item._type === 'food' && item.store ? (
                    <Text style={styles.storeRefText}>Dari {item.store.name}</Text>
                  ) : null}

                  {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
                  {item.price && <Text style={styles.price}>Rp {Number(item.price).toLocaleString('id-ID')}</Text>}
                </View>
              </Pressable>
            )}
          />
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  backBtn: { padding: 4, marginRight: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, height: 46 },
  searchInput: { flex: 1, height: '100%', marginLeft: 8, fontSize: 15, color: '#1F2937' },
  content: { flex: 1 },
  list: { padding: 16, gap: 12 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  image: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F3F4F6' },
  imagePlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', marginBottom: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  storeRefText: { fontSize: 12, color: DARK_GREEN, fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  price: { fontSize: 15, fontWeight: 'bold', color: DARK_GREEN },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  helpText: { fontSize: 14, color: '#9CA3AF', marginTop: 16 },
});
