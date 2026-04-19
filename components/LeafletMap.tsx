import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  color: string;       // hex color
  label?: string;
  pulse?: boolean;     // animasi pulse
}

export interface LeafletMapRef {
  setView: (lat: number, lng: number, zoom?: number) => void;
  fitBounds: (points: { latitude: number; longitude: number }[]) => void;
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
  initialLat = -6.2,
  initialLng = 106.8,
  initialZoom = 13,
}, ref) => {
  const webRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    setView: (lat, lng, zoom = 15) => {
      webRef.current?.injectJavaScript(`map.setView([${lat}, ${lng}], ${zoom}); true;`);
    },
    fitBounds: (points) => {
      if (!points.length) return;
      const bounds = points.map(p => `[${p.latitude}, ${p.longitude}]`).join(',');
      webRef.current?.injectJavaScript(`map.fitBounds([${bounds}], {padding: [60, 60]}); true;`);
    },
  }));

  const markersJs = markers.map(m => {
    const pulseStyle = m.pulse ? `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.6); opacity: 0.2; }
        100% { transform: scale(1); opacity: 0.8; }
      }
    ` : '';
    const pulseDiv = m.pulse ? `
      <div style="
        position:absolute; top:50%; left:50%;
        transform:translate(-50%,-50%);
        width:40px; height:40px; border-radius:50%;
        background:${m.color}40;
        animation: pulse 1.6s infinite;
      "></div>
    ` : '';

    return `
      (function() {
        var icon = L.divIcon({
          className: '',
          html: '<div style="position:relative;width:36px;height:36px;">' +
            '${pulseDiv.replace(/\n/g, '').replace(/'/g, "\\'")}' +
            '<div style="' +
              'position:absolute;top:50%;left:50%;' +
              'transform:translate(-50%,-50%);' +
              'width:36px;height:36px;border-radius:50%;' +
              'background:${m.color};' +
              'border:3px solid white;' +
              'box-shadow:0 2px 8px rgba(0,0,0,0.3);' +
              'display:flex;align-items:center;justify-content:center;' +
            '"></div>' +
          '</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        L.marker([${m.latitude}, ${m.longitude}], {icon: icon})
          .addTo(map)
          ${m.label ? `.bindPopup('${m.label.replace(/'/g, "\\'")}')` : ''};
      })();
    `;
  }).join('\n');

  const polylineJs = polyline.length > 1 ? `
    L.polyline([${polyline.map(p => `[${p.latitude},${p.longitude}]`).join(',')}], {
      color: '${polylineColor}',
      weight: 5,
      opacity: 0.85,
    }).addTo(map);
  ` : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-control-attribution { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${initialLat}, ${initialLng}], ${initialZoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);
    ${markersJs}
    ${polylineJs}
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
      />
    </View>
  );
});

export default LeafletMap;

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
