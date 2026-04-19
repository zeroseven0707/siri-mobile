import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export type MarkerIcon = 'circle' | 'bike' | 'car' | 'person' | 'pin';

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

// SVG icons sebagai string (inline di HTML)
const ICONS: Record<MarkerIcon, (color: string) => string> = {
  circle: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${c}"/></svg>`,
  bike: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1-1h-1l-5 8h7l1-4"/><path d="m9 17 3-8"/></svg>`,
  car: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 9h14l-1.5-4H6.5L5 9z"/></svg>`,
  person: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  pin: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28"><path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 20 8 20s8-14.6 8-20c0-4.4-3.6-8-8-8z" fill="${c}"/><circle cx="12" cy="8" r="3" fill="white"/></svg>`,
};

function buildMarkerHtml(m: MarkerData): string {
  const iconType: MarkerIcon = m.icon ?? 'circle';
  const svgContent = ICONS[iconType](m.color)
    .replace(/"/g, '\\"')
    .replace(/\n/g, '');

  const size = iconType === 'circle' ? 36 : 44;
  const pulseHtml = m.pulse ? `
    <div style="
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:${size + 16}px;height:${size + 16}px;border-radius:50%;
      background:${m.color}33;
      animation:pulse 1.8s ease-in-out infinite;
    "></div>` : '';

  return `
    <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
      ${pulseHtml}
      <div style="
        position:relative;z-index:1;
        width:${size}px;height:${size}px;border-radius:50%;
        background:white;
        border:2.5px solid ${m.color};
        box-shadow:0 3px 10px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
      ">
        <img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(ICONS[iconType](m.color))}" width="${size - 10}" height="${size - 10}" style="display:block;" />
      </div>
    </div>
  `.replace(/\n\s*/g, '');
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
      webRef.current?.injectJavaScript(`map.setView([${lat},${lng}],${zoom},{animate:true,duration:0.5});true;`);
    },
    fitBounds: (points, padding = 60) => {
      if (!points.length) return;
      const bounds = points.map(p => `[${p.latitude},${p.longitude}]`).join(',');
      webRef.current?.injectJavaScript(`map.fitBounds([${bounds}],{padding:[${padding},${padding}],animate:true});true;`);
    },
    updateMarker: (id, lat, lng) => {
      // Smooth move: interpolate via JS
      webRef.current?.injectJavaScript(`
        (function(){
          var m = window._markers && window._markers['${id}'];
          if(!m) return;
          var start = m.getLatLng();
          var end = L.latLng(${lat},${lng});
          var steps = 20, step = 0;
          var timer = setInterval(function(){
            step++;
            var t = step/steps;
            var lat = start.lat + (end.lat - start.lat)*t;
            var lng = start.lng + (end.lng - start.lng)*t;
            m.setLatLng([lat,lng]);
            if(step>=steps){ clearInterval(timer); }
          }, 50);
        })();
        true;
      `);
    },
  }));

  const markersJs = markers.map(m => {
    const html = buildMarkerHtml(m).replace(/`/g, '\\`').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `
      (function(){
        var icon = L.divIcon({
          className:'',
          html:'${buildMarkerHtml(m).replace(/'/g, "\\'").replace(/\n/g, '').replace(/\r/g, '')}',
          iconSize:[44,44],
          iconAnchor:[22,22],
          popupAnchor:[0,-22],
        });
        var marker = L.marker([${m.latitude},${m.longitude}],{icon:icon})
          .addTo(map)
          ${m.label ? `.bindPopup('${m.label.replace(/'/g, "\\'")}')` : ''};
        if(!window._markers) window._markers = {};
        window._markers['${m.id}'] = marker;
      })();
    `;
  }).join('\n');

  const polylineJs = polyline.length > 1 ? `
    L.polyline([${polyline.map(p => `[${p.latitude},${p.longitude}]`).join(',')}],{
      color:'${polylineColor}',weight:5,opacity:0.85,
      lineJoin:'round',lineCap:'round',
    }).addTo(map);
  ` : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body,#map{width:100%;height:100%;}
    .leaflet-control-attribution{display:none;}
    .leaflet-control-zoom{border:none!important;}
    .leaflet-control-zoom a{
      background:#fff!important;color:#374151!important;
      border-radius:8px!important;margin-bottom:4px!important;
      box-shadow:0 2px 8px rgba(0,0,0,0.15)!important;
      border:none!important;
    }
    @keyframes pulse{
      0%{transform:translate(-50%,-50%) scale(1);opacity:0.7;}
      50%{transform:translate(-50%,-50%) scale(1.8);opacity:0.1;}
      100%{transform:translate(-50%,-50%) scale(1);opacity:0.7;}
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map',{zoomControl:true,attributionControl:false})
      .setView([${initialLat},${initialLng}],${initialZoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    window._markers = {};
    ${markersJs}
    ${polylineJs}
  </script>
</body>
</html>`;

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
