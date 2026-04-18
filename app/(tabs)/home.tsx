import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Utensils, Bike, Car, Package, Grid, MapPin, ChevronRight, Star, HandHelping } from 'lucide-react-native';
import api from '../../lib/api';
import { storageUrl } from '../../lib/storage';
import { useAuthStore } from '../../lib/authStore';
import { HomeSection, HomeSectionItem } from '../../types';

const GREEN = '#2ECC71';
const DARK_GREEN = '#22A85A';

const SERVICE_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  // by slug
  food:     { icon: Utensils,    color: '#F97316', bg: '#FFF7ED' },
  ojek:     { icon: Bike,        color: '#2ECC71', bg: '#F0FDF4' },
  car:      { icon: Car,         color: '#3B82F6', bg: '#EFF6FF' },
  delivery: { icon: Package,     color: '#A855F7', bg: '#FAF5FF' },
  nitah:    { icon: HandHelping, color: '#EC4899', bg: '#FDF2F8' },
  // by title lowercase as fallback
  'pesan makanan': { icon: Utensils,    color: '#F97316', bg: '#FFF7ED' },
  'mobil':         { icon: Car,         color: '#3B82F6', bg: '#EFF6FF' },
  'kirim paket':   { icon: Package,     color: '#A855F7', bg: '#FAF5FF' },
};

const getServiceCfg = (slug: string, title: string) =>
  SERVICE_ICONS[slug] ?? SERVICE_ICONS[title?.toLowerCase()] ?? { icon: Grid, color: GREEN, bg: '#F0FDF4' };

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
      data.sort((a: HomeSection, b: HomeSection) => a.order - b.order);
      setSections(data);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator size="large" color={GREEN} />
    </SafeAreaView>
  );

  const renderBanner = (section: HomeSection) => {
    if (!section.items?.length) return null;
    return (
      <View key={section.id} style={{ marginBottom: 8 }}>
        <FlatList
          data={section.items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id}
          snapToInterval={300}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable style={styles.bannerItem}>
              {item.image ? (
                <Image source={{ uri: storageUrl(item.image)! }} style={styles.bannerImage} resizeMode="cover" />
              ) : (
                <View style={[styles.bannerImage, { backgroundColor: DARK_GREEN, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{item.title}</Text>
                </View>
              )}
              <View style={styles.bannerOverlay}>
                <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  };

  const renderServices = (section: HomeSection) => {
    if (!section.items?.length) return null;
    return (
      <View key={section.id} style={styles.section}>
        {section.title && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        <View style={styles.servicesGrid}>
          {section.items.map(item => {
            const slug = item.action_value || '';
            const cfg = getServiceCfg(slug, item.title ?? '');
            const IconComp = cfg.icon;
            return (
              <Pressable key={item.id} style={styles.serviceItem} onPress={() => router.push(`/service/${slug}` as any)}>
                <View style={[styles.serviceIcon, { backgroundColor: cfg.bg }]}>
                  <IconComp size={26} color={cfg.color} />
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
    if (!section.items?.length) return null;
    return (
      <View key={section.id} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Pressable style={styles.seeAllBtn} onPress={() => router.push('/stores' as any)}>
            <Text style={styles.seeAll}>Lihat semua</Text>
            <ChevronRight size={14} color={DARK_GREEN} />
          </Pressable>
        </View>
        <FlatList
          data={section.items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={s => s.id}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <Pressable style={styles.storeCard} onPress={() => router.push(`/store/${item.action_value}` as any)}>
              <View style={styles.storeImgWrap}>
                {item.image
                  ? <Image source={{ uri: storageUrl(item.image)! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <Text style={{ fontSize: 32 }}>🍽️</Text>}
                <View style={styles.storeBadge}>
                  <View style={styles.storeBadgeDot} />
                  <Text style={styles.storeBadgeText}>Buka</Text>
                </View>
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.storeAddr} numberOfLines={1}>{item.subtitle}</Text>
                <View style={styles.storeRating}>
                  <Star size={11} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>4.8</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  };

  const renderFoods = (section: HomeSection) => {
    if (!section.items?.length) return null;
    return (
      <View key={section.id} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Pressable style={styles.seeAllBtn} onPress={() => router.push('/foods' as any)}>
            <Text style={styles.seeAll}>Lihat semua</Text>
            <ChevronRight size={14} color={DARK_GREEN} />
          </Pressable>
        </View>
        <FlatList
          data={section.items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={f => f.id}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <Pressable style={styles.foodCard} onPress={() => router.push(`/food/${item.action_value}` as any)}>
              <View style={styles.foodImgWrap}>
                {item.image
                  ? <Image source={{ uri: storageUrl(item.image)! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <Text style={{ fontSize: 28 }}>🍱</Text>}
              </View>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.foodPrice}>{item.subtitle}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  };

  const renderPromo = (section: HomeSection) => {
    if (!section.items?.length) return null;
    return (
      <View key={section.id} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        {section.items.map((item: HomeSectionItem) => (
          <Pressable key={item.id} style={styles.promoBanner}>
            <View style={styles.promoLeft}>
              <View style={styles.promoTag}><Text style={styles.promoTagText}>PROMO</Text></View>
              <Text style={styles.promoTitle}>{item.title}</Text>
              <Text style={styles.promoSub} numberOfLines={2}>{item.subtitle}</Text>
            </View>
            {item.image
              ? <Image source={{ uri: storageUrl(item.image)! }} style={styles.promoImg} resizeMode="cover" />
              : <Text style={{ fontSize: 36 }}>✨</Text>}
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={GREEN} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                {user ? `Halo, ${user.name?.split(' ')[0]} 👋` : 'Halo, Teman Push 👋'}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.locationText}>
                  {user?.address ? user.address.split(',')[0] : 'Atur lokasi kamu'}
                </Text>
              </View>
            </View>
            <View style={styles.logoWrap}>
              <Image source={require('../../assets/images/push.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
            </View>
          </View>

          {/* Search */}
          <Pressable style={styles.searchBar} onPress={() => router.push('/search')}>
            <Search size={16} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>Cari layanan, toko, makanan...</Text>
          </Pressable>
        </View>

        {/* Sections */}
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
  flex: { flex: 1, backgroundColor: '#F7F8FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },

  // Header
  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  logoWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchPlaceholder: { flex: 1, color: '#9CA3AF', fontSize: 14 },

  content: { paddingTop: 20, paddingHorizontal: 20 },

  // Section
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { color: DARK_GREEN, fontSize: 13, fontWeight: '700' },

  // Services
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceItem: { width: '23%', alignItems: 'center' },
  serviceIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  serviceLabel: { fontSize: 11, textAlign: 'center', color: '#374151', fontWeight: '600', lineHeight: 15 },

  // Banner
  bannerItem: { width: 300, height: 150, borderRadius: 20, overflow: 'hidden' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.3)', padding: 12 },
  bannerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Store
  storeCard: { width: 160, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  storeImgWrap: { height: 100, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  storeBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, gap: 4 },
  storeBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  storeBadgeText: { fontSize: 10, fontWeight: '700', color: DARK_GREEN },
  storeInfo: { padding: 10 },
  storeName: { fontWeight: '700', color: '#111827', fontSize: 13 },
  storeAddr: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  storeRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#374151' },

  // Food
  foodCard: { width: 140, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  foodImgWrap: { height: 100, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  foodInfo: { padding: 10 },
  foodName: { fontWeight: '700', color: '#111827', fontSize: 12, lineHeight: 17 },
  foodPrice: { color: DARK_GREEN, fontWeight: '800', fontSize: 13, marginTop: 4 },

  // Promo
  promoBanner: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  promoLeft: { flex: 1, paddingRight: 12 },
  promoTag: { backgroundColor: '#DCFCE7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  promoTagText: { color: DARK_GREEN, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  promoTitle: { fontWeight: '800', color: '#111827', fontSize: 15 },
  promoSub: { color: '#6B7280', fontSize: 12, marginTop: 4, lineHeight: 17 },
  promoImg: { width: 70, height: 70, borderRadius: 14 },
});
