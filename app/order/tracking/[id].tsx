import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Image, Linking,
  Pressable, StyleSheet, Text, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, RefreshCw } from 'lucide-react-native';
import api from '../../../lib/api';
import LeafletMap, { LeafletMapRef, MarkerData } from '../../../components/LeafletMap';

const GREEN = '#2ECC71';
const DARK_GREEN = '#16a34a';

interface LatLng { latitude: number; longitude: number; }

const STATUS_LABEL: Record<string, string> = {
  accepted:    'Driver menuju ke toko / titik jemput',
  on_progress: 'Driver sedang menuju ke tujuan',
};

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mapRef = useRef<LeafletMapRef>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [order, setOrder] = useState<any>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [storeLocation, setStoreLocation] = useState<LatLng | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [distanceText, setDistanceText] = useState('');
  const [durationText, setDurationText] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderPollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchDriverLocation = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await api.get(`/orders/${id}/driver-location`);
      const data = res.data.data;
      setDriverInfo(data.driver);
      if (data.location) {
        const loc: LatLng = { latitude: data.location.latitude, longitude: data.location.longitude };
        const isFirst = !driverLocation;
        setDriverLocation(loc);
        if (!isFirst) {
          // Smooth move marker tanpa reload peta
          mapRef.current?.updateMarker('driver', loc.latitude, loc.longitude);
        }
        if (data.location.updated_at) {
          const d = new Date(data.location.updated_at);
          setLastUpdated(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch { }
    finally { setRefreshing(false); }
  };

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      const o = res.data.data;
      setOrder(o);
      // User location (refresh tiap 1 menit untuk deteksi fraud)
      if (o.user?.latitude && o.user?.longitude) {
        setUserLocation({ latitude: Number(o.user.latitude), longitude: Number(o.user.longitude) });
      }
      // Store location (food orders, fixed)
      if (o.store?.latitude && o.store?.longitude) {
        setStoreLocation({ latitude: Number(o.store.latitude), longitude: Number(o.store.longitude) });
      }
      // Destination
      if (o.destination_lat && o.destination_lng) {
        setDestinationLocation({ latitude: Number(o.destination_lat), longitude: Number(o.destination_lng) });
      }
    } catch { }
    finally { setLoading(false); }
  };

  const fetchRoute = async (from: LatLng, to: LatLng) => {
    try {
      const url = `http://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]) {
        setRouteCoords(data.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => ({ latitude: lat, longitude: lng })));
        const dist = data.routes[0].distance;
        const dur = data.routes[0].duration;
        setDistanceText(dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`);
        setDurationText(`~${Math.round(dur / 60)} menit`);
      }
    } catch { }
  };

  useEffect(() => {
    fetchOrder();
    fetchDriverLocation();
    // Driver: poll tiap 5 detik (realtime)
    pollTimer.current = setInterval(() => fetchDriverLocation(true), 5000);
    // User/order: poll tiap 1 menit (anti-fraud check)
    orderPollTimer.current = setInterval(() => fetchOrder(), 60000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (orderPollTimer.current) clearInterval(orderPollTimer.current);
    };
  }, [id]);

  useEffect(() => {
    if (!driverLocation || !order) return;
    if (order.status === 'on_progress' && destinationLocation) {
      fetchRoute(driverLocation, destinationLocation);
    } else if (order.status === 'accepted') {
      // Route ke store (food) atau ke pickup (ojek)
      const target = storeLocation ?? (order.pickup_lat && order.pickup_lng
        ? { latitude: Number(order.pickup_lat), longitude: Number(order.pickup_lng) }
        : null);
      if (target) fetchRoute(driverLocation, target);
    }
  }, [driverLocation, order?.status]);

  // Fit map setelah marker tersedia
  useEffect(() => {
    if (!driverLocation) return;
    const points = [
      driverLocation,
      ...(storeLocation ? [storeLocation] : []),
      ...(destinationLocation ? [destinationLocation] : []),
      ...(userLocation && !destinationLocation ? [userLocation] : []),
    ];
    setTimeout(() => mapRef.current?.fitBounds(points), 800);
  }, [driverLocation, storeLocation, destinationLocation]);

  if (loading) return (
    <SafeAreaView style={s.center} edges={['top']}>
      <ActivityIndicator size="large" color={GREEN} />
      <Text style={s.loadingText}>Memuat tracking...</Text>
    </SafeAreaView>
  );

  const statusLabel = STATUS_LABEL[order?.status] ?? 'Memproses pesanan';
  const initialLat = driverLocation?.latitude ?? userLocation?.latitude ?? -6.2;
  const initialLng = driverLocation?.longitude ?? userLocation?.longitude ?? 106.8;

  const markers: MarkerData[] = [
    ...(driverLocation ? [{
      id: 'driver',
      latitude: driverLocation.latitude,
      longitude: driverLocation.longitude,
      color: GREEN,
      label: `Driver: ${driverInfo?.name ?? ''}`,
      pulse: true,
      icon: (driverInfo?.vehicle_type === 'mobil' ? 'car' : 'bike') as any,
    }] : []),
    // Store (food orders, fixed)
    ...(storeLocation ? [{
      id: 'store',
      latitude: storeLocation.latitude,
      longitude: storeLocation.longitude,
      color: '#3B82F6',
      label: order?.store?.name ?? 'Toko',
      icon: 'pin' as any,
    }] : []),
    // Destination (tujuan akhir)
    ...(destinationLocation ? [{
      id: 'destination',
      latitude: destinationLocation.latitude,
      longitude: destinationLocation.longitude,
      color: '#EF4444',
      label: order?.destination_location ?? 'Tujuan',
      icon: 'pin' as any,
    }] : []),
    // User location (fallback jika tidak ada destination)
    ...(!destinationLocation && userLocation ? [{
      id: 'user',
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      color: '#F97316',
      label: 'Lokasi Kamu',
      icon: 'person' as any,
    }] : []),
  ];

  return (
    <View style={s.flex}>
      <LeafletMap
        ref={mapRef}
        style={s.map}
        markers={markers}
        polyline={routeCoords}
        polylineColor={GREEN}
        initialLat={initialLat}
        initialLng={initialLng}
      />

      {/* Header */}
      <SafeAreaView style={s.headerOverlay} edges={['top']}>
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#111827" />
          </Pressable>
          <View style={s.headerInfo}>
            <Text style={s.headerTitle}>{statusLabel}</Text>
            {(distanceText || durationText) && (
              <Text style={s.headerSub}>{[distanceText, durationText].filter(Boolean).join(' · ')}</Text>
            )}
          </View>
          <Pressable style={s.refreshBtn} onPress={() => fetchDriverLocation()} disabled={refreshing}>
            {refreshing
              ? <ActivityIndicator size="small" color={GREEN} />
              : <RefreshCw size={16} color={GREEN} />}
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Bottom card */}
      <View style={s.bottomCard}>
        {driverInfo && (
          <View style={s.driverRow}>
            <View style={s.driverAvatar}>
              {driverInfo.profile_picture
                ? <Image source={{ uri: driverInfo.profile_picture }} style={s.driverAvatarImg} />
                : <Text style={s.driverAvatarText}>{driverInfo.name?.[0]?.toUpperCase()}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.driverName}>{driverInfo.name}</Text>
              <Text style={s.driverVehicle}>
                {driverInfo.vehicle_type === 'mobil' ? '🚗' : '🏍️'} {driverInfo.license_plate}
              </Text>
              {lastUpdated && <Text style={s.lastUpdated}>Lokasi diperbarui {lastUpdated}</Text>}
            </View>
            {driverInfo.phone && (
              <Pressable style={s.callBtn} onPress={() => Linking.openURL(`tel:${driverInfo.phone}`)}>
                <Phone size={18} color={GREEN} />
              </Pressable>
            )}
          </View>
        )}

        {/* Progress steps */}
        <View style={s.statusBar}>
          {[
            { label: 'Diterima', done: true },
            { label: 'Dijemput', done: order?.status === 'on_progress' },
            { label: 'Tiba', done: false },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <View style={[s.statusStep, { backgroundColor: step.done ? '#DCFCE7' : '#F3F4F6' }]}>
                <Text style={[s.statusStepText, { color: step.done ? DARK_GREEN : '#9CA3AF' }]}>
                  {step.done ? '✓ ' : ''}{step.label}
                </Text>
              </View>
              {i < arr.length - 1 && <View style={s.statusLine} />}
            </React.Fragment>
          ))}
        </View>

        {!driverLocation && (
          <View style={s.noLocation}>
            <Text style={s.noLocationText}>
              Lokasi driver belum tersedia. Driver akan muncul setelah membuka peta.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: DARK_GREEN, marginTop: 1, fontWeight: '600' },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 10,
  },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  driverAvatarImg: { width: '100%', height: '100%' },
  driverAvatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  driverName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  driverVehicle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  lastUpdated: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0', alignItems: 'center', justifyContent: 'center' },
  statusBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusStep: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  statusStepText: { fontSize: 11, fontWeight: '700' },
  statusLine: { width: 16, height: 2, backgroundColor: '#E5E7EB' },
  noLocation: { backgroundColor: '#FEF9C3', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FDE68A' },
  noLocationText: { fontSize: 12, color: '#92400E', textAlign: 'center', lineHeight: 18 },
});
