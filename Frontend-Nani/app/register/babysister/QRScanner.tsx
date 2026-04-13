import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../../../constants/apiConfig";
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
    bookingCode,
    bookingStatus,
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
    date,
    time,
    scheduledStart,
    scheduledEnd,
    payment,
    paymentMethod,
    notes,
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
    lon2: number,
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

  const getCheckInStorageKey = () =>
    `booking_checkin_${String(bookingId || "")}`;

  const saveCheckInTime = async (value: string) => {
    if (!bookingId) return;
    await AsyncStorage.setItem(getCheckInStorageKey(), value);
  };

  const getStoredCheckInTime = async () => {
    if (!bookingId) return null;
    return AsyncStorage.getItem(getCheckInStorageKey());
  };

  const clearStoredCheckInTime = async () => {
    if (!bookingId) return;
    await AsyncStorage.removeItem(getCheckInStorageKey());
  };

  const isQrValidForCurrentBooking = (qrData: any) => {
    if (!qrData || typeof qrData !== "object") return false;

    if (qrData.type !== type) {
      return false;
    }

    // Si el QR trae bookingId, se valida contra la reserva actual
    if (
      qrData.bookingId &&
      String(qrData.bookingId) !== String(bookingId || "")
    ) {
      return false;
    }

    // Si el QR trae codigo_reserva o bookingCode, se valida también
    if (
      qrData.codigo_reserva &&
      bookingCode &&
      String(qrData.codigo_reserva) !== String(bookingCode)
    ) {
      return false;
    }

    if (
      qrData.bookingCode &&
      bookingCode &&
      String(qrData.bookingCode) !== String(bookingCode)
    ) {
      return false;
    }

    return true;
  };

  const handleScan = async ({ data }: any) => {
    if (scanned || checkingLocation) return;

    setScanned(true);
    setError(null);

    try {
      const qrData = JSON.parse(data);

      if (!isQrValidForCurrentBooking(qrData)) {
        setError("Este QR no corresponde a esta reserva o acción.");
        setScanned(false);
        return;
      }
      const token = await AsyncStorage.getItem("userToken");

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

        // --- AÑADE ESTO PARA DEBUGEAR ---
        console.log("📍 MI UBICACIÓN ACTUAL (GPS):", {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
        console.log("🏠 UBICACIÓN DE LA RESERVA (Destino):", {
          lat: Number(latitude),
          lng: Number(longitude),
        });
        // --------------------------------

        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          Number(latitude),
          Number(longitude),
        );

        if (distance > 5000.0) {
          setError("No estás en la ubicación correcta.");
          setCheckingLocation(false);
          setScanned(false);
          return;
        }
      }

      setCheckingLocation(false);

      if (type === "checkin") {
        const now = Date.now().toString();

        try {
          const response = await fetch(
            ENDPOINTS.procesar_checkin(bookingId as string),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                checkInTime: now,
                qrCode: qrData?.code || null,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.message || "Error en check-in");
          }
        } catch (err: any) {
          setError(err?.message || "Error registrando entrada");
          setScanned(false);
          return;
        }

        // Guardado local (fallback)
        await saveCheckInTime(now);

        router.replace({
          pathname: "./JobTracking",
          params: {
            bookingId,
            bookingCode,
            bookingStatus: "en_progreso",
            scanMode: "checkout",
            clientName,
            clientPhoto,
            address,
            scheduledHours,
            hourlyRate,
            children,
            childrenDetails,
            latitude,
            longitude,
            checkInTime: now,
            date,
            time,
            scheduledStart,
            scheduledEnd,
            payment,
            paymentMethod,
            notes,
          },
        });

        return;
      }

      if (type === "checkout") {
        const storedCheckInTime = await getStoredCheckInTime();
        const effectiveCheckInTime =
          String(checkInTime || "").trim() !== ""
            ? String(checkInTime)
            : storedCheckInTime;

        if (!effectiveCheckInTime || Number(effectiveCheckInTime) <= 0) {
          setError("No se encontró la hora de entrada de esta sesión.");
          setScanned(false);
          return;
        }

        const now = Date.now();
        const totalHours = (
          (now - Number(effectiveCheckInTime)) /
          1000 /
          3600
        ).toString();

        await clearStoredCheckInTime();

        try {
          const response = await fetch(
            ENDPOINTS.procesar_checkout(bookingId as string),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                checkOutTime: now.toString(),
                totalHours,
              }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.message || "Error en checkout");
          }
        } catch (err: any) {
          setError(err?.message || "Error registrando salida");
          setScanned(false);
          return;
        }

        router.replace({
          pathname: "./SessionSummary",
          params: {
            bookingId,
            bookingCode,
            bookingStatus: "completada",
            clientName,
            nombreCliente: clientName,
            clientPhoto,
            scheduledHours,
            hourlyRate,
            checkInTime: String(effectiveCheckInTime),
            checkOutTime: now.toString(),
            totalHours,
            children,
            childrenDetails,
            address,
            ubicacion: address,
            payment,
            paymentMethod,
            date,
            fecha: date,
            time,
            scheduledStart,
            horaInicio: scheduledStart,
            scheduledEnd,
            horaFin: scheduledEnd,
            notes,
            estado: "completada",
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
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.retryButton}
        >
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

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>
          {type === "checkout" ? "Escaneo de salida" : "Escaneo de llegada"}
        </Text>

        {!!bookingStatus && (
          <Text style={styles.infoText}>
            Estado actual: {String(bookingStatus)}
          </Text>
        )}

        <View style={styles.locationBox}>
          <MapPin size={18} color="#FF768A" />
          <Text style={styles.locationText}>
            {String(address || "Ubicación no disponible")}
          </Text>
        </View>
      </View>
      {/* BOTÓN TEMPORAL PARA CERRAR LA RESERVA YA */}
      <TouchableOpacity
        style={{
          backgroundColor: "#FF0000",
          padding: 20,
          position: "absolute",
          top: 50,
          alignSelf: "center",
          borderRadius: 10,
          zIndex: 999,
        }}
        onPress={async () => {
          console.log("Forzando cierre y creando hora de entrada fantasma...");

          // 1. Inventamos que la reserva empezó hace 2 horas (para que no de error de 0 horas)
          const haceDosHoras = Date.now() - 3 * 60 * 60 * 1000;

          // 2. Lo guardamos en el storage para que el código lo encuentre
          const key = `booking_checkin_${String(bookingId || "")}`;
          await AsyncStorage.setItem(key, haceDosHoras.toString());

          // 3. Ejecutamos el escaneo simulado
          handleScan({
            data: JSON.stringify({
              type: "checkout",
              bookingId: bookingId,
              bookingCode: bookingCode,
            }),
          });
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          CERRAR RESERVA AHORA
        </Text>
      </TouchableOpacity>
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

  infoBox: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  infoText: {
    fontSize: 13,
    color: "#666",
  },

  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
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
