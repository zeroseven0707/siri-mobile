import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export type MarkerIcon = 'circle' | 'bike' | 'car' | 'person' | 'pin' | 'home';

export interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  label?: string;
  pulse?: boolean;
  icon?: MarkerIcon;
}

export interface LeafletMapRef {
  setView: (lat: number, lng: number, zoom?: number) => void;
  fitBounds: (points: { latitude: number; longitude: number }[], padding?: number) => void;
  updateMarker: (id: string, lat: number, lng: number) => void;
}

interface Props {
  style?: ViewStyle;
  markers?: MarkerData[];
  polyline?: { latitude: number; longitude: number }[];
  polylineColor?: string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

const LeafletMap = forwardRef<LeafletMapRef, Props>(({
  style,
  markers = [],
  polyline = [],
  polylineColor = '#2ECC71',
  initialLat = -6.2297,
  initialLng = 106.8295,
  initialZoom = 13,
}, ref) => {
  const webRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Helper to escape strings for JS injection
  const esc = (obj: any) => JSON.stringify(obj).replace(/'/g, "\\'");

  const buildMarkerScript = `
    window.buildMarkerHtml = function(m) {
      var iconType = m.icon || 'circle';
      var size = iconType === 'circle' ? 32 : 36;
      var color = m.color;
      var icons = {
        circle: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="' + color + '"/></svg>',
        bike: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1-1h-1l-5 8h7l1-4"/><path d="m9 17 3-8"/></svg>',
        car: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 9h14l-1.5-4H6.5L5 9z"/></svg>',
        person: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        pin: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="24" viewBox="0 0 24 28"><path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 20 8 20s8-14.6 8-20c0-4.4-3.6-8-8-8z" fill="' + color + '"/><circle cx="12" cy="8" r="3" fill="white"/></svg>',
        home: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
      };
      var pulseHtml = m.pulse ? '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:' + (size + 12) + 'px;height:' + (size + 12) + 'px;border-radius:50%;background:' + color + '33;animation:pulse 1.8s ease-in-out infinite;"></div>' : '';
      return '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;">' + pulseHtml + '<div style="position:relative;z-index:1;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:white;border:2.5px solid ' + color + ';box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;overflow:hidden;"><img src=\'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(icons[iconType]) + '\' width="' + (size - 12) + '" height="' + (size - 12) + '" style="display:block;" /></div></div>';
    };

    window.syncMarkers = function(markersJson) {
      var newMarkers = JSON.parse(markersJson);
      if(!window._markers) window._markers = {};
      newMarkers.forEach(function(m, idx) {
        var zIndex = m.pulse ? 1000 : 100 + idx;
        var icon = L.divIcon({ className: '', html: window.buildMarkerHtml(m), iconSize: [36, 36], iconAnchor: [18, 18] });
        if(window._markers[m.id]) {
          var marker = window._markers[m.id];
          marker.setIcon(icon);
          marker.setZIndexOffset(zIndex);
          if(m.id !== 'driver') marker.setLatLng([m.latitude, m.longitude]);
        } else {
          window._markers[m.id] = L.marker([m.latitude, m.longitude], {icon: icon, zIndexOffset: zIndex}).addTo(window.map);
          if(m.label) window._markers[m.id].bindPopup(m.label);
        }
      });
      var newIds = newMarkers.map(function(m){ return m.id; });
      Object.keys(window._markers).forEach(function(id) {
        if(newIds.indexOf(id) === -1) { window.map.removeLayer(window._markers[id]); delete window._markers[id]; }
      });
    };

    window.syncPolyline = function(coordsJson, color) {
      var coords = JSON.parse(coordsJson);
      if(window._polyline) window.map.removeLayer(window._polyline);
      if(coords.length > 1) {
        window._polyline = L.polyline(coords.map(function(p){ return [p.latitude, p.longitude]; }), {
          color: color, weight: 5, opacity: 0.85, lineJoin: 'round', lineCap: 'round'
        }).addTo(window.map);
      }
    };
  `;

  useImperativeHandle(ref, () => ({
    setView: (lat, lng, zoom = 15) => {
      webRef.current?.injectJavaScript(`window.map.setView([${lat},${lng}],${zoom},{animate:true});true;`);
    },
    fitBounds: (points, padding = 60) => {
      if (!points.length) return;
      const bounds = points.map(p => `[${p.latitude},${p.longitude}]`).join(',');
      webRef.current?.injectJavaScript(`window.map.fitBounds([${bounds}],{padding:[${padding},${padding}]});true;`);
    },
    updateMarker: (id, lat, lng) => {
      webRef.current?.injectJavaScript(`
        (function(){
          var m = window._markers && window._markers['${id}'];
          if(!m) return;
          var start = m.getLatLng();
          var end = L.latLng(${lat},${lng});
          if(start.equals(end)) return;
          var duration = 1000;
          var startTime = performance.now();
          function animate(currentTime) {
            var elapsed = currentTime - startTime;
            var t = Math.min(elapsed / duration, 1);
            var ease = t * (2 - t);
            m.setLatLng([start.lat + (end.lat - start.lat) * ease, start.lng + (end.lng - start.lng) * ease]);
            if (t < 1) requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
        })();
        true;
      `);
    },
  }));

  useEffect(() => {
    if (mapReady) {
      webRef.current?.injectJavaScript(`
        window.syncMarkers('${esc(markers)}');
        window.syncPolyline('${esc(polyline)}', '${polylineColor}');
        true;
      `);
    }
  }, [markers, polyline, polylineColor, mapReady]);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html,body{width:100%;height:100%;margin:0;padding:0;background:#eee;overflow:hidden;}
    #map{position:absolute;top:0;bottom:0;left:0;right:0;width:100%;height:100%;background:#f0f0f0;}
    .leaflet-control-attribution{display:none;}
    @keyframes pulse{
      0%{transform:translate(-50%,-50%) scale(1);opacity:0.7;}
      50%{transform:translate(-50%,-50%) scale(1.8);opacity:0.1;}
      100%{transform:translate(-50%,-50%) scale(1);opacity:0.7;}
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function() {
      function log(msg) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage('log:' + msg);
      }
      
      var initialized = false;
      function init() {
        if (initialized) return;
        log('Attempting init');
        
        try {
          if (typeof L === 'undefined') {
            log('Leaflet not ready, retrying...');
            setTimeout(init, 300);
            return;
          }
          initialized = true;
          log('Leaflet loaded, initializing map');
          
          var lat = ${Number(initialLat) || -6.2297};
          var lng = ${Number(initialLng) || 106.8295};
          var zoom = ${Number(initialZoom) || 13};
          
          window.map = L.map('map', {zoomControl:false, attributionControl:false})
            .setView([lat, lng], zoom);
            
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            crossOrigin: true
          }).addTo(window.map);
          
          window._markers = {};
          ${buildMarkerScript}
          
          log('Map ready, sending signal');
          window.ReactNativeWebView.postMessage('ready');
          
          setTimeout(function(){ window.map.invalidateSize(); }, 300);
          setTimeout(function(){ window.map.invalidateSize(); }, 1000);
        } catch (e) {
          log('Error: ' + e.message);
          document.body.innerHTML = '<div style="padding:20px;color:red;font-family:sans-serif;"><b>Map Error:</b><br/>' + e.message + '</div>';
        }
      }
      
      // Jalankan init dengan berbagai cara agar pasti terpanggil
      document.addEventListener('DOMContentLoaded', init);
      window.addEventListener('load', init);
      setTimeout(init, 500);
      setTimeout(init, 2000);
    })();
  </script>
</body>
</html>`;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webRef}
        source={{ html, baseUrl: 'https://leafletjs.com' }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        onMessage={(event) => {
          const data = event.nativeEvent.data;
          if (data === 'ready') setMapReady(true);
          else if (data.startsWith('log:')) console.log('[WebView]', data.substring(4));
        }}
        mixedContentMode="always"
        allowFileAccess
        allowUniversalAccessFromFileURLs
        onLoadEnd={() => {
          setTimeout(() => { if (!mapReady) setMapReady(true); }, 5000);
        }}
      />
      {!mapReady && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={{ marginTop: 10, color: '#6B7280', fontSize: 12, fontWeight: '600' }}>Menghubungkan Peta...</Text>
        </View>
      )}
    </View>
  );
});

export default LeafletMap;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  webview: { flex: 1 },
  loader: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', zIndex: 10 },
});
