import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, ArrowLeft, MapPin, Star, ShoppingCart, Clock } from 'lucide-react-native';
import api from '../../lib/api';
import { FoodItem, Store } from '../../types';
import { storageUrl } from '../../lib/storage';
import { useAuthStore } from '../../lib/authStore';
import { fetchRouteInfo, formatDistance, formatDuration } from '../../lib/deliveryFee';

const GREEN = '#2ECC71';
const DARK_GREEN = '#22A85A';

type CartItem = FoodItem & { qty: number };

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [store, setStore] = useState<Store | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get(`/stores/${id}`);
        const storeData: Store = res.data.data;
        setStore(storeData);
        setFoods(storeData.food_items || []);

        // Fetch jarak setelah store data tersedia
        if (storeData.latitude && storeData.longitude && user?.latitude && user?.longitude) {
          const info = await fetchRouteInfo(
            storeData.latitude, storeData.longitude,
            user.latitude, user.longitude,
          );
          if (info) {
            setDistanceKm(info.distance_km);
            setDurationMin(info.duration_minutes);
            setDeliveryFee(info.delivery_fee);
          }
        }
      } catch { Alert.alert('Error', 'Gagal memuat detail toko'); }
      finally { setLoading(false); }
    };
    if (id) fetchStore();
  }, [id]);

  const updateCart = (food: FoodItem, delta: number) => {
    setCart(prev => {
      const newQty = Math.max(0, (prev[food.id]?.qty || 0) + delta);
      const next = { ...prev };
      if (newQty === 0) delete next[food.id];
      else next[food.id] = { ...food, qty: newQty };
      return next;
    });
  };

  const cartCount = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const cartTotal = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);

  const handleCheckout = () => {
    if (cartCount === 0) return;
    router.push({
      pathname: '/checkout/food',
      params: {
        storeId: id,
        storeName: store?.name,
        storeAddress: store?.address,
        storeLat: store?.latitude ?? '',
        storeLng: store?.longitude ?? '',
        cartItems: JSON.stringify(Object.values(cart)),
      }
    });
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={GREEN} /></SafeAreaView>;
  if (!store) return <SafeAreaView style={styles.center}><Text>Toko tidak ditemukan.</Text></SafeAreaView>;

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          {store.image
            ? <Image source={{ uri: storageUrl(store.image)! }} style={styles.heroImg} resizeMode="cover" />
            : <View style={styles.heroPlaceholder}><Text style={{ fontSize: 64 }}>🍽️</Text></View>}
          <View style={styles.heroGradient} />

          <SafeAreaView style={styles.heroHeader} edges={['top']}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color="#1F2937" />
            </Pressable>
          </SafeAreaView>

          {/* Store info overlay */}
          <View style={styles.heroInfo}>
            <View style={[styles.statusBadge, { backgroundColor: store.is_open ? '#DCFCE7' : '#FEE2E2' }]}>
              <View style={[styles.statusDot, { backgroundColor: store.is_open ? GREEN : '#EF4444' }]} />
              <Text style={[styles.statusText, { color: store.is_open ? DARK_GREEN : '#DC2626' }]}>
                {store.is_open ? 'Buka' : 'Tutup'}
              </Text>
            </View>
            <Text style={styles.heroStoreName}>{store.name}</Text>
            <View style={styles.heroMeta}>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.heroMetaText}>4.8</Text>
              {distanceKm !== null && (
                <>
                  <Text style={styles.heroMetaDot}>·</Text>
                  <Clock size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroMetaText}>
                    {durationMin ? formatDuration(durationMin) : '-'}
                  </Text>
                  <Text style={styles.heroMetaDot}>·</Text>
                  <MapPin size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroMetaText}>{formatDistance(distanceKm)}</Text>
                </>
              )}
              {distanceKm === null && (
                <>
                  <Text style={styles.heroMetaDot}>·</Text>
                  <MapPin size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroMetaText} numberOfLines={1}>{store.address || 'Lokasi toko'}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Menu Tersedia</Text>

          {foods.length === 0 ? (
            <View style={styles.emptyMenu}>
              <Text style={{ fontSize: 48 }}>🍱</Text>
              <Text style={styles.emptyText}>Belum ada menu di toko ini</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {foods.map(food => {
                const qty = cart[food.id]?.qty || 0;
                return (
                  <View key={food.id} style={styles.foodCard}>
                    <Pressable onPress={() => router.push(`/food/${food.id}` as any)}>
                      <View style={styles.foodImgWrap}>
                        {food.image
                          ? <Image source={{ uri: storageUrl(food.image)! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                          : <Text style={{ fontSize: 28 }}>🍱</Text>}
                        {!food.is_available && (
                          <View style={styles.soldOutOverlay}>
                            <Text style={styles.soldOutText}>Habis</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName} numberOfLines={2}>{food.name}</Text>
                        <Text style={styles.foodPrice}>Rp {Number(food.price).toLocaleString('id-ID')}</Text>
                      </View>
                    </Pressable>

                    {food.is_available && (
                      <View style={styles.foodAction}>
                        {qty > 0 ? (
                          <View style={styles.qtyRow}>
                            <Pressable style={styles.qtyBtnSm} onPress={() => updateCart(food, -1)}>
                              <Minus size={14} color={GREEN} />
                            </Pressable>
                            <Text style={styles.qtyNum}>{qty}</Text>
                            <Pressable style={[styles.qtyBtnSm, { backgroundColor: GREEN }]} onPress={() => updateCart(food, 1)}>
                              <Plus size={14} color="#fff" />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable style={styles.addBtn} onPress={() => updateCart(food, 1)}>
                            <Plus size={14} color="#fff" />
                            <Text style={styles.addBtnText}>Tambah</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cart Bar */}
      {cartCount > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartLeft}>
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
            <View>
              <Text style={styles.cartLabel}>{cartCount} item dipilih</Text>
              <Text style={styles.cartTotal}>
                Rp {cartTotal.toLocaleString('id-ID')}
                {deliveryFee !== null && (
                  <Text style={styles.cartDelivery}> + Rp {deliveryFee.toLocaleString('id-ID')} ongkir</Text>
                )}
              </Text>
            </View>
          </View>
          <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
            <ShoppingCart size={16} color="#fff" />
            <Text style={styles.checkoutText}>Checkout</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F7F8FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero
  heroWrap: { height: 280, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroHeader: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  heroInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  heroStoreName: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 8 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  heroMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  heroMetaDot: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

  // Menu
  menuSection: { padding: 20 },
  menuTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16, letterSpacing: -0.3 },
  emptyMenu: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  foodCard: { width: '47.5%', backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  foodImgWrap: { height: 120, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  soldOutOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  soldOutText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  foodInfo: { padding: 10 },
  foodName: { fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 18, marginBottom: 4 },
  foodPrice: { fontSize: 13, fontWeight: '800', color: DARK_GREEN },
  foodAction: { paddingHorizontal: 10, paddingBottom: 10 },
  addBtn: { backgroundColor: GREEN, borderRadius: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', borderRadius: 10, padding: 4 },
  qtyBtnSm: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 14, fontWeight: '800', color: '#111827' },

  // Cart bar
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#111827',
    paddingHorizontal: 20, paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
  },
  cartLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cartLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  cartTotal: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cartDelivery: { fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.6)' },
  checkoutBtn: { backgroundColor: GREEN, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkoutText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
