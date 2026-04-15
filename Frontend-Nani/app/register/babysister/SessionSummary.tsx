import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SessionSummary() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const clientName = String(
    params.clientName || params.nombreCliente || "Cliente"
  );
  const date = String(params.date || params.fecha || "No disponible");
  const scheduledStart = String(
    params.scheduledStart || params.horaInicio || ""
  );
  const scheduledEnd = String(params.scheduledEnd || params.horaFin || "");
  const address = String(
    params.address || params.ubicacion || "No disponible"
  );
  const bookingStatus = String(
    params.bookingStatus || params.estado || "completada"
  );
  const bookingCode = String(params.bookingCode || params.codigo_reserva || "");
  const paymentMethod = String(
    params.paymentMethod || params.metodoPago || "No especificado"
  );
  const notes = String(params.notes || params.notas || "");
  const childrenDetails = String(
    params.childrenDetails || params.detalleNinos || ""
  );

  const children = Number(params.children || 0);
  const scheduledHours = Number(params.scheduledHours || 0);
  const hourlyRate = Number(params.hourlyRate || 0);
  const totalHours = Number(params.totalHours || 0);
  const estimatedPayment = Number(params.payment || 0);

  const checkInTimeRaw = String(params.checkInTime || "");
  const checkOutTimeRaw = String(params.checkOutTime || "");

  const formatTimestamp = (value: string) => {
    if (!value || Number.isNaN(Number(value))) return "No disponible";

    const dateObj = new Date(Number(value));
    return dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (value: number) => {
    return `L. ${Number(value || 0).toFixed(2)}`;
  };

  const workedHoursLabel = useMemo(() => {
    if (!totalHours || totalHours <= 0) return "0.00 h";
    return `${totalHours.toFixed(2)} h`;
  }, [totalHours]);

  const calculatedTotal = useMemo(() => {
    if (totalHours > 0 && hourlyRate > 0) {
      return totalHours * hourlyRate;
    }
    return estimatedPayment;
  }, [totalHours, hourlyRate, estimatedPayment]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Resumen de la sesión</Text>
          <Text style={styles.headerSubtitle}>
            {bookingCode ? `Reserva ${bookingCode}` : "Servicio finalizado"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen general</Text>

          <Item
            icon="person-outline"
            label="Cliente"
            value={clientName}
          />
          <Item
            icon="calendar-outline"
            label="Fecha"
            value={date}
          />
          <Item
            icon="time-outline"
            label="Hora de entrada"
            value={formatTimestamp(checkInTimeRaw)}
          />
          <Item
            icon="time-outline"
            label="Hora de salida"
            value={formatTimestamp(checkOutTimeRaw)}
          />
          <Item
            icon="hourglass-outline"
            label="Horas trabajadas"
            value={workedHoursLabel}
          />
          <Item
            icon="checkmark-circle-outline"
            label="Estado"
            value={bookingStatus}
          />
          <Item
            icon="location-outline"
            label="Ubicación"
            value={address}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles del servicio</Text>

          <Item
            icon="time-outline"
            label="Horario programado"
            value={
              scheduledStart && scheduledEnd
                ? `${scheduledStart} - ${scheduledEnd}`
                : "No disponible"
            }
          />
          <Item
            icon="people-outline"
            label="Niños"
            value={
              childrenDetails && childrenDetails.trim() !== ""
                ? childrenDetails
                : `${children} niño${children === 1 ? "" : "s"}`
            }
          />
          <Item
            icon="document-text-outline"
            label="Notas"
            value={notes && notes.trim() !== "" ? notes : "Sin notas"}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pago</Text>

          <Item
            icon="wallet-outline"
            label="Método de pago"
            value={paymentMethod}
          />
          <Item
            icon="cash-outline"
            label="Tarifa por hora"
            value={formatMoney(hourlyRate)}
          />
          <Item
            icon="alarm-outline"
            label="Horas programadas"
            value={`${scheduledHours || 0} h`}
          />

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total estimado/final</Text>
            <Text style={styles.totalValue}>{formatMoney(calculatedTotal)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: "./BabysitterInvoice",
              params: {
                ...params,
              },
            })
          }
        >
          <Text style={styles.primaryButtonText}>Continuar a pago / factura</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace("./BabysitterDashboard")}
        >
          <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Item({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.item}>
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={20} color="#886BC1" />
      </View>

      <View style={styles.itemContent}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: "#886BC1",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 14,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F6D9F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: "#2E2E2E",
    fontWeight: "600",
    lineHeight: 21,
  },
  totalBox: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#886BC1",
  },
  primaryButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#FF768A",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#EEE",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#444",
    fontSize: 15,
    fontWeight: "700",
  },
});

