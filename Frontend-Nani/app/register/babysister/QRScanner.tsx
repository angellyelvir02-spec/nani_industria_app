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

  /**
   * Recupera la hora de entrada real desde el backend (Supabase).
   * Se usa como fallback cuando el celular fue reiniciado y se perdieron
   * los params de navegación y el AsyncStorage local.
   */
  const fetchCheckInTimeFromServer = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = ENDPOINTS.get_detalle_reserva(bookingId as string);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      // El backend devuelve checkInReal como ISO string (hora_entrada_real)
      if (data?.checkInReal) {
        return new Date(data.checkInReal).getTime().toString();
      }
      return null;
    } catch {
      return null;
    }
  };

  const isQrValidForCurrentBooking = (qrData: any) => {
    if (!qrData || typeof qrData !== "object") return false;

    if (qrData.type !== type) {
      return false;
    }

    if (
      qrData.bookingId &&
      String(qrData.bookingId) !== String(bookingId || "")
    ) {
      return false;
    }

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

          const responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData?.message || "Error en check-in");
          }
        } catch (err: any) {
          setError(err?.message || "Error registrando entrada");
          setScanned(false);
          return;
        }

        // Guardar en AsyncStorage como respaldo local ante cierre de app
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
        // PRIORIDAD DE RECUPERACIÓN DE HORA DE ENTRADA:
        // 1. Param de navegación (sesión activa, flujo normal)
        // 2. AsyncStorage local (app se cerró pero cel no se reinició)
        // 3. Backend/Supabase (cel reiniciado — niñera o cliente)
        let effectiveCheckInTime: string | null =
          String(checkInTime || "").trim() !== "" ? String(checkInTime) : null;

        if (!effectiveCheckInTime) {
          effectiveCheckInTime = await getStoredCheckInTime();
        }

        if (!effectiveCheckInTime) {
          effectiveCheckInTime = await fetchCheckInTimeFromServer();
        }

        if (!effectiveCheckInTime || Number(effectiveCheckInTime) <= 0) {
          setError(
            "No se encontró la hora de entrada. Verifica tu conexión e intenta de nuevo.",
          );
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

          const responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData?.message || "Error en checkout");
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
