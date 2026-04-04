import React from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CustomMap({ region }: any) {
  // Nota: Necesitarías una API KEY de Google Cloud (tiene tier gratuito amplio)
  // Si no tienes una, podemos usar la de OpenStreetMap como imagen.
  
  const zoom = 16;
  const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${region.longitude},${region.latitude}&z=${zoom}&l=map&pt=${region.longitude},${region.latitude},pm2rdm`;

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: mapUrl }} 
        style={styles.mapImage} 
        resizeMode="cover"
      />
      <TouchableOpacity 
        style={styles.overlay}
        onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${region.latitude},${region.longitude}`)}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Ver en pantalla completa ↗</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 250,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB'
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10
  },
  badge: {
    backgroundColor: 'rgba(136, 107, 193, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' }
});