import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

interface ActiveSessionProps {
  data?: {
    nombreCliente?: string;
    direccion?: string;
    latitude?: number;
    longitude?: number;
  };
  onScanQR: (type: "checkin" | "checkout", location: any) => void;
}

export default function ActiveSession({ data, onScanQR }: ActiveSessionProps) {
  const [location, setLocation] = useState<any>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permiso requerido", "Necesitamos acceso a tu ubicación");
        setLoadingLocation(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLoadingLocation(false);
    })();
  }, []);

  const handleScan = (type: "checkin" | "checkout") => {
    if (!location) {
      Alert.alert("Ubicación no disponible", "Intenta nuevamente");
      return;
    }

    onScanQR(type, location);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sesión activa</Text>

      <View style={styles.card}>
        <Item
          icon="person-outline"
          label="Cliente"
          value={data?.nombreCliente || "No disponible"}
        />
        <Item
          icon="location-outline"
          label="Dirección"
          value={data?.direccion || "No disponible"}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleScan("checkin")}
        >
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Escanear QR (Entrada)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#f44336" }]}
          onPress={() => handleScan("checkout")}
        >
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Escanear QR (Salida)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.locationBox}>
        <Text style={styles.locationText}>
          {loadingLocation
            ? "Obteniendo ubicación..."
            : location
              ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`
              : "Ubicación no disponible"}
        </Text>
      </View>
    </View>
  );
}

function Item({ icon, label, value }: any) {
  return (
    <View style={styles.item}>
      <Ionicons name={icon} size={20} color="#555" />
      <View style={{ marginLeft: 10 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    marginBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: "#888",
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    gap: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  locationBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
  },
  locationText: {
    fontSize: 13,
    textAlign: "center",
  },
});