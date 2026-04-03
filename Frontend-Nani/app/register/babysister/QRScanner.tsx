import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);

  const {
    bookingId,
    type,
    address,
    latitude,
    longitude,
    clientName,
    clientPhoto,
    scheduledHours,
    hourlyRate,
    checkInTime,
    children,
    childrenDetails,
  } = useLocalSearchParams();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const shouldValidateLocation =
    latitude !== undefined &&
    longitude !== undefined &&
    String(latitude).trim() !== "" &&
    String(longitude).trim() !== "";

  const handleScan = async ({ data }: any) => {
    if (scanned || checkingLocation) return;

    setScanned(true);
    setError(null);

    try {
      const qrData = JSON.parse(data);

      if (qrData.type !== type) {
        setError("Este QR no corresponde a esta acción.");
        setScanned(false);
        return;
      }

      if (shouldValidateLocation) {
        setCheckingLocation(true);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Debes permitir acceso a la ubicación.");
          setCheckingLocation(false);
          setScanned(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});

        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          Number(latitude),
          Number(longitude)
        );

        if (distance > 0.1) {
          setError("No estás en la ubicación correcta.");
          setCheckingLocation(false);
          setScanned(false);
          return;
        }
      }

      setCheckingLocation(false);

      if (type === "checkin") {
        router.replace({
          pathname: "./ActiveSession",
          params: {
            bookingId,
            clientName,
            clientPhoto,
            address,
            scheduledHours,
            hourlyRate,
            children,
            childrenDetails,
            latitude,
            longitude,
            checkInTime: Date.now().toString(),
          },
        });
        return;
      }

      if (type === "checkout") {
        const now = Date.now();
        const totalHours =
          checkInTime && Number(checkInTime) > 0
            ? ((now - Number(checkInTime)) / 1000 / 3600).toString()
            : "0";

        router.replace({
          pathname: "./SessionSummary",
          params: {
            bookingId,
            clientName,
            clientPhoto,
            scheduledHours,
            hourlyRate,
            checkInTime,
            checkOutTime: now.toString(),
            totalHours,
          },
        });
      }
    } catch (err) {
      setCheckingLocation(false);
      setError("QR inválido");
      setScanned(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text>Permiso de cámara requerido</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.retryButton}>
          <Text style={styles.retryText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!checkingLocation && !error && (
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleScan}
        />
      )}

      {checkingLocation && (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text>Verificando ubicación...</Text>
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              setScanned(false);
              setCheckingLocation(false);
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.locationBox}>
        <MapPin size={18} color="#FF768A" />
        <Text style={styles.locationText}>
          {String(address || "Ubicación no disponible")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  locationBox: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  errorText: {
    color: "red",
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#886BC1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  retryText: {
    color: "white",
    fontWeight: "600",
  },
});