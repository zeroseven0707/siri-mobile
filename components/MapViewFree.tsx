import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { UrlTile, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

interface MapViewFreeProps {
  latitude: number;
  longitude: number;
  title?: string;
}

export default function MapViewFree({ latitude, longitude, title = "Lokasi Saya" }: MapViewFreeProps) {
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        // Memaksa penggunaan OpenStreetMap Tile
        mapType="none"
      >
        <UrlTile
          urlTemplate="https://a.tile.openstreetmap.de/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        <Marker 
          coordinate={{ latitude, longitude }} 
          title={title}
          pinColor="#2ECC71"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
