import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../../../constants/apiConfig";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  QrCode,
  AlertCircle,
  Timer,
  CheckCircle2,
  Baby,
  Info,
  Receipt,
  ThumbsUp,
} from "lucide-react-native";

export default function ClientJobTracking() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);

  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isExtraTime, setIsExtraTime] = useState(false);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmingFinish, setConfirmingFinish] = useState(false);

  const fetchBookingDetail = async () => {
    const bId = params.bookingId as string;
    if (!bId || bId === "undefined" || bId === "[bookingId]") return;

    try {
      const url = ENDPOINTS.get_detalle_reserva(bId);
      const response = await axios.get(url);
      if (response.data) {
        setBooking(response.data);
      }
    } catch (error: any) {
      console.error("Error API Nani:", error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
    const interval = setInterval(fetchBookingDetail, 30000);
    return () => clearInterval(interval);
  }, [params.bookingId]);

  useEffect(() => {
    if (booking?.status !== "en_progreso") return;

    const timer = setInterval(() => {
      const ahora = new Date().getTime();
      const finProgramado = new Date(
        `${booking.fecha_servicio}T${booking.hora_fin}`,
      ).getTime();
      const diferencia = finProgramado - ahora;

      if (diferencia > 0) {
        const h = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diferencia / (1000 * 60)) % 60);
        const s = Math.floor((diferencia / 1000) % 60);
        setTimeLeft(
          `${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`,
        );
        setIsExtraTime(false);
      } else {
        const extra = Math.abs(diferencia);
        const h = Math.floor((extra / (1000 * 60 * 60)) % 24);
        const m = Math.floor((extra / (1000 * 60)) % 60);
        setTimeLeft(`+ ${h}h ${m}m`);
        setIsExtraTime(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking?.status, booking?.hora_fin]);

  const qrValue = useMemo(() => {
    if (!booking || !booking.id) return "invalid";

    const ahora = new Date().getTime();
    const inicioServicio = new Date(
      `${booking.fecha_servicio}T${booking.hora_inicio}`,
    ).getTime();

    const UNA_HORA_EN_MS = 3600000;

    if (
      ahora < inicioServicio - UNA_HORA_EN_MS &&
      booking.status !== "en_progreso"
    ) {
      return "too_early";
    }

    const typeAction =
      booking.status === "en_progreso" ? "checkout" : "checkin";

    return JSON.stringify({
      type: typeAction,
      bookingId: booking.id,
      codigo_reserva: booking.codigo_reserva,
      timestamp: Date.now(),
    });
  }, [booking?.status, booking?.fecha_servicio, booking?.hora_inicio, showQR]);

  const canConfirmFinish = useMemo(() => {
    if (!booking) return false;
    const elegibleStatus = ["completada", "pendiente_confirmacion"];
    if (!elegibleStatus.includes(booking.status)) return false;

    if (booking.cliente_confirmo_finalizacion) return false;

    if (!booking.hora_salida_real) return true;
    const salida = new Date(booking.hora_salida_real).getTime();
    const veinticuatroHoras = 24 * 60 * 60 * 1000;
    return Date.now() - salida < veinticuatroHoras;
  }, [booking]);

  const alreadyConfirmed = booking?.cliente_confirmo_finalizacion === true;

  const handleConfirmFinish = async () => {
    try {
      setConfirmingFinish(true);
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(
        ENDPOINTS.confirmar_finalizacion(booking.id),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();
      if (response.ok) {
        setConfirmModalVisible(false);

        // 1. Mostrar alerta de éxito
        Alert.alert(
          "¡Confirmado!",
          "Has confirmado la finalización del servicio.",
          [
            {
              text: "Ver Resumen",
              onPress: () => {
                router.replace({
                  pathname: "/register/client/home",
                  params: { bookingId: booking.id },
                });
              },
            },
          ],
        );
      } else {
        Alert.alert("Error", result.message || "No se pudo confirmar.");
      }
    } catch {
      Alert.alert("Error", "No pudimos conectar con el servidor.");
    } finally {
      setConfirmingFinish(false);
    }
  };

  if (loading && !booking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#886BC1" />
        <Text style={styles.loadingText}>Sincronizando con Nani...</Text>
      </View>
    );
  }

  const isCompleted =
    booking?.status === "finalizada" || booking?.status === "finalizado";
  const canShowQR =
    booking?.status === "confirmada" || booking?.status === "en_progreso";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <LinearGradient colors={["#886BC1", "#FF768A"]} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Detalles de la Reserva</Text>
              <Text style={styles.headerSubtitle}>
                {booking?.codigo_reserva}
              </Text>
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              {isCompleted || alreadyConfirmed ? (
                <CheckCircle2 size={24} color="#FFF" />
              ) : (
                <Timer size={24} color="#FFF" />
              )}
            </View>
            <View>
              <Text style={styles.statusLabel}>Estado del Servicio</Text>
              <Text style={styles.statusText}>
                {booking?.status?.toUpperCase() || "BUSCANDO..."}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* ── BANNER CONFIRMACIÓN FINALIZACIÓN ───────────────────────── */}
          {canConfirmFinish && (
            <View style={styles.confirmBanner}>
              <View style={styles.confirmBannerTop}>
                <ThumbsUp size={22} color="#886BC1" />
                <Text style={styles.confirmBannerTitle}>
                  ¿El servicio finalizó correctamente?
                </Text>
              </View>
              <Text style={styles.confirmBannerText}>
                La niñera marcó el fin del servicio. Por favor confirma la
                finalización dentro de las próximas 24 horas. Esto permite
                calcular el total real y cerrar la reserva.
              </Text>
              <TouchableOpacity
                style={styles.confirmBannerButton}
                onPress={() => setConfirmModalVisible(true)}
              >
                <CheckCircle2 size={18} color="white" />
                <Text style={styles.confirmBannerButtonText}>
                  Confirmar finalización
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {alreadyConfirmed && (
            <View style={styles.confirmedBadge}>
              <CheckCircle2 size={18} color="#16A34A" />
              <Text style={styles.confirmedBadgeText}>
                Finalizació confirmada por ti ✓
              </Text>
            </View>
          )}

          {/* CÁLCULO FINAL — visible después de confirmar o al completarse */}
          {(alreadyConfirmed || isCompleted) &&
            booking?.tiempo_total_trabajado && (
              <View style={styles.finalCalcCard}>
                <Text style={styles.finalCalcTitle}>Resumen Final</Text>

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Hora de entrada real</Text>
                  <Text style={styles.paymentValue}>
                    {booking.hora_entrada_real
                      ? new Date(booking.hora_entrada_real).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "—"}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Hora de salida real</Text>
                  <Text style={styles.paymentValue}>
                    {booking.hora_salida_real
                      ? new Date(booking.hora_salida_real).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "—"}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Horas trabajadas</Text>
                  <Text style={styles.paymentValue}>
                    {parseFloat(booking.tiempo_total_trabajado).toFixed(2)} h
                  </Text>
                </View>
                <View style={[styles.paymentRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Final</Text>
                  <Text style={styles.totalValue}>
                    L.{" "}
                    {Number(
                      booking?.total_calculado || booking?.total || 0,
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

          {/* UBICACIÓN */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <MapPin size={18} color="#886BC1" />
              <Text style={styles.cardTitle}>Lugar del Servicio</Text>
            </View>
            <Text style={styles.addressText}>
              {booking?.address || "No especificada"}
            </Text>
            {booking?.puntoReferencia ? (
              <View style={styles.referenceContainer}>
                <Info size={14} color="#666" />
                <Text style={styles.referenceText}>
                  Ref: {booking.puntoReferencia}
                </Text>
              </View>
            ) : null}
          </View>

          {/* CRONÓMETRO */}
          {booking?.status === "en_progreso" && (
            <View style={[styles.card, styles.timerCard]}>
              <Text style={styles.timerLabel}>TIEMPO RESTANTE</Text>
              <Text
                style={[styles.timerValue, isExtraTime && { color: "#FF768A" }]}
              >
                {timeLeft}
              </Text>
              {isExtraTime && (
                <Text
                  style={{ color: "#FF768A", fontSize: 12, fontWeight: "600" }}
                >
                  Tiempo extra en curso
                </Text>
              )}
            </View>
          )}

          {/* NIÑERA */}
          {booking?.babysitter && (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Baby size={18} color="#886BC1" />
                <Text style={styles.cardTitle}>Niñera Asignada</Text>
              </View>
              <View style={styles.babysitterRow}>
                <Image
                  source={{
                    uri:
                      booking.babysitter?.photo ||
                      "https://via.placeholder.com/150",
                  }}
                  style={styles.babysitterImage}
                />
                <View style={styles.babysitterInfo}>
                  <Text style={styles.babysitterName}>
                    {booking.babysitter?.name}
                  </Text>
                  {booking.babysitter?.phone && (
                    <View style={styles.infoRow}>
                      <Phone size={14} color="#886BC1" />
                      <Text style={styles.infoText}>
                        {booking.babysitter.phone}
                      </Text>
                    </View>
                  )}
                </View>
                {booking.babysitter?.phone && (
                  <TouchableOpacity
                    style={styles.miniActionBtn}
                    onPress={() =>
                      Linking.openURL(`tel:${booking.babysitter.phone}`)
                    }
                  >
                    <Phone size={18} color="#886BC1" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* PAGO */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Receipt size={18} color="#886BC1" />
              <Text style={styles.cardTitle}>Detalles de Pago</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Método</Text>
              <Text style={styles.paymentValue}>
                {booking?.paymentMethod || "No especificado"}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tarifa por hora</Text>
              <Text style={styles.paymentValue}>
                L. {Number(booking?.hourlyRate || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Horas programadas</Text>
              <Text style={styles.paymentValue}>
                {booking?.duracion_horas || 0} h
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Subtotal base</Text>
              <Text style={styles.paymentValue}>
                L. {Number(booking?.baseAmount || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Comisión Plataforma</Text>
              <Text style={styles.paymentValue}>
                L. {Number(booking?.feeAmount || 0).toFixed(2)}
              </Text>
            </View>
            {Number(booking?.cargo_tiempo_adicional || 0) > 0 && (
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, { color: "#FF768A" }]}>
                  Tiempo Extra
                </Text>
                <Text style={[styles.paymentValue, { color: "#FF768A" }]}>
                  + L. {Number(booking.cargo_tiempo_adicional).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Propina</Text>
              <Text style={styles.paymentValue}>
                L. {Number(booking?.tip || 0).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.paymentRow, styles.totalRow]}>
              <View>
                <Text style={styles.totalLabel}>Total Final</Text>
                <Text style={styles.paymentStatusBadge}>
                  {booking?.paymentStatus?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.totalValue}>
                L. {Number(booking?.total || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* QR — solo cuando el servicio no ha finalizado */}
          {!isCompleted && !canConfirmFinish && (
            <View style={styles.qrContainer}>
              {canShowQR ? (
                !showQR ? (
                  <TouchableOpacity
                    style={[
                      styles.generateQRButton,
                      booking?.status === "en_progreso" && {
                        backgroundColor: "#886BC1",
                      },
                    ]}
                    onPress={() => {
                      const ahora = new Date().getTime();
                      const inicio = new Date(
                        `${booking.fecha_servicio}T${booking.hora_inicio}`,
                      ).getTime();
                      const UNA_HORA_EN_MS = 3600000;

                      if (
                        ahora < inicio - UNA_HORA_EN_MS &&
                        booking.status !== "en_progreso"
                      ) {
                        Alert.alert(
                          "Aún es muy pronto",
                          `Podrás generar el QR 1 hora antes del servicio.`,
                        );
                      } else {
                        setShowQR(true);
                      }
                    }}
                  >
                    <QrCode size={20} color="#FFF" />
                    <Text style={styles.generateQRButtonText}>
                      {booking?.status === "en_progreso"
                        ? "Generar QR de Salida"
                        : "Generar QR de Entrada"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.qrCard,
                      booking?.status === "en_progreso" && {
                        borderColor: "#886BC1",
                      },
                    ]}
                  >
                    <Text style={styles.qrCardTitle}>
                      {booking?.status === "en_progreso"
                        ? "Check-out de Servicio"
                        : "Check-in de Entrada"}
                    </Text>

                    {qrValue !== "too_early" ? (
                      <>
                        <QRCode value={qrValue} size={180} />
                        <Text style={styles.qrInstruction}>
                          Muestra este código a la niñera para validar
                        </Text>
                      </>
                    ) : (
                      <View style={{ alignItems: "center", padding: 10 }}>
                        <Clock size={32} color="#FF768A" />
                        <Text
                          style={[
                            styles.qrInstruction,
                            { textAlign: "center", color: "#FF768A" },
                          ]}
                        >
                          El código estará disponible 1 hora antes del inicio
                          del servicio.
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => setShowQR(false)}
                      style={styles.hideQRBtn}
                    >
                      <Text style={styles.hideQRText}>Ocultar</Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <View style={styles.pendingNotice}>
                  <AlertCircle size={20} color="#FF768A" />
                  <Text style={styles.pendingNoticeText}>
                    El QR de validación se activará cuando la niñera confirme tu
                    solicitud.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── MODAL CONFIRMACIÓN FINALIZACIÓN ──────────────────────────────── */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <CheckCircle2 size={44} color="#886BC1" />
            </View>

            <Text style={styles.modalTitle}>Confirmar finalización</Text>
            <Text style={styles.modalText}>
              Al confirmar, se cerrará la reserva y se calculará el costo final
              basado en las horas reales trabajadas por la niñera. Esta acción
              no se puede deshacer.
            </Text>

            {booking?.tiempo_total_trabajado && (
              <View style={styles.modalSummaryBox}>
                <Text style={styles.modalSummaryLabel}>
                  Horas registradas por la niñera:
                </Text>
                <Text style={styles.modalSummaryValue}>
                  {parseFloat(booking.tiempo_total_trabajado).toFixed(2)} h
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmModalVisible(false)}
                disabled={confirmingFinish}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  confirmingFinish && styles.disabledBtn,
                ]}
                onPress={handleConfirmFinish}
                disabled={confirmingFinish}
              >
                {confirmingFinish ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmBtnText}>Sí, confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#886BC1", fontWeight: "600" },
  scrollContent: { paddingBottom: 40 },
  header: {
    padding: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 15,
    padding: 15,
  },
  statusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statusLabel: { color: "#FFF", fontSize: 12, opacity: 0.8 },
  statusText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#333" },
  addressText: { fontSize: 14, color: "#444", lineHeight: 20 },
  referenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#F8F9FA",
    padding: 10,
    borderRadius: 10,
  },
  referenceText: { fontSize: 12, color: "#666", flex: 1 },
  timerCard: { alignItems: "center", borderColor: "#886BC1", borderWidth: 1 },
  timerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 1,
  },
  timerValue: {
    fontSize: 38,
    fontWeight: "900",
    color: "#886BC1",
    marginVertical: 5,
  },
  babysitterRow: { flexDirection: "row", alignItems: "center" },
  babysitterImage: { width: 55, height: 55, borderRadius: 28, marginRight: 15 },
  babysitterInfo: { flex: 1 },
  babysitterName: { fontSize: 16, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  infoText: { fontSize: 13, color: "#666", marginLeft: 6 },
  miniActionBtn: { padding: 10, backgroundColor: "#F3E8FF", borderRadius: 12 },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paymentLabel: { color: "#666", fontSize: 14 },
  paymentValue: { fontWeight: "600", color: "#333" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#333" },
  paymentStatusBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#886BC1",
    marginTop: 2,
  },
  totalValue: { fontSize: 20, fontWeight: "800", color: "#886BC1" },

  qrContainer: { marginTop: 10 },
  generateQRButton: {
    backgroundColor: "#FF768A",
    padding: 18,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  generateQRButtonText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  qrCard: {
    backgroundColor: "#FFF",
    padding: 25,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#886BC1",
    borderStyle: "dashed",
  },
  qrCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 20,
    color: "#333",
  },
  qrInstruction: { marginTop: 15, color: "#888", fontSize: 12 },
  hideQRBtn: { marginTop: 20 },
  hideQRText: { color: "#886BC1", fontWeight: "700" },
  pendingNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF0F2",
    padding: 15,
    borderRadius: 15,
  },
  pendingNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },

  // ── Confirmación de finalización ──────────────────────────────────────
  confirmBanner: {
    backgroundColor: "#F0EBFB",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#C4B5E8",
    gap: 10,
  },
  confirmBannerTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  confirmBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#886BC1",
    flex: 1,
  },
  confirmBannerText: { fontSize: 13, color: "#555", lineHeight: 20 },
  confirmBannerButton: {
    backgroundColor: "#886BC1",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  confirmBannerButtonText: { color: "white", fontWeight: "700", fontSize: 14 },

  confirmedBadge: {
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confirmedBadgeText: { color: "#16A34A", fontWeight: "600", fontSize: 14 },

  finalCalcCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#886BC1",
    elevation: 2,
    shadowColor: "#886BC1",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  finalCalcTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#886BC1",
    marginBottom: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0EBFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  modalSummaryBox: {
    backgroundColor: "#F6F0FF",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  modalSummaryLabel: { fontSize: 13, color: "#777", marginBottom: 4 },
  modalSummaryValue: { fontSize: 22, fontWeight: "800", color: "#886BC1" },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
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
