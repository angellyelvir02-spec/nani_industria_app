import React from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * Muestra una vista previa estática del mapa usando coordenadas.
 * Al presionar, abre la ubicación en Google Maps.
 */
export default function CustomMap({ region }: any) {
  // Nivel de zoom usado para generar la imagen del mapa
  const zoom = 16;

  // URL de la imagen estática del mapa con marcador en la ubicación recibida
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
        onPress={() =>
          Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${region.latitude},${region.longitude}`
          )
        }
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Ver en pantalla completa ↗</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal del mapa
  container: {
    flex: 1,
    minHeight: 250,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },

  // Imagen que muestra el mapa estático
  mapImage: {
    width: "100%",
    height: "100%",
  },

  // Capa presionable colocada sobre toda la imagen
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 10,
  },

  // Etiqueta mostrada sobre el mapa
  badge: {
    backgroundColor: "rgba(136, 107, 193, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  // Texto de la etiqueta
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
});