import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Region } from "react-native-maps";

/**
 * Props del componente CustomMap
 */
interface CustomMapProps {
  // Estilos opcionales para el contenedor
  style?: any;

  // Región inicial o actual del mapa
  region: Region;

  // Callback que se ejecuta cuando el usuario deja de mover el mapa
  onRegionChangeComplete?: (region: Region) => void;

  // Indica si se muestra la ubicación del usuario
  showsUserLocation?: boolean;
}

/**
 * Componente que renderiza un mapa interactivo usando react-native-maps
 */
export default function CustomMap({
  style,
  region,
  onRegionChangeComplete,
  showsUserLocation = true,
}: CustomMapProps) {
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={showsUserLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Contenedor del mapa
  container: {
    flex: 1,
    overflow: "hidden",
  },
});