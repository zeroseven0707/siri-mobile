import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Pressable,
  StyleSheet, Text, View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Navigation, User, MapPin, RefreshCw } from 'lucide-react-native';
import api from '../../../lib/api';

const GREEN = '#16a34a';

interface LatLng { latitude: number; longitude: number; }

// Fetch rute dari OSRM — return array koordinat polyline
async function fetchOsrmRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return [];
    return data.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => ({
      latitude: lat,
      longitude: lng,
    }));
  } catch {
    return [];
  }
}

export default function DriverMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [fetchingRoute, setFetchingRoute] = useState(false);
  const [distanceText, setDistanceText] = useState('');
  const [durationText, setDurationText] = useState('');

  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const routeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ambil data order
  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.data))
      .catch(() => Alert.alert('Error', 'Gagal memuat pesanan'))
      .finally(() => setLoading(false));
  }, [id]);

  // Start tracking lokasi driver tiap 1 detik
  useEffect(() => {
    let active = true;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Lokasi', 'Izinkan akses lokasi untuk fitur peta');
        return;
      }

      // Ambil lokasi awal
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (active) {
        setDriverLocation({
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
        });
      }

      // Subscribe update tiap 1 detik
      locationSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000,
          distanceInterval: 0,
        },
        (loc) => {
          if (!active) return;
          const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setDriverLocation(pos);
        }
      );
    };

    startTracking();
    return () => {
      active = false;
      locationSub.current?.remove();
    };
  }, []);

  // Fetch rute saat driver location dan order tersedia, refresh tiap 30 detik
  useEffect(() => {
    if (!driverLocation || !order) return;

    const destination = getDestination();
    if (!destination) return;

    const doFetch = async () => {
      setFetchingRoute(true);
      try {
        const url = `http://router.project-osrm.org/route/v1/driving/${driverLocation.longitude},${driverLocation.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (data.code === 'Ok' && data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => ({
            latitude: lat, longitude: lng,
          }));
          setRouteCoords(coords);
          const dist = data.routes[0].distance;
          const dur = data.routes[0].duration;
          setDistanceText(dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`);
          setDurationText(`${Math.round(dur / 60)} menit`);
        }
      } catch { }
      finally { setFetchingRoute(false); }
    };

    doFetch();
    routeTimer.current = setInterval(doFetch, 30000);
    return () => { if (routeTimer.current) clearInterval(routeTimer.current); };
  }, [order, driverLocation?.latitude?.toFixed(3), driverLocation?.longitude?.toFixed(3)]);

  // Fit map ke semua marker
  useEffect(() => {
    if (!driverLocation || !order) return;
    const destination = getDestination();
    if (!destination) return;

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        [driverLocation, destination],
        { edgePadding: { top: 80, right: 60, bottom: 180, left: 60 }, animated: true }
      );
    }, 500);
  }, [driverLocation, order]);

  const getDestination = (): LatLng | null => {
    if (!order) return null;
    // Kalau on_progress → tujuan = lokasi user
    // Kalau accepted → tujuan = pickup (toko)
    if (order.status === 'on_progress' && order.user?.latitude && order.user?.longitude) {
      return { latitude: Number(order.user.latitude), longitude: Number(order.user.longitude) };
    }
    if (order.status === 'accepted' && order.store?.latitude && order.store?.longitude) {
      return { latitude: Number(order.store.latitude), longitude: Number(order.store.longitude) };
    }
    return null;
  };

  const openGoogleMaps = () => {
    const dest = getDestination();
    if (!dest) return;
    const url = `https://maps.google.com/?q=${dest.latitude},${dest.longitude}`;
    Linking.openURL(url);
  };

  const centerOnDriver = () => {
    if (!driverLocation) return;
    mapRef.current?.animateToRegion({
      ...driverLocation,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  if (loading || !driverLocation) {
    return (
      <SafeAreaView style={s.center} edges={['top']}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={s.loadingText}>
          {loading ? 'Memuat pesanan...' : 'Mendapatkan lokasi...'}
        </Text>
      </SafeAreaView>
    );
  }

  const destination = getDestination();
  const destinationLabel = order?.status === 'on_progress' ? 'Lokasi Pelanggan' : 'Lokasi Pickup';

  return (
    <View style={s.flex}>
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={false}
        showsMyLocationButton={false}
        initialRegion={{
          ...driverLocation,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Marker driver */}
        <Marker coordinate={driverLocation} title="Posisi Kamu" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={s.driverMarker}>
            <Navigation size={18} color="#fff" />
          </View>
        </Marker>

        {/* Marker tujuan */}
        {destination && (
          <Marker coordinate={destination} title={destinationLabel}>
            <View style={s.destMarker}>
              <MapPin size={18} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Rute */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={GREEN}
            strokeWidth={4}
            lineDashPattern={undefined}
          />
        )}
      </MapView>

      {/* Header overlay */}
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
              <Text style={s.headerSub}>
                {[distanceText, durationText].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
          {fetchingRoute && <ActivityIndicator size="small" color={GREEN} style={{ marginLeft: 8 }} />}
        </View>
      </SafeAreaView>

      {/* Bottom card */}
      <View style={s.bottomCard}>
        {/* Destination info */}
        {destination && (
          <View style={s.destInfo}>
            <View style={[s.destIcon, { backgroundColor: order?.status === 'on_progress' ? '#DBEAFE' : '#FEF9C3' }]}>
              {order?.status === 'on_progress'
                ? <User size={18} color="#1D4ED8" />
                : <MapPin size={18} color="#A16207" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.destLabel}>{destinationLabel}</Text>
              <Text style={s.destAddress} numberOfLines={2}>
                {order?.status === 'on_progress'
                  ? order?.destination_location
                  : order?.pickup_location}
              </Text>
            </View>
          </View>
        )}

        {/* Action buttons */}
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

  // Header
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: '#fff', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  // Markers
  driverMarker: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
  },
  destMarker: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#EF4444', shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
  },

  // Bottom card
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
    borderRadius: 14, borderWidth: 1.5, borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  centerBtnText: { color: GREEN, fontWeight: '700', fontSize: 13 },
  mapsBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14,
    backgroundColor: '#111827',
  },
  mapsBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
