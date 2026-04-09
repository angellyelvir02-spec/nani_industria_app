import React from "react";
import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps"; // Aquí NO da error

interface CustomMapProps {
  region: any;
  onRegionChangeComplete?: (region: any) => void;
}

export default function CustomMap({ region, onRegionChangeComplete }: CustomMapProps) {
  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={true}
        // Nota: El marcador no es necesario si usas el pin fijo 
        // que tienes en el formulario (markerFixed), pero si quieres 
        // uno extra, puedes desglosarlo aquí.
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});