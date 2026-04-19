import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking,
  Pressable, StyleSheet, Text, View,
} from 'react-native';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Navigation, MapPin, User } from 'lucide-react-native';
import api from '../../../lib/api';
import LeafletMap, { LeafletMapRef, MarkerData } from '../../../components/LeafletMap';

const GREEN = '#16a34a';

interface LatLng { latitude: number; longitude: number; }

export default function DriverMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mapRef = useRef<LeafletMapRef>(null);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [distanceText, setDistanceText] = useState('');
  const [durationText, setDurationText] = useState('');
  const [fetchingRoute, setFetchingRoute] = useState(false);

  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const routeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLatRef = useRef('');

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.data))
      .catch(() => Alert.alert('Error', 'Gagal memuat pesanan'))
      .finally(() => setLoading(false));
  }, [id]);

  // Tracking lokasi driver tiap 30 detik
  useEffect(() => {
    let active = true;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Lokasi', 'Izinkan akses lokasi untuk fitur peta');
        return;
      }

      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (active) {
        const pos = { latitude: initial.coords.latitude, longitude: initial.coords.longitude };
        setDriverLocation(pos);
        api.post('/driver/location', pos).catch(() => {});
      }

      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 30000, distanceInterval: 0 },
        (loc) => {
          if (!active) return;
          const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setDriverLocation(pos);
          api.post('/driver/location', pos).catch(() => {});
        }
      );
    };

    startTracking();
    return () => {
      active = false;
      locationSub.current?.remove();
    };
  }, []);

  // Fetch rute tiap 30 detik saat lokasi berubah signifikan
  useEffect(() => {
    if (!driverLocation || !order) return;
    const dest = getDestination();
    if (!dest) return;

    const key = `${driverLocation.latitude.toFixed(3)},${driverLocation.longitude.toFixed(3)}`;
    if (key === prevLatRef.current) return;
    prevLatRef.current = key;

    const doFetch = async () => {
      setFetchingRoute(true);
      try {
        const url = `http://router.project-osrm.org/route/v1/driving/${driverLocation.longitude},${driverLocation.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (data.code === 'Ok' && data.routes?.[0]) {
          setRouteCoords(data.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => ({ latitude: lat, longitude: lng })));
          const dist = data.routes[0].distance;
          const dur = data.routes[0].duration;
          setDistanceText(dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`);
          setDurationText(`${Math.round(dur / 60)} menit`);
        }
      } catch { }
      finally { setFetchingRoute(false); }
    };

    doFetch();
    if (routeTimer.current) clearInterval(routeTimer.current);
    routeTimer.current = setInterval(doFetch, 30000);
    return () => { if (routeTimer.current) clearInterval(routeTimer.current); };
  }, [order, driverLocation?.latitude?.toFixed(3)]);

  // Fit map setelah semua marker tersedia
  useEffect(() => {
    if (!driverLocation) return;
    const dest = getDestination();
    const points = [driverLocation, ...(dest ? [dest] : [])];
    setTimeout(() => mapRef.current?.fitBounds(points), 800);
  }, [driverLocation, order]);

  const getDestination = (): LatLng | null => {
    if (!order) return null;
    if (order.status === 'on_progress' && order.user?.latitude && order.user?.longitude) {
      return { latitude: Number(order.user.latitude), longitude: Number(order.user.longitude) };
    }
    return null;
  };

  const openGoogleMaps = () => {
    const dest = getDestination();
    if (!dest) return;
    Linking.openURL(`https://maps.google.com/?q=${dest.latitude},${dest.longitude}`);
  };

  const centerOnDriver = () => {
    if (!driverLocation) return;
    mapRef.current?.setView(driverLocation.latitude, driverLocation.longitude, 16);
  };

  if (loading || !driverLocation) {
    return (
      <SafeAreaView style={s.center} edges={['top']}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={s.loadingText}>{loading ? 'Memuat pesanan...' : 'Mendapatkan lokasi...'}</Text>
      </SafeAreaView>
    );
  }

  const dest = getDestination();
  const markers: MarkerData[] = [
    { id: 'driver', latitude: driverLocation.latitude, longitude: driverLocation.longitude, color: GREEN, label: 'Posisi Kamu', pulse: true },
    ...(dest ? [{ id: 'dest', latitude: dest.latitude, longitude: dest.longitude, color: '#EF4444', label: order?.status === 'on_progress' ? 'Lokasi Pelanggan' : 'Pickup' }] : []),
  ];

  return (
    <View style={s.flex}>
      <LeafletMap
        ref={mapRef}
        style={s.map}
        markers={markers}
        polyline={routeCoords}
        polylineColor={GREEN}
        initialLat={driverLocation.latitude}
        initialLng={driverLocation.longitude}
      />

      {/* Header */}
      <SafeAreaView style={s.headerOverlay} edges={['top']}>
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#111827" />
          </Pressable>
          <View style={s.headerInfo}>
            <Text style={s.headerTitle}>
              {order?.status === 'on_progress' ? 'Menuju Pelanggan' : 'Menuju Pickup'}
            </Text>
            {(distanceText || durationText) && (
              <Text style={s.headerSub}>{[distanceText, durationText].filter(Boolean).join(' · ')}</Text>
            )}
          </View>
          {fetchingRoute && <ActivityIndicator size="small" color={GREEN} style={{ marginLeft: 8 }} />}
        </View>
      </SafeAreaView>

      {/* Bottom card */}
      <View style={s.bottomCard}>
        {dest && (
          <View style={s.destInfo}>
            <View style={[s.destIcon, { backgroundColor: order?.status === 'on_progress' ? '#DBEAFE' : '#FEF9C3' }]}>
              {order?.status === 'on_progress' ? <User size={18} color="#1D4ED8" /> : <MapPin size={18} color="#A16207" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.destLabel}>{order?.status === 'on_progress' ? 'Lokasi Pelanggan' : 'Lokasi Pickup'}</Text>
              <Text style={s.destAddress} numberOfLines={2}>
                {order?.status === 'on_progress' ? order?.destination_location : order?.pickup_location}
              </Text>
            </View>
          </View>
        )}
        <View style={s.actions}>
          <Pressable style={s.centerBtn} onPress={centerOnDriver}>
            <Navigation size={18} color={GREEN} />
            <Text style={s.centerBtnText}>Lokasiku</Text>
          </Pressable>
          <Pressable style={s.mapsBtn} onPress={openGoogleMaps}>
            <Text style={s.mapsBtnText}>Buka Google Maps</Text>
          </Pressable>
        </View>
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
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 10,
  },
  destInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  destIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  destLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  destAddress: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10 },
  centerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4',
  },
  centerBtnText: { color: GREEN, fontWeight: '700', fontSize: 13 },
  mapsBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: '#111827' },
  mapsBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
