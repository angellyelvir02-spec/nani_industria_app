import { router, useLocalSearchParams } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  MessageSquare,
  Star,
} from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SessionSummary() {
  const {
    bookingId,
    clientName,
    clientPhoto,
    scheduledHours,
    hourlyRate,
    checkInTime,
    checkOutTime,
    totalHours,
  } = useLocalSearchParams();

  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");

  const checkInDate = new Date(Number(checkInTime));
  const checkOutDate = new Date(Number(checkOutTime));

  const scheduled = Number(scheduledHours);
  const rate = Number(hourlyRate);
  const workedHours = Number(totalHours);

  const overtimeHours = Math.max(0, workedHours - scheduled);

  const basePay = scheduled * rate;
  const overtimePay = overtimeHours * rate;

  const lateParentMinutes = 15;
  const lateParentHours = lateParentMinutes / 60;
  const lateParentPay = lateParentHours * rate;

  const totalPayment = basePay + overtimePay + lateParentPay;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const handleSubmit = () => {
    console.log({ rating, comments, totalPayment });

    router.replace("./BabysitterDashboard");
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("./BabysitterDashboard")}
        >
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Resumen de Sesión</Text>
        <Text style={styles.headerSubtitle}>Trabajo completado</Text>

        <View style={styles.successBox}>
          <CheckCircle color="#fff" size={24} />
          <View>
            <Text style={styles.successTitle}>Sesión Finalizada</Text>
            <Text style={styles.successText}>Reserva #{bookingId}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* CLIENT INFO */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Image
              source={{ uri: clientPhoto as string }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.clientName}>{clientName}</Text>
              <Text style={styles.grayText}>Cliente</Text>
            </View>
          </View>
        </View>

        {/* TIME DETAILS */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Clock color="#886BC1" size={20} />
            <Text style={styles.cardTitle}>Registro de Tiempo</Text>
          </View>

          <View style={styles.timeRow}>
            <View>
              <Text style={styles.label}>Hora de entrada</Text>
              <Text style={styles.value}>{formatTime(checkInDate)}</Text>
            </View>

            <View>
              <Text style={styles.label}>Hora de salida</Text>
              <Text style={styles.value}>{formatTime(checkOutDate)}</Text>
            </View>
          </View>

          <View style={styles.totalTime}>
            <Text style={styles.grayText}>Tiempo total trabajado</Text>
            <Text style={styles.totalHours}>{formatDuration(workedHours)}</Text>
          </View>
        </View>

        {/* PAYMENT */}
        <View style={styles.card}>
          <View style={styles.row}>
            <DollarSign color="#886BC1" size={20} />
            <Text style={styles.cardTitle}>Desglose de Pago</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text>Horas programadas</Text>
            <Text>${basePay.toFixed(2)}</Text>
          </View>

          {overtimeHours > 0 && (
            <View style={styles.paymentRow}>
              <Text style={{ color: "#EA580C" }}>
                Horas extra ({formatDuration(overtimeHours)})
              </Text>
              <Text style={{ color: "#EA580C" }}>
                +${overtimePay.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.paymentRow}>
            <Text>Espera del cliente</Text>
            <Text>+${lateParentPay.toFixed(2)}</Text>
          </View>

          <View style={styles.totalPaymentRow}>
            <Text style={styles.totalLabel}>Total a recibir</Text>
            <Text style={styles.totalPayment}>${totalPayment.toFixed(2)}</Text>
          </View>
        </View>

        {/* NOTICE */}
        {(overtimeHours > 0 || lateParentMinutes > 0) && (
          <View style={styles.noticeBox}>
            <AlertCircle color="#FF768A" size={20} />
            <Text style={styles.noticeText}>
              {overtimeHours > 0 &&
                `Se trabajó ${formatDuration(overtimeHours)} extra. `}
              {`El cliente tardó ${lateParentMinutes} minutos en confirmar salida.`}
            </Text>
          </View>
        )}

        {/* RATING */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Star color="#886BC1" size={20} />
            <Text style={styles.cardTitle}>Calificar al Cliente</Text>
          </View>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Star
                  size={36}
                  color={star <= rating ? "#FF768A" : "#CCC"}
                  fill={star <= rating ? "#FF768A" : "none"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* COMMENTS */}
        <View style={styles.card}>
          <View style={styles.row}>
            <MessageSquare color="#886BC1" size={20} />
            <Text style={styles.cardTitle}>Comentarios</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Comparte tu experiencia..."
            multiline
            value={comments}
            onChangeText={setComments}
          />
        </View>

        {/* SUBMIT */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Finalizar y Enviar</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            El pago será depositado en tu cuenta en 24-48 horas.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  header: {
    backgroundColor: "#886BC1",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  backBtn: { marginBottom: 10 },

  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },

  headerSubtitle: { color: "#fff", opacity: 0.8 },

  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 20,
  },

  successTitle: { color: "#fff", fontWeight: "600" },

  successText: { color: "#fff", opacity: 0.8 },

  content: { padding: 20, gap: 20 },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
  },

  row: { flexDirection: "row", alignItems: "center", gap: 8 },

  avatar: { width: 60, height: 60, borderRadius: 30 },

  clientName: { fontSize: 18, fontWeight: "600" },

  grayText: { color: "#666" },

  cardTitle: { fontSize: 16, fontWeight: "600" },

  label: { fontSize: 12, color: "#888" },

  value: { fontSize: 16 },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  totalTime: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  totalHours: { color: "#886BC1", fontSize: 20, fontWeight: "bold" },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  totalPaymentRow: {
    borderTopWidth: 1,
    borderColor: "#eee",
    marginTop: 10,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  totalLabel: { fontSize: 18, fontWeight: "600" },

  totalPayment: { fontSize: 26, fontWeight: "bold", color: "#886BC1" },

  noticeBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFF1F2",
    padding: 15,
    borderRadius: 15,
  },

  noticeText: { fontSize: 12, color: "#444", flex: 1 },

  stars: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    gap: 10,
  },

  input: {
    marginTop: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
  },

  submitBtn: {
    backgroundColor: "#FF768A",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
  },

  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  infoBox: {
    backgroundColor: "#F6D9F1",
    padding: 15,
    borderRadius: 15,
  },

  infoText: { textAlign: "center", fontSize: 12, color: "#555" },
});
