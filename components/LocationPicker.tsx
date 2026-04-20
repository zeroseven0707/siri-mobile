import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable,
  StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X, MapPin, Navigation, Check, Search } from 'lucide-react-native';
import * as Location from 'expo-location';

const GREEN = '#2ECC71';

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface Props {
  visible: boolean;
  title?: string;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (loc: PickedLocation) => void;
  onClose: () => void;
}

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker({
  visible, title = 'Pilih Lokasi',
  initialLat = -6.2, initialLng = 106.8,
  onConfirm, onClose,
}: Props) {
  const webRef = useRef<WebView>(null);
  const [center, setCenter] = useState({ lat: initialLat, lng: initialLng });
  const [address, setAddress] = useState('');
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [gettingGPS, setGettingGPS] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Search lokasi via Nominatim
  const searchLocation = async (query: string) => {
    if (!query.trim() || query.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    setSearching(true);
    
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=id&accept-language=id`;
      
      const res = await fetch(url, { 
        headers: { 'User-Agent': 'SiriApp/1.0' } 
      });
      
      const data = await res.json();
      
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch (err) {
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setSearching(false);
    }
  };

  // Auto search dengan debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        searchLocation(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length >= 3) {
      searchLocation(searchQuery);
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setCenter({ lat, lng });
    setAddress(result.display_name);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
    Keyboard.dismiss();
    
    // Move map to selected location
    webRef.current?.injectJavaScript(
      `map.setView([${lat},${lng}],16,{animate:true});true;`
    );
  };

  // Reverse geocode via Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddr(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = await res.json();
      setAddress(data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setLoadingAddr(false);
    }
  };

  const handleGPS = async () => {
    setGettingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setCenter({ lat: latitude, lng: longitude });
      webRef.current?.injectJavaScript(
        `map.setView([${latitude},${longitude}],16,{animate:true});true;`
      );
      reverseGeocode(latitude, longitude);
    } finally {
      setGettingGPS(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({ latitude: center.lat, longitude: center.lng, address });
  };

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body,#map{width:100%;height:100%;}
    .leaflet-control-attribution{display:none;}
    #pin{
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-100%);
      z-index:1000;pointer-events:none;
    }
    #pin svg{filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3));}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="pin">
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.15 18 26 18 26s18-13.85 18-26C36 8.06 27.94 0 18 0z" fill="${GREEN}"/>
      <circle cx="18" cy="18" r="7" fill="white"/>
    </svg>
  </div>
  <script>
    var map = L.map('map',{zoomControl:true,attributionControl:false})
      .setView([${initialLat},${initialLng}],15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

    function sendCenter(){
      var c = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({lat:c.lat,lng:c.lng}));
    }

    map.on('moveend', sendCenter);
    sendCenter();
  </script>
</body>
</html>`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.flex}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={s.title}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search Bar */}
        <View style={s.searchContainer}>
          <View style={s.searchBar}>
            <Search size={16} color="#9CA3AF" />
            <TextInput
              style={s.searchInput}
              placeholder="Cari alamat, tempat, atau landmark..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color={GREEN} />}
            {searchQuery.length > 0 && !searching && (
              <TouchableOpacity onPress={() => { 
                setSearchQuery(''); 
                setShowResults(false); 
                setSearchResults([]); 
              }}>
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <Text style={s.hintText}>Ketik minimal 3 karakter untuk mencari</Text>
          )}
        </View>

        {/* Map Container with Overlay Results */}
        <View style={s.mapContainer}>
          {/* Map */}
          <WebView
            ref={webRef}
            source={{ html }}
            style={s.map}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            scrollEnabled={false}
            onMessage={(e) => {
              try {
                const { lat, lng } = JSON.parse(e.nativeEvent.data);
                setCenter({ lat, lng });
                reverseGeocode(lat, lng);
              } catch { }
            }}
          />

          {/* Search Results Overlay - Absolute positioned */}
          {showResults && searchResults.length > 0 && (
            <View style={s.resultsOverlay}>
              <ScrollView 
                style={s.resultsList} 
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {searchResults.map((result) => (
                  <TouchableOpacity
                    key={result.place_id}
                    style={s.resultItem}
                    onPress={() => selectSearchResult(result)}
                    activeOpacity={0.7}
                  >
                    <MapPin size={16} color={GREEN} />
                    <Text style={s.resultText} numberOfLines={2}>
                      {result.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {showResults && searchResults.length === 0 && !searching && searchQuery.length >= 3 && (
            <View style={s.noResultsOverlay}>
              <Text style={s.noResultsText}>Tidak ada hasil untuk "{searchQuery}"</Text>
            </View>
          )}

          {/* GPS button */}
          <TouchableOpacity style={s.gpsBtn} onPress={handleGPS} disabled={gettingGPS}>
            {gettingGPS
              ? <ActivityIndicator size="small" color={GREEN} />
              : <Navigation size={20} color={GREEN} />}
          </TouchableOpacity>
        </View>

        {/* Address bar + confirm */}
        <View style={s.bottom}>
          <View style={s.addrRow}>
            <MapPin size={18} color={GREEN} />
            <View style={{ flex: 1 }}>
              {loadingAddr
                ? <ActivityIndicator size="small" color="#9CA3AF" />
                : <Text style={s.addrText} numberOfLines={2}>
                    {address || `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`}
                  </Text>}
              <Text style={s.coordText}>{center.lat.toFixed(5)}, {center.lng.toFixed(5)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.confirmBtn, loadingAddr && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={loadingAddr}
          >
            <Check size={18} color="#fff" strokeWidth={2.5} />
            <Text style={s.confirmBtnText}>Pilih Lokasi Ini</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  
  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  hintText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    marginLeft: 4,
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  searchingText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  
  // Map container
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: { 
    flex: 1,
  },
  
  // Results overlay - absolute positioned over map
  resultsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    maxHeight: 250,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  noResultsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  noResultsText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  gpsBtn: {
    position: 'absolute', 
    bottom: 16, 
    right: 16,
    width: 46, 
    height: 46, 
    borderRadius: 23,
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 6,
  },
  bottom: {
    padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  addrText: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  coordText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: GREEN, borderRadius: 16, paddingVertical: 14,
    shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
