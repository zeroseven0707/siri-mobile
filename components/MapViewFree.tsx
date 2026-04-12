import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapViewFreeProps {
  latitude: number;
  longitude: number;
  type?: 'standard' | 'satellite';
}

export default function MapViewFree({ latitude, longitude, type = 'standard' }: MapViewFreeProps) {
  const standardLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satelliteLayer = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  
  const activeLayer = type === 'satellite' ? satelliteLayer : standardLayer;

  // HTML Leaflet untuk menampilkan OpenStreetMap
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          .leaflet-control-attribution { display: none; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView([${latitude}, ${longitude}], ${type === 'satellite' ? 17 : 15});
          var layer = L.tileLayer('${activeLayer}', {
            maxZoom: 19,
          }).addTo(map);
          L.marker([${latitude}, ${longitude}]).addTo(map);

          window.addEventListener('message', function(e) {
            const data = JSON.parse(e.data);
            if (data.type === 'updateLayer') {
               map.removeLayer(layer);
               layer = L.tileLayer(data.url, { maxZoom: 19 }).addTo(map);
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 350,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
});
