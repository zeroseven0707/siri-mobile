import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { FoodItem, Store, Service } from '../../types';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

type CartItem = FoodItem & { qty: number };

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get(`/stores/${id}`);
        setStore(res.data.data);
        setFoods(res.data.data.food_items || []);
      } catch (err) {
        Alert.alert('Error', 'Gagal memuat detail toko');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStore();
  }, [id]);

  const updateCart = (food: FoodItem, delta: number) => {
    setCart((prev) => {
      const currentQty = prev[food.id]?.qty || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newCart = { ...prev };
      if (newQty === 0) {
        delete newCart[food.id];
      } else {
        newCart[food.id] = { ...food, qty: newQty };
      }
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
  };

  const handleCreateOrder = () => {
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) return;
    
    router.push({
      pathname: '/checkout/food',
      params: {
        storeId: id,
        storeName: store?.name,
        storeAddress: store?.address,
        cartItems: JSON.stringify(cartItems)
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Toko tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

  const cartItemsCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = calculateTotal();

  return (
    <>
      <Stack.Screen options={{ 
        title: store.name, 
        headerStyle: { backgroundColor: GREEN }, 
        headerTintColor: '#fff',
      }} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            {store.image ? (
                <Image source={{ uri: store.image }} style={styles.storeHeroImage} />
            ) : (
                <View style={styles.storeIcon}><Text style={{fontSize: 40}}>🍽️</Text></View>
            )}
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeAddress}>{store.address}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{store.is_open ? 'Buka' : 'Tutup'}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Menu Tersedia</Text>
          {foods.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada menu di toko ini.</Text>
          ) : (
            <View style={styles.gridContainer}>
              {foods.map((food) => {
                const qty = cart[food.id]?.qty || 0;
                const ItemView = View as any;
                return (
                  <ItemView key={food.id} style={styles.foodCard}>
                    <Pressable style={{ flex: 1 }} onPress={() => router.push(`/food/${food.id}` as any)}>
                      {food.image ? (
                        <Image source={{ uri: food.image }} style={styles.foodImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.foodImage, { backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 30 }}>🍱</Text>
                        </View>
                      )}
                      <View style={styles.foodCardInfo}>
                        <Text style={styles.foodName} numberOfLines={2}>{food.name}</Text>
                        <Text style={styles.foodPrice}>Rp {Number(food.price).toLocaleString('id-ID')}</Text>
                      </View>
                    </Pressable>
                    <View style={styles.actionContainer}>
                      {food.is_available ? (
                        qty > 0 ? (
                          <View style={styles.qtyControls}>
                            <Pressable style={styles.btnSm} onPress={() => updateCart(food, -1)}>
                              <Ionicons name="remove" size={16} color="#fff" />
                            </Pressable>
                            <Text style={styles.qtyText}>{qty}</Text>
                            <Pressable style={styles.btnSm} onPress={() => updateCart(food, 1)}>
                              <Ionicons name="add" size={16} color="#fff" />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable style={styles.btnAdd} onPress={() => updateCart(food, 1)}>
                            <Text style={styles.btnAddText}>Tambah</Text>
                          </Pressable>
                        )
                      ) : (
                        <Text style={styles.unavailableText}>Habis</Text>
                      )}
                    </View>
                  </ItemView>
                );
              })}
            </View>
          )}
        </ScrollView>

        {cartItemsCount > 0 && (
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.cartInfo}>{cartItemsCount} item</Text>
              <Text style={styles.cartTotal}>Rp {totalPrice.toLocaleString('id-ID')}</Text>
            </View>
            <Pressable 
              style={[styles.btnOrder, isSubmitting && { opacity: 0.7 }]} 
              onPress={handleCreateOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnOrderText}>Pesan Sekarang</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 1 },
  storeIcon: { width: 80, height: 80, backgroundColor: '#E5E7EB', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  storeHeroImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  storeName: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  storeAddress: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 12 },
  badge: { backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: DARK_GREEN, fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  emptyText: { color: '#6B7280', fontStyle: 'italic' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 5 },
  foodCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, overflow: 'hidden' },
  foodImage: { width: '100%', height: 120, backgroundColor: '#FFF7ED' },
  foodCardInfo: { padding: 12, flex: 1 },
  foodName: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 6, lineHeight: 18 },
  foodPrice: { fontSize: 13, fontWeight: 'bold', color: DARK_GREEN },
  actionContainer: { paddingHorizontal: 12, paddingBottom: 12, alignItems: 'center' },
  btnAdd: { backgroundColor: GREEN, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  btnAddText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 6, width: '100%' },
  btnSm: { backgroundColor: GREEN, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, elevation: 2 },
  qtyText: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  unavailableText: { color: '#EF4444', fontWeight: 'bold', fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB', elevation: 4 },
  cartInfo: { fontSize: 13, color: '#6B7280' },
  cartTotal: { fontSize: 18, fontWeight: 'bold', color: DARK_GREEN },
  btnOrder: { backgroundColor: GREEN, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, flexDirection: 'row', alignItems: 'center' },
  btnOrderText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
