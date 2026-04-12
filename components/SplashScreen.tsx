import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={['#1F9E54', '#0F5132']}
      style={styles.container}
    >
      <View style={styles.topSpace} />
      
      <View style={styles.logoContainer}>
        {/* Shield background */}
        <FontAwesome5 name="shield-alt" size={120} color="#F2A02C" style={styles.shield} />
        {/* Owl icon as placeholder */}
        <MaterialCommunityIcons name="owl" size={80} color="#1F9E54" style={styles.owl} />
      </View>

      <Text style={styles.title}>Siri</Text>
      <Text style={styles.subtitle}>Mudah, Cepat, Nyaman</Text>

      <View style={styles.bottomSpace}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>

      {/* Building silhouettes could be added here using vectors or images if available */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  topSpace: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: 150,
    height: 150,
  },
  shield: {
    position: 'absolute',
  },
  owl: {
    position: 'absolute',
  },
  title: {
    fontSize: 48,
    fontFamily: 'sans-serif-condensed', // Usually bold
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 40,
    opacity: 0.9,
  },
  bottomSpace: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
});
