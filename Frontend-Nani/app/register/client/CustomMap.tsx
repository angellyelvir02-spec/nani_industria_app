import React from "react";
import { View, StyleSheet, Platform } from "react-native";

// NO HACER IMPORT DE MAPVIEW AQUÍ ARRIBA
// Eso es lo que rompe la Web.

export default function CustomMap({ region, onRegionChangeComplete }: any) {
  // VISTA PARA WEB (Laptop)
  if (Platform.OS === "web") {
    // Usamos un iframe de OpenStreetMap (Gratis y no rompe nada)
    const zoom = 0.005;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${region.longitude - zoom}%2C${region.latitude - zoom}%2C${region.longitude + zoom}%2C${region.latitude + zoom}&layer=mapnik&marker=${region.latitude}%2C${region.longitude}`;

    return (
      <View style={{ flex: 1, backgroundColor: "#E5E7EB" }}>
        <iframe
          title="Nani Map"
          src={url}
          width="100%"
          height="100%"
          style={{ border: 0 }}
        />
      </View>
    );
  }

  // VISTA PARA MÓVIL (Android/iOS)
  // El require dinámico evita que el error aparezca en el navegador
  const MapView = require("react-native-maps").default;

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={true}
    />
  );
}
