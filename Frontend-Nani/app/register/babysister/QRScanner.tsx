import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../../../constants/apiConfig";
import { router, useLocalSearchParams } from "expo-router";
import { MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);

  // Modal de confirmación manual
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualReason, setManualReason] = useState("");
  const [sendingManual, setSendingManual] = useState(false);

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

  const fetchCheckInTimeFromServer = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = ENDPOINTS.get_detalle_reserva(bookingId as string);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return null;
      const data = await response.json();
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
    if (qrData.type !== type) return false;
    if (
      qrData.bookingId &&
      String(qrData.bookingId) !== String(bookingId || "")
    )
      return false;
    if (
      qrData.codigo_reserva &&
      bookingCode &&
      String(qrData.codigo_reserva) !== String(bookingCode)
    )
      return false;
    if (
      qrData.bookingCode &&
      bookingCode &&
      String(qrData.bookingCode) !== String(bookingCode)
    )
      return false;
    return true;
  };

  // ─── FLUJO COMÚN DE CHECK-IN ────────────────────────────────────────────────
  const processCheckin = async (
    token: string,
    qrCode: string | null,
    motivo_manual?: string,
  ) => {
    const now = Date.now().toString();

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
          qrCode,
          ...(motivo_manual ? { manual: true, motivo_manual } : {}),
        }),
      },
    );

    const responseData = await response.json();
    if (!response.ok)
      throw new Error(responseData?.message || "Error en check-in");

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
  };

  // ─── FLUJO COMÚN DE CHECK-OUT ────────────────────────────────────────────────
  const processCheckout = async (
    token: string,
    qrCode: string | null,
    motivo_manual?: string,
  ) => {
    let effectiveCheckInTime: string | null =
      String(checkInTime || "").trim() !== "" ? String(checkInTime) : null;

    if (!effectiveCheckInTime)
      effectiveCheckInTime = await getStoredCheckInTime();
    if (!effectiveCheckInTime)
      effectiveCheckInTime = await fetchCheckInTimeFromServer();

    if (!effectiveCheckInTime || Number(effectiveCheckInTime) <= 0) {
      throw new Error(
        "No se encontró la hora de entrada. Verifica tu conexión e intenta de nuevo.",
      );
    }

    const now = Date.now();
    const totalHours = (
      (now - Number(effectiveCheckInTime)) /
      1000 /
      3600
    ).toString();

    await clearStoredCheckInTime();

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
          ...(motivo_manual ? { manual: true, motivo_manual } : {}),
        }),
      },
    );

    const responseData = await response.json();
    if (!response.ok)
      throw new Error(responseData?.message || "Error en checkout");

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
  };

  // ─── HANDLE QR SCAN ──────────────────────────────────────────────────────────
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
        await processCheckin(token!, qrData?.code || null);
      } else if (type === "checkout") {
        await processCheckout(token!, qrData?.code || null);
      }
    } catch (err: any) {
      setCheckingLocation(false);
      if (err?.message && err.message !== "QR inválido") {
        setError(err.message);
      } else {
        setError("QR inválido");
      }
      setScanned(false);
    }
  };

  // ─── HANDLE MANUAL CONFIRM ───────────────────────────────────────────────────
  const handleManualConfirm = async () => {
    const reasonTrimmed = manualReason.trim();
    if (reasonTrimmed.length < 10) {
      Alert.alert(
        "Motivo requerido",
        "Por favor escribe un motivo de al menos 10 caracteres.",
      );
      return;
    }

    try {
      setSendingManual(true);
      const token = await AsyncStorage.getItem("userToken");

      if (type === "checkin") {
        await processCheckin(token!, null, reasonTrimmed);
      } else if (type === "checkout") {
        await processCheckout(token!, null, reasonTrimmed);
      }

      setManualModalVisible(false);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "No se pudo registrar la acción.");
    } finally {
      setSendingManual(false);
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

        {/* Botón de marcado manual — opción secundaria */}
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setManualModalVisible(true)}
        >
          <Text style={styles.manualButtonText}>
            {type === "checkout"
              ? "No puedo escanear — registrar salida manualmente"
              : "No puedo escanear — registrar entrada manualmente"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── MODAL MARCADO MANUAL ─────────────────────────────────────────── */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManualModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {type === "checkout"
                ? "Registrar salida manualmente"
                : "Registrar entrada manualmente"}
            </Text>

            <Text style={styles.modalSubtitle}>
              Esta opción es secundaria. Por favor explica el motivo por el que
              no puedes escanear el QR del cliente.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Escribe el motivo aquí (mínimo 10 caracteres)..."
              placeholderTextColor="#999"
              value={manualReason}
              onChangeText={setManualReason}
              multiline
              numberOfLines={4}
              maxLength={300}
            />

            <Text style={styles.charCount}>{manualReason.length}/300</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setManualModalVisible(false);
                  setManualReason("");
                }}
                disabled={sendingManual}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, sendingManual && styles.disabledBtn]}
                onPress={handleManualConfirm}
                disabled={sendingManual}
              >
                {sendingManual ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  infoTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  infoText: { fontSize: 13, color: "#666" },

  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },

  locationText: { fontSize: 14, flex: 1 },

  errorText: { color: "red", marginBottom: 12, textAlign: "center" },

  retryButton: {
    backgroundColor: "#886BC1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  retryText: { color: "white", fontWeight: "600" },

  // Botón de marcado manual
  manualButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#F3F0FA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C4B5E8",
    alignItems: "center",
  },
  manualButtonText: {
    color: "#886BC1",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#777",
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#FAFAFA",
  },
  charCount: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#AAA",
    marginTop: 4,
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#EEE",
    alignItems: "center",
  },
  cancelBtnText: { color: "#555", fontWeight: "600" },
  confirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#886BC1",
    alignItems: "center",
  },
  confirmBtnText: { color: "white", fontWeight: "700" },
  disabledBtn: { opacity: 0.6 },
});
