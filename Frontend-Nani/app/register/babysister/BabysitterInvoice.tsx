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

export default function BabysitterInvoice() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const clientName = String(
    params.clientName || params.nombreCliente || "Cliente"
  );
  const bookingCode = String(params.bookingCode || params.codigo_reserva || "");
  const date = String(params.date || params.fecha || "No disponible");
  const address = String(params.address || params.ubicacion || "No disponible");
  const paymentMethod = String(
    params.paymentMethod || params.metodoPago || "No especificado"
  );

  const scheduledStart = String(
    params.scheduledStart || params.horaInicio || ""
  );
  const scheduledEnd = String(params.scheduledEnd || params.horaFin || "");

  const scheduledHours = Number(params.scheduledHours || 0);
  const hourlyRate = Number(params.hourlyRate || 0);
  const totalHours = Number(params.totalHours || 0);
  const payment = Number(params.payment || 0);

  const checkInTimeRaw = String(params.checkInTime || "");
  const checkOutTimeRaw = String(params.checkOutTime || "");

  const formatTimestamp = (value: string) => {
    if (!value || Number.isNaN(Number(value))) return "No disponible";

    const d = new Date(Number(value));
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (value: number) => `L. ${Number(value || 0).toFixed(2)}`;

  const subtotal = useMemo(() => {
    if (hourlyRate > 0 && totalHours > 0) return hourlyRate * totalHours;
    return payment;
  }, [hourlyRate, totalHours, payment]);

  const extraHours = useMemo(() => {
    const extra = totalHours - scheduledHours;
    return extra > 0 ? extra : 0;
  }, [totalHours, scheduledHours]);

  const extraCharge = useMemo(() => {
    if (extraHours <= 0 || hourlyRate <= 0) return 0;
    return extraHours * hourlyRate;
  }, [extraHours, hourlyRate]);

  const baseScheduledAmount = useMemo(() => {
    if (scheduledHours > 0 && hourlyRate > 0) return scheduledHours * hourlyRate;
    return payment;
  }, [scheduledHours, hourlyRate, payment]);

  const finalTotal = useMemo(() => {
    if (extraHours > 0) return baseScheduledAmount + extraCharge;
    return subtotal;
  }, [extraHours, baseScheduledAmount, extraCharge, subtotal]);

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

          <Text style={styles.headerTitle}>Factura del servicio</Text>
          <Text style={styles.headerSubtitle}>
            {bookingCode ? `Reserva ${bookingCode}` : "Servicio finalizado"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos generales</Text>

          <Item icon="person-outline" label="Cliente" value={clientName} />
          <Item icon="calendar-outline" label="Fecha" value={date} />
          <Item
            icon="location-outline"
            label="Ubicación"
            value={address}
          />
          <Item
            icon="card-outline"
            label="Método de pago"
            value={paymentMethod}
          />
          <Item
            icon="checkmark-circle-outline"
            label="Estado"
            value="Finalizado"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalle de la sesión</Text>

          <Item
            icon="log-in-outline"
            label="Hora de entrada"
            value={formatTimestamp(checkInTimeRaw)}
          />
          <Item
            icon="log-out-outline"
            label="Hora de salida"
            value={formatTimestamp(checkOutTimeRaw)}
          />
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
            icon="hourglass-outline"
            label="Horas programadas"
            value={`${scheduledHours.toFixed(2)} h`}
          />
          <Item
            icon="timer-outline"
            label="Horas trabajadas"
            value={`${totalHours.toFixed(2)} h`}
          />
          <Item
            icon="flash-outline"
            label="Tiempo extra"
            value={`${extraHours.toFixed(2)} h`}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de cobro</Text>

          <Row label="Tarifa por hora" value={formatMoney(hourlyRate)} />
          <Row
            label="Monto base programado"
            value={formatMoney(baseScheduledAmount)}
          />
          <Row
            label="Cargo por tiempo extra"
            value={formatMoney(extraCharge)}
          />

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total final</Text>
            <Text style={styles.totalValue}>{formatMoney(finalTotal)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("./BabysitterDashboard")}
        >
          <Text style={styles.primaryButtonText}>Volver al dashboard</Text>
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
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemValue}>{value}</Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.simpleRow}>
      <Text style={styles.simpleRowLabel}>{label}</Text>
      <Text style={styles.simpleRowValue}>{value}</Text>
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
  itemLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 15,
    color: "#2E2E2E",
    fontWeight: "600",
    lineHeight: 21,
  },
  simpleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  simpleRowLabel: {
    color: "#666",
    fontSize: 14,
    flex: 1,
  },
  simpleRowValue: {
    color: "#2E2E2E",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: "#2E2E2E",
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    color: "#886BC1",
    fontSize: 28,
    fontWeight: "800",
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
});