import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../../../constants/apiConfig";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  MapPin,
  Navigation,
  QrCode,
  Users,
} from "lucide-react-native";

export default function JobTracking() {
  const router = useRouter();

  const {
    bookingId,
    bookingCode,
    bookingStatus: initialBookingStatus,
    scanMode: initialScanMode,
    clientName: initialClientName,
    clientPhoto: initialClientPhoto,
    date: initialDate,
    time: initialTime,
    duration: initialDuration,
    children: initialChildren,
    address: initialAddress,
    payment: initialPayment,
    paymentMethod: initialPaymentMethod,
    childrenDetails: initialChildrenDetails,
    notes: initialNotes,
    latitude: initialLatitude,
    longitude: initialLongitude,
    scheduledStart: initialScheduledStart,
    scheduledEnd: initialScheduledEnd,
  } = useLocalSearchParams();

  const [serverBooking, setServerBooking] = useState<any>(null);
  const [loadingServer, setLoadingServer] = useState(false);

  const bookingStatus =
    serverBooking?.status ?? String(initialBookingStatus || "");

  const scanMode =
    serverBooking != null
      ? serverBooking.status === "en_progreso"
        ? "checkout"
        : "checkin"
      : String(initialScanMode || "");

  const address =
    serverBooking?.address ?? String(initialAddress || "Sin dirección");
  const latitude =
    serverBooking?.latitud != null
      ? String(serverBooking.latitud)
      : String(initialLatitude || "");
  const longitude =
    serverBooking?.longitud != null
      ? String(serverBooking.longitud)
      : String(initialLongitude || "");
  const checkInTime = serverBooking?.checkInReal
    ? new Date(serverBooking.checkInReal).getTime().toString()
    : "";

  const clientName = String(initialClientName || "Cliente");
  const clientPhoto = String(initialClientPhoto || "");
  const date = String(initialDate || "");
  const time = String(initialTime || "");
  const duration = String(initialDuration || "0");
  const children = String(initialChildren || "0");
  const payment = String(initialPayment || "0");
  const paymentMethod = String(initialPaymentMethod || "No especificado");
  const childrenDetails = String(initialChildrenDetails || "");
  const notes = String(initialNotes || "");
  const scheduledStart = String(initialScheduledStart || "");
  const scheduledEnd = String(initialScheduledEnd || "");

  const fetchBookingFromServer = useCallback(async () => {
    const bId = String(bookingId || "");
    if (!bId || bId === "undefined") return;

    try {
      setLoadingServer(true);
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(ENDPOINTS.get_detalle_reserva(bId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setServerBooking(data);
    } catch {
    } finally {
      setLoadingServer(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBookingFromServer();
    const interval = setInterval(fetchBookingFromServer, 30000);
    return () => clearInterval(interval);
  }, [fetchBookingFromServer]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchBookingFromServer();
    });
    return () => sub.remove();
  }, [fetchBookingFromServer]);

  const normalizedStatus = bookingStatus.toLowerCase().trim();
  const normalizedScanMode = scanMode.toLowerCase().trim();

  const openMap = () => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url);
    } else if (address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      Linking.openURL(url);
    }
  };

  const getStatusText = () => {
    if (normalizedStatus === "en_progreso") return "Servicio en progreso";
    if (normalizedStatus === "confirmada") return "Pendiente de llegada";
    if (normalizedStatus === "completada") return "Servicio completado";
    return "Seguimiento de reserva";
  };

  const getActionText = () =>
    normalizedScanMode === "checkout"
      ? "Confirmar salida"
      : "Confirmar llegada";

  const getQrType = () =>
    normalizedScanMode === "checkout" ? "checkout" : "checkin";

  const getHourlyRate = () => {
    const numericDuration = Number(duration || 0);
    const numericPayment = Number(payment || 0);
    if (!numericDuration || numericDuration <= 0) return "0";
    return (numericPayment / numericDuration).toString();
  };

  const canScan =
    normalizedStatus === "confirmada" || normalizedStatus === "en_progreso";

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color="white" size={22} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Seguimiento del Trabajo</Text>
              <Text style={styles.headerSub}>
                Reserva #{String(bookingId || "")}
              </Text>
            </View>

            {loadingServer && (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            )}
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <AlertCircle color="white" size={26} />
              <View>
                <Text style={styles.statusText}>Estado</Text>
                <Text style={styles.statusValue}>{getStatusText()}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información del Cliente</Text>

          <View style={styles.clientRow}>
            <Image
              source={{
                uri: clientPhoto || "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{clientName}</Text>

              <View style={styles.row}>
                <Clock size={16} color="#886BC1" />
                <Text style={styles.grayText}>
                  {date} {time}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <Users size={18} color="#886BC1" />
            <Text style={styles.grayText}>
              {childrenDetails || `${children} niños`}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ubicación</Text>

          <View style={styles.row}>
            <MapPin size={18} color="#FF768A" />
            <Text style={styles.grayText}>{address}</Text>
          </View>

          <TouchableOpacity style={styles.mapButton} onPress={openMap}>
            <Navigation size={18} color="#886BC1" />
            <Text style={styles.mapText}>Abrir en Google Maps</Text>
          </TouchableOpacity>
        </View>

        {!!notes && notes.trim() !== "" && notes !== "Sin notas" && (
          <View style={styles.notes}>
            <View style={styles.row}>
              <AlertCircle size={18} color="#FF768A" />
              <Text style={styles.cardTitle}>Notas Importantes</Text>
            </View>
            <Text style={styles.grayText}>{notes}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles del Servicio</Text>

          {!!bookingCode && (
            <View style={styles.paymentRow}>
              <Text>Código de reserva</Text>
              <Text>{String(bookingCode)}</Text>
            </View>
          )}

          <View style={styles.paymentRow}>
            <Text>Horario programado</Text>
            <Text>
              {scheduledStart} - {scheduledEnd}
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text>Duración estimada</Text>
            <Text>{duration}h</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text>Niños</Text>
            <Text>{children}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles del Pago</Text>

          <View style={styles.paymentRow}>
            <Text>Método de pago</Text>
            <Text>{paymentMethod}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text>Total estimado</Text>
            <Text style={styles.total}>${Number(payment).toFixed(2)}</Text>
          </View>
        </View>

        {canScan && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() =>
              router.push({
                pathname: "./QRScanner",
                params: {
                  bookingId,
                  bookingCode,
                  type: getQrType(),
                  clientName,
                  clientPhoto,
                  address,
                  scheduledHours: duration,
                  hourlyRate: getHourlyRate(),
                  checkInTime,
                  children,
                  childrenDetails,
                  latitude,
                  longitude,
                  bookingStatus,
                  date,
                  time,
                  scheduledStart,
                  scheduledEnd,
                  payment,
                  paymentMethod,
                  notes,
                },
              })
            }
          >
            <QrCode color="white" size={20} />
            <Text style={styles.confirmText}>{getActionText()}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  header: {
    backgroundColor: "#886BC1",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: { color: "white", fontSize: 18, fontWeight: "600" },
  headerSub: { color: "white", opacity: 0.8 },

  statusCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 15,
  },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusText: { color: "white", fontSize: 12 },
  statusValue: { color: "white", fontSize: 16 },

  card: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 20,
  },

  cardTitle: { fontSize: 16, marginBottom: 10, fontWeight: "600" },

  clientRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 10,
    alignItems: "center",
  },

  avatar: { width: 60, height: 60, borderRadius: 30 },

  clientName: { fontSize: 16, fontWeight: "600" },

  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },

  grayText: { color: "#666", flexShrink: 1 },

  mapButton: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F6D9F1",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    justifyContent: "center",
  },

  mapText: { color: "#886BC1" },

  notes: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFF5F7",
  },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },

  total: { color: "#886BC1", fontSize: 20, fontWeight: "bold" },

  confirmButton: {
    backgroundColor: "#FF768A",
    margin: 20,
    padding: 15,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  confirmText: { color: "white", fontSize: 16, fontWeight: "600" },
});
