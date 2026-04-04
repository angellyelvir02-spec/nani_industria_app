import React from "react";
import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps";

interface CustomMapProps {
  style?: any;
  region: any;
  onRegionChangeComplete?: (region: any) => void;
  showsUserLocation?: boolean;
}

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
  container: {
    flex: 1,
    overflow: "hidden",
  },
});