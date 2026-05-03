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

  const esc = (obj: any) => JSON.stringify(obj).replace(/'/g, "\\'");

  useImperativeHandle(ref, () => ({
    setView: (lat, lng, zoom = 15) => {
      webRef.current?.injectJavaScript(`window.map&&window.map.setView([${lat},${lng}],${zoom},{animate:true});true;`);
    },
    fitBounds: (points, padding = 60) => {
      if (!points.length) return;
      const bounds = points.map(p => `[${p.latitude},${p.longitude}]`).join(',');
      webRef.current?.injectJavaScript(`window.map&&window.map.fitBounds([${bounds}],{padding:[${padding},${padding + 180}]});true;`);
    },
    updateMarker: (id, lat, lng) => {
      webRef.current?.injectJavaScript(`
        (function(){
          var m=window._markers&&window._markers['${id}'];
          if(!m)return;
          var s=m.getLatLng(),e=L.latLng(${lat},${lng});
          if(s.equals(e))return;
          var dur=1000,t0=performance.now();
          function step(t){var p=Math.min((t-t0)/dur,1),k=p*(2-p);m.setLatLng([s.lat+(e.lat-s.lat)*k,s.lng+(e.lng-s.lng)*k]);if(p<1)requestAnimationFrame(step);}
          requestAnimationFrame(step);
        })();true;
      `);
    },
  }));

  useEffect(() => {
    if (!mapReady) return;
    webRef.current?.injectJavaScript(`
      window.syncMarkers&&window.syncMarkers('${esc(markers)}');
      window.syncPolyline&&window.syncPolyline('${esc(polyline)}','${polylineColor}');
      true;
    `);
  }, [markers, polyline, polylineColor, mapReady]);

  const lat = Number(initialLat) || -6.2297;
  const lng = Number(initialLng) || 106.8295;
  const zoom = Number(initialZoom) || 13;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<style>
html,body{width:100%;height:100%;margin:0;padding:0;overflow:hidden;background:#ddd;}
#map{position:absolute;top:0;bottom:0;left:0;right:0;}
.leaflet-control-attribution{display:none;}
@keyframes pulse{0%{transform:translate(-50%,-50%) scale(1);opacity:.7;}50%{transform:translate(-50%,-50%) scale(1.8);opacity:.1;}100%{transform:translate(-50%,-50%) scale(1);opacity:.7;}}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script>
(function(){
var initialized=false;
function init(){
  if(initialized)return;
  if(typeof L==='undefined')return;
  var el=document.getElementById('map');
  if(!el)return;
  try{
    initialized=true;
    window.map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lng}],${zoom});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19,subdomains:'abcd'}).addTo(window.map);
    window._markers={};
    window.buildMarkerHtml=function(m){
      var t=m.icon||'circle',sz=28,c=m.color;
      var icons={
        circle:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="'+c+'"/></svg>',
        bike:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1-1h-1l-5 8h7l1-4"/><path d="m9 17 3-8"/></svg>',
        car:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="2"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 9h14l-1.5-4H6.5L5 9z"/></svg>',
        person:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        pin:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 28"><path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 20 8 20s8-14.6 8-20c0-4.4-3.6-8-8-8z" fill="'+c+'"/><circle cx="12" cy="8" r="3" fill="white"/></svg>',
        home:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
      };
      var pulse=m.pulse?'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:'+(sz+10)+'px;height:'+(sz+10)+'px;border-radius:50%;background:'+c+'33;animation:pulse 1.8s ease-in-out infinite;"></div>':'';
      return '<div style="position:relative;width:'+sz+'px;height:'+sz+'px;display:flex;align-items:center;justify-content:center;">'+pulse+'<div style="position:relative;z-index:1;width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:white;border:2px solid '+c+';box-shadow:0 2px 6px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;"><img src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(icons[t])+'" width="16" height="16" style="display:block;"/></div></div>';
    };
    window.syncMarkers=function(j){
      var ms=JSON.parse(j);
      if(!window._markers)window._markers={};
      ms.forEach(function(m,i){
        var z=m.pulse?1000:100+i,ic=L.divIcon({className:'',html:window.buildMarkerHtml(m),iconSize:[28,28],iconAnchor:[14,14]});
        if(window._markers[m.id]){window._markers[m.id].setIcon(ic);window._markers[m.id].setZIndexOffset(z);if(m.id!=='driver')window._markers[m.id].setLatLng([m.latitude,m.longitude]);}
        else{window._markers[m.id]=L.marker([m.latitude,m.longitude],{icon:ic,zIndexOffset:z}).addTo(window.map);if(m.label)window._markers[m.id].bindPopup(m.label);}
      });
      var ids=ms.map(function(m){return m.id;});
      Object.keys(window._markers).forEach(function(id){if(ids.indexOf(id)===-1){window.map.removeLayer(window._markers[id]);delete window._markers[id];}});
    };
    window.syncPolyline=function(j,color){
      try {
        var cs=JSON.parse(j);
        if(window._polyline){window.map.removeLayer(window._polyline);window._polyline=null;}
        if(cs.length>1){
          window._polyline=L.polyline(cs.map(function(p){return[p.latitude,p.longitude];}),{color:color,weight:5,opacity:.85,lineJoin:'round',lineCap:'round'}).addTo(window.map);
        }
      } catch(e) { console.error('Polyline sync error:', e); }
    };
    setTimeout(function(){window.map.invalidateSize();},200);
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('ready');
  }catch(e){
    initialized=false;
  }
}
setTimeout(init,100);
setTimeout(init,500);
setTimeout(init,1500);
})();
</script>
</body>
</html>`;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        onMessage={(e) => {
          const d = e.nativeEvent.data;
          if (d === 'ready') setMapReady(true);
        }}
        onLoadEnd={() => {
          setTimeout(() => setMapReady(p => p || true), 4000);
        }}
      />
      {!mapReady && (
        <View style={[StyleSheet.absoluteFillObject, styles.loader]}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loaderText}>Memuat Peta...</Text>
        </View>
      )}
    </View>
  );
});

export default LeafletMap;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ddd' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loader: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', zIndex: 10 },
  loaderText: { marginTop: 10, color: '#6B7280', fontSize: 12, fontWeight: '600' },
});
