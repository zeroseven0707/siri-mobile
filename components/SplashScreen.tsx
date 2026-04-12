import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={['#1F9E54', '#0F5132']}
      style={styles.container}
    >
      <View style={styles.topSpace} />
      
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/siri.png')} style={{ width: 160, height: 160 }} resizeMode="contain" />
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
