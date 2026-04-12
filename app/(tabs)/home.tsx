import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { HomeSection, HomeSectionItem } from '../../types';

const GREEN = '#2ECC71';
const DARK_GREEN = '#27AE60';

const SERVICE_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  food: { icon: 'fast-food-outline', color: '#F97316', bg: '#FFF7ED' },
  ojek: { icon: 'bicycle-outline', color: '#2ECC71', bg: '#F0FDF4' },
  car: { icon: 'car-outline', color: '#3B82F6', bg: '#EFF6FF' },
  delivery: { icon: 'cube-outline', color: '#A855F7', bg: '#FAF5FF' },
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const homeRes = await api.get('/home');
      let data = homeRes.data.data || [];

      // Sort sections by order
      data.sort((a: HomeSection, b: HomeSection) => a.order - b.order);
      setSections(data);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={GREEN} /></SafeAreaView>;

  const renderBanner = (section: HomeSection) => {
    if (!section.items || section.items.length === 0) return null;
    return (
      <View key={section.id} style={styles.section}>
        <FlatList
          data={section.items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id}
          snapToInterval={336}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <Pressable style={styles.bannerItem}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.bannerImage} resizeMode="cover" />
              ) : (
                <View style={[styles.bannerImage, { backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.title}</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      </View>
    );
  };

  const renderServices = (section: HomeSection) => {
    if (!section.items || section.items.length === 0) return null;
    return (
      <View key={section.id} style={styles.section}>
        {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
        <View style={styles.servicesGrid}>
          {section.items.map(item => {
            const slug = item.action_value || '';
            const cfg = SERVICE_ICONS[slug] ?? { icon: 'apps-outline', color: GREEN, bg: '#F0FDF4' };
            return (
              <Pressable key={item.id} style={styles.serviceItem} onPress={() => router.push(`/service/${slug}` as any)}>
                <View style={[styles.serviceIcon, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={28} color={cfg.color} />
                </View>
                <Text style={styles.serviceLabel} numberOfLines={2}>{item.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderStores = (section: HomeSection) => {
    if (!section.items || section.items.length === 0) return null;
    return (
      <View key={section.id} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.seeAll}>Lihat semua</Text>
        </View>
        <FlatList data={section.items} horizontal showsHorizontalScrollIndicator={false} keyExtractor={s => s.id}
          renderItem={({ item }) => (
            <Pressable style={styles.storeCard} onPress={() => router.push(`/store/${item.action_value}` as any)}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.storeImg} resizeMode="cover" />
              ) : (
                <View style={styles.storeImg}><Text style={{ fontSize: 32 }}>🍽️</Text></View>
              )}
              <View style={styles.storeInfo}>
                <Text style={styles.storeName} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.storeAddr} numberOfLines={1}>{item.subtitle}</Text>
                <View style={styles.storeStatus}>
                  <View style={[styles.dot, { backgroundColor: GREEN }]} />
                  <Text style={[styles.statusTxt, { color: DARK_GREEN }]}>Buka</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  };

  const renderFoods = (section: HomeSection) => {
    if (!section.items || section.items.length === 0) return null;
    return (
      <View key={section.id} style={[styles.section, { paddingBottom: 10 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.seeAll}>Lihat semua</Text>
        </View>
        <FlatList data={section.items} horizontal showsHorizontalScrollIndicator={false} keyExtractor={f => f.id}
          renderItem={({ item }) => (
            <Pressable style={styles.foodCard} onPress={() => router.push(`/food/${item.action_value}` as any)}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.foodImg} resizeMode="cover" />
              ) : (
                <View style={styles.foodImg}><Text style={{ fontSize: 28 }}>🍱</Text></View>
              )}
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.foodPrice}>{item.subtitle}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  };

  const renderPromo = (section: HomeSection) => {
    if (!section.items || section.items.length === 0) return null;
    return (
      <View key={section.id} style={styles.section}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.items.map((item: HomeSectionItem) => (
          <Pressable key={item.id} style={styles.promoBanner}>
            <View style={styles.promoLeft}>
              <Text style={styles.promoTitle}>{item.title}</Text>
              <Text style={styles.promoSub}>{item.subtitle}</Text>
            </View>
            {item.image ? (
              <Image source={{ uri: item.image }} style={{ width: 60, height: 40, borderRadius: 8 }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 30 }}>✨</Text>
            )}
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={GREEN} />}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.owlBadge}>
                <Image source={require('../../assets/images/siri.png')} style={{ width: 26, height: 26 }} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0]}!</Text>
                <Text style={styles.subGreeting}>Mau ke mana hari ini?</Text>
              </View>
            </View>
          </View>

          {/* Search bar */}
          <Pressable style={styles.searchBar} onPress={() => router.push('/search')}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>Cari layanan, toko, atau makanan...</Text>
            <Ionicons name="options-outline" size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        <View style={styles.content}>
          {sections.map(section => {
            if (!section.is_active) return null;
            switch (section.type) {
              case 'banner': return renderBanner(section);
              case 'service_list': return renderServices(section);
              case 'store_list': return renderStores(section);
              case 'food_list': return renderFoods(section);
              case 'promo': return renderPromo(section);
              default: return null;
            }
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FFF8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FFF8' },
  header: { backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  owlBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  greeting: { color: '#fff', fontSize: 18, fontWeight: '700' },
  subGreeting: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  searchPlaceholder: { flex: 1, color: '#9CA3AF', fontSize: 14 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  serviceItem: { width: '23%', alignItems: 'center', paddingVertical: 8 },
  serviceIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  serviceLabel: { fontSize: 11, textAlign: 'center', color: '#374151', fontWeight: '500' },
  section: { marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  seeAll: { color: DARK_GREEN, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  bannerItem: { width: 320, height: 140, borderRadius: 16, overflow: 'hidden', marginRight: 16 },
  bannerImage: { width: '100%', height: '100%' },
  promoBanner: { backgroundColor: '#ECFDF5', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  promoLeft: { flex: 1, paddingRight: 10 },
  promoTitle: { fontWeight: '700', color: DARK_GREEN, fontSize: 15 },
  promoSub: { color: '#6B7280', fontSize: 13, marginTop: 4 },
  storeCard: { backgroundColor: '#fff', borderRadius: 14, marginRight: 12, width: 160, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  storeImg: { height: 90, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  storeInfo: { padding: 10 },
  storeName: { fontWeight: '600', color: '#1F2937', fontSize: 13 },
  storeAddr: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  storeStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  statusTxt: { fontSize: 11, fontWeight: '600' },
  foodCard: { backgroundColor: '#fff', borderRadius: 14, marginRight: 12, width: 140, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  foodImg: { height: 90, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  foodInfo: { padding: 10 },
  foodName: { fontWeight: '600', color: '#1F2937', fontSize: 13 },
  foodPrice: { color: DARK_GREEN, fontWeight: '700', fontSize: 13, marginTop: 4 },
});
