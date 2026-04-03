import React from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
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
    clientName,
    clientPhoto,
    date,
    time,
    duration,
    children,
    address,
    payment,
    paymentMethod,
    childrenDetails,
    notes,
    latitude,
    longitude,
  } = useLocalSearchParams();

  const openMap = () => {
    const destination = String(address || "");
    if (!destination) return;

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      destination
    )}`;
    Linking.openURL(url);
  };

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

            <View>
              <Text style={styles.headerTitle}>Seguimiento del Trabajo</Text>
              <Text style={styles.headerSub}>Reserva #{bookingId}</Text>
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <AlertCircle color="white" size={26} />
              <View>
                <Text style={styles.statusText}>Estado</Text>
                <Text style={styles.statusValue}>Pendiente de llegada</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información del Cliente</Text>

          <View style={styles.clientRow}>
            <Image
              source={{
                uri:
                  String(clientPhoto || "") ||
                  "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>
                {String(clientName || "Cliente")}
              </Text>

              <View style={styles.row}>
                <Clock size={16} color="#886BC1" />
                <Text style={styles.grayText}>
                  {String(date || "")} {String(time || "")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <Users size={18} color="#886BC1" />
            <Text style={styles.grayText}>
              {String(childrenDetails || `${children || 0} niños`)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ubicación</Text>

          <View style={styles.row}>
            <MapPin size={18} color="#FF768A" />
            <Text style={styles.grayText}>{String(address || "Sin dirección")}</Text>
          </View>

          <TouchableOpacity style={styles.mapButton} onPress={openMap}>
            <Navigation size={18} color="#886BC1" />
            <Text style={styles.mapText}>Abrir en Google Maps</Text>
          </TouchableOpacity>
        </View>

        {!!notes && String(notes).trim() !== "" && String(notes) !== "Sin notas" && (
          <View style={styles.notes}>
            <View style={styles.row}>
              <AlertCircle size={18} color="#FF768A" />
              <Text style={styles.cardTitle}>Notas Importantes</Text>
            </View>

            <Text style={styles.grayText}>{String(notes)}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles del Pago</Text>

          <View style={styles.paymentRow}>
            <Text>Método de pago</Text>
            <Text>{String(paymentMethod || "No especificado")}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text>Duración</Text>
            <Text>{String(duration || 0)}h</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text>Niños</Text>
            <Text>{String(children || 0)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text>Total estimado</Text>
            <Text style={styles.total}>${Number(payment || 0).toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() =>
            router.push({
              pathname: "./QRScanner",
              params: {
                bookingId,
                type: "checkin",
                clientName,
                clientPhoto,
                address,
                scheduledHours: duration,
                hourlyRate:
                  Number(duration) > 0
                    ? (Number(payment) / Number(duration)).toString()
                    : "0",
                children,
                childrenDetails,
                latitude,
                longitude,
              },
            })
          }
        >
          <QrCode color="white" size={20} />
          <Text style={styles.confirmText}>Confirmar llegada</Text>
        </TouchableOpacity>
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
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
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