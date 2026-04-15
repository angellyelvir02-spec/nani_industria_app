import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  AppState,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../../../constants/apiConfig";
import {
  ArrowLeft,
  Calendar,
  Clock3,
  MapPin,
  Star,
  MessageCircle,
  CheckCircle2,
  XCircle,
  QrCode,
  Timer,
} from "lucide-react-native";
type BookingStatus =
  | "confirmed"
  | "pending"
  | "completed"
  | "cancelled"
  | "en_progreso"
  | "rejected";

export default function BookingsListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sendingReview, setSendingReview] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState(""); // Cambiado de 'reason' a 'cancelReason'
  const [sendingCancel, setSendingCancel] = useState(false); // Esta te faltaba
  const [cancelWarning, setCancelWarning] = useState<string | null>(null); //

  const fetchBookings = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await fetch(ENDPOINTS.get_mis_reservas_detalle(userId));
      const data = await response.json();

      if (!response.ok) {
        setBookings([]);
        return;
      }

      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        babysitter: item.babysitter,
        ninera_id: item.ninera_id,
        photo: item.photo,
        date: item.date,
        time: item.time,
        duration: item.duration,
        location: item.location || "Ubicación no especificada",
        status: item.status as BookingStatus,
        amount: item.amount,
        rating: item.rating ?? 0.0,
        reviewed: item.reviewed || false,
        motivo_rechazo: item.motivo_rechazo || null,
        motivo_cancelacion: item.motivo_cancelacion || null,
      }));

      setBookings(mapped);
    } catch (error) {
      console.log("Error fetchBookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const handlePostReview = async () => {
    const comentarioLimpio = comment.trim();
    if (!comentarioLimpio) {
      Alert.alert("Atención", "Por favor, escribe un comentario.");
      return;
    }

    try {
      setSendingReview(true);
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(ENDPOINTS.crear_resena, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reserva_id: selectedBooking.id,
          ninera_id: selectedBooking.ninera_id,
          puntuacion: rating,
          comentario: comentarioLimpio,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert("¡Gracias!", "Tu reseña ha sido publicada.");
        setModalVisible(false);
        setComment("");
        setRating(5);
        await fetchBookings();
      } else {
        Alert.alert("Atención", result.message || "Error al publicar reseña.");
      }
    } catch (error) {
      Alert.alert("Error", "No pudimos conectar con el servidor.");
    } finally {
      setSendingReview(false);
    }
  };
  const handleCancelBooking = async () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      Alert.alert(
        "Atención",
        "Por favor escribe un motivo (mínimo 5 caracteres).",
      );
      return;
    }
    try {
      setSendingCancel(true);
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(
        ENDPOINTS.cancelar_reserva(selectedBooking.id),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ motivo_cancelacion: cancelReason.trim() }),
        },
      );
      const result = await response.json();
      if (response.ok) {
        if (result.advertencia) {
          Alert.alert("Reserva cancelada", result.advertencia);
        } else {
          Alert.alert(
            "Reserva cancelada",
            "Tu reserva ha sido cancelada exitosamente.",
          );
        }
        setCancelModalVisible(false);
        setCancelReason("");
        await fetchBookings();
      } else {
        Alert.alert(
          "Error",
          result.message || "No se pudo cancelar la reserva.",
        );
      }
    } catch {
      Alert.alert("Error", "No pudimos conectar con el servidor.");
    } finally {
      setSendingCancel(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        fetchBookings();
      }
    });

    return () => sub.remove();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusBadge = (status: BookingStatus) => {
    const badges = {
      confirmed: {
        bg: "#ECFDF5",
        color: "#16A34A",
        icon: <CheckCircle2 size={12} color="#16A34A" />,
        label: "Confirmada",
      },
      en_progreso: {
        bg: "#F3E8FF",
        color: "#886BC1",
        icon: <Timer size={12} color="#886BC1" />,
        label: "En curso",
      },
      pending: {
        bg: "#FEFCE8",
        color: "#CA8A04",
        icon: <Clock3 size={12} color="#CA8A04" />,
        label: "Pendiente",
      },
      completed: {
        bg: "#F6D9F1",
        color: "#886BC1",
        icon: <CheckCircle2 size={12} color="#886BC1" />,
        label: "Completada",
      },
      cancelled: {
        bg: "#FEF2F2",
        color: "#eb7d7d",
        icon: <XCircle size={12} color="#f09292" />,
        label: "Cancelada",
      },
      rejected: {
        bg: "#FFF1F0",
        color: "#DC2626",
        icon: <XCircle size={12} color="#DC2626" />,
        label: "Rechazada",
      },
    };
    const config = badges[status] || badges.pending;
    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        {config.icon}
        <Text style={[styles.badgeText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const upcomingBookings = bookings.filter((b) => {
    return (
      b.status === "confirmed" ||
      b.status === "pending" ||
      b.status === "en_progreso"
    );
  });

  const pastBookings = bookings.filter((b) => {
    return (
      b.status === "completed" ||
      b.status === "cancelled" ||
      b.status === "rejected"
    );
  });

  if (loading && !refreshing) {
    return (
      <View style={[styles.safeArea, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#886BC1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#886BC1"
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis reservas</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas</Text>
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <View key={booking.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Image
                    source={{ uri: booking.photo }}
                    style={styles.avatar}
                  />
                  <View style={styles.cardTopInfo}>
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.nameText} numberOfLines={1}>
                          {booking.babysitter}
                        </Text>
                        <View style={styles.ratingRow}>
                          <Star size={12} color="#FF768A" fill="#FF768A" />
                          <Text style={styles.ratingText}>
                            {booking.rating}
                          </Text>
                        </View>
                      </View>
                      {getStatusBadge(booking.status)}
                    </View>
                  </View>
                </View>

                <View style={styles.bookingInfoGroup}>
                  <View style={styles.bookingInfoRow}>
                    <Calendar size={16} color="#886BC1" />
                    <Text style={styles.bookingInfoText}>{booking.date}</Text>
                  </View>
                  <View style={styles.bookingInfoRow}>
                    <Clock3 size={16} color="#886BC1" />
                    <Text style={styles.bookingInfoText}>
                      {booking.time} ({booking.duration})
                    </Text>
                  </View>
                  <View style={styles.bookingInfoRow}>
                    <MapPin size={16} color="#886BC1" />
                    <Text style={styles.bookingInfoText} numberOfLines={1}>
                      {booking.location}
                    </Text>
                  </View>
                </View>

                {booking.status === "confirmed" && (
                  <View style={styles.qrButtonsRow}>
                    <TouchableOpacity
                      style={styles.qrEntryButton}
                      onPress={() =>
                        router.push({
                          pathname: "/register/client/ClientActiveSession",
                          params: { bookingId: booking.id },
                        })
                      }
                    >
                      <QrCode size={16} color="#16A34A" />
                      <Text style={styles.qrEntryButtonText}>Entrada</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {booking.status === "confirmed" && (
                  <TouchableOpacity
                    style={styles.cancelBookingButton}
                    onPress={() => {
                      setSelectedBooking(booking);
                      setCancelModalVisible(true);
                    }}
                  >
                    <XCircle size={14} color="#e67d7d" />
                    <Text style={styles.cancelBookingText}>
                      Cancelar reserva
                    </Text>
                  </TouchableOpacity>
                )}

                {booking.status === "en_progreso" && (
                  <View style={styles.qrButtonsRow}>
                    <TouchableOpacity
                      style={styles.qrExitButton}
                      onPress={() =>
                        router.push({
                          pathname: "/register/client/ClientJobTracking",
                          params: { bookingId: booking.id },
                        })
                      }
                    >
                      <QrCode size={16} color="#EA580C" />
                      <Text style={styles.qrExitButtonText}>Salida</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.amountText}>{booking.amount}</Text>
                  <View style={styles.cardFooterActions}>
                    <TouchableOpacity style={styles.chatButton}>
                      <MessageCircle size={16} color="#886BC1" />
                      <Text style={styles.chatButtonText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() =>
                        router.push({
                          pathname: "/register/client/ClientActiveSession",
                          params: { bookingId: booking.id },
                        })
                      }
                    >
                      <Text style={styles.detailsButtonText}>Ver detalles</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyTextSeccion}>
              No hay reservas próximas
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial</Text>
          {pastBookings.length > 0 ? (
            pastBookings.map((booking) => (
              <View key={booking.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Image
                    source={{ uri: booking.photo }}
                    style={styles.avatar}
                  />
                  <View style={styles.cardTopInfo}>
                    <View style={styles.cardTopRow}>
                      <Text
                        style={[styles.nameText, { flex: 1 }]}
                        numberOfLines={1}
                      >
                        {booking.babysitter}
                      </Text>
                      {getStatusBadge(booking.status)}
                    </View>
                  </View>
                </View>

                {booking.status === "rejected" && (
                  <View style={styles.rejectionNote}>
                    <XCircle size={14} color="#DC2626" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rejectionText}>
                        Motivo: {booking.motivo_rechazo || "No especificado"}
                      </Text>
                      <Text
                        style={[
                          styles.rejectionText,
                          { fontSize: 11, marginTop: 2 },
                        ]}
                      >
                        Fecha: {booking.date}
                      </Text>
                    </View>
                  </View>
                )}
                {booking.status === "cancelled" && (
                  <View
                    style={[
                      styles.rejectionNote,
                      {
                        backgroundColor: "#f1daf1",
                        borderColor: "#ad1e77",
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <XCircle size={14} color="#6B7280" />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.rejectionText,
                          { color: "#4B5563", fontWeight: "700" },
                        ]}
                      >
                        Reserva Cancelada
                      </Text>
                      <Text
                        style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}
                      >
                        Motivo:{" "}
                        {booking.motivo_cancelacion ||
                          "No se especificó un motivo"}
                      </Text>
                    </View>
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <Text style={styles.historyAmountText}>{booking.amount}</Text>
                  <TouchableOpacity
                    style={
                      booking.reviewed
                        ? styles.reviewedButton
                        : styles.reviewButton
                    }
                    onPress={() => {
                      if (!booking.reviewed) {
                        setSelectedBooking(booking);
                        setModalVisible(true);
                      }
                    }}
                    disabled={booking.reviewed}
                  >
                    <Text
                      style={
                        booking.reviewed
                          ? styles.reviewedButtonText
                          : styles.reviewButtonText
                      }
                    >
                      {booking.reviewed ? "Reseña enviada" : "Dejar reseña"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyTextSeccion}>
              No hay historial disponible
            </Text>
          )}
        </View>
      </ScrollView>
      {/* --- MODAL DE CALIFICACIÓN --- */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Calificar servicio</Text>
            <Text style={styles.modalSubtitle}>
              ¿Cómo fue tu experiencia con {selectedBooking?.babysitter}?
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Star
                    size={32}
                    color={s <= rating ? "#FF768A" : "#D1D5DB"}
                    fill={s <= rating ? "#FF768A" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Escribe tu comentario..."
              multiline
              value={comment}
              onChangeText={setComment}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handlePostReview}
                disabled={sendingReview}
              >
                {sendingReview ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Publicar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={cancelModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancelar reserva</Text>
            <Text style={styles.modalSubtitle}>
              Esta acción no se puede deshacer. Por favor indica el motivo.
            </Text>
            {cancelWarning && (
              <View
                style={{
                  backgroundColor: "#FEF3C7",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "#92400E", fontSize: 12 }}>
                  {cancelWarning}
                </Text>
              </View>
            )}
            <TextInput
              style={styles.textInput}
              placeholder="Motivo de cancelación..."
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: "#DC2626" }]}
                onPress={handleCancelBooking}
                disabled={sendingCancel}
              >
                {sendingCancel ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Confirmar cancelación
                  </Text>
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
  scrollContent: { paddingBottom: 110 },
  header: {
    backgroundColor: "#886BC1",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  section: { paddingHorizontal: 24, marginTop: 24 },
  sectionTitle: {
    color: "#2E2E2E",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F1F1",
    elevation: 2,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 14 },
  cardTop: { flexDirection: "row", marginBottom: 14 },
  cardTopInfo: { flex: 1, justifyContent: "center" },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameText: { color: "#2E2E2E", fontSize: 16, fontWeight: "700" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingText: { color: "#6B7280", fontSize: 12, marginLeft: 4 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 100,
    justifyContent: "center",
  },
  badgeText: { fontSize: 11, marginLeft: 4, fontWeight: "600" },
  bookingInfoGroup: { marginBottom: 14 },
  bookingInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  bookingInfoText: { color: "#6B7280", fontSize: 13, marginLeft: 8, flex: 1 },
  qrButtonsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  qrEntryButton: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  qrEntryButtonText: {
    color: "#16A34A",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  qrExitButton: {
    flex: 1,
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  qrExitButtonText: {
    color: "#EA580C",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
    paddingTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountText: { color: "#886BC1", fontSize: 18, fontWeight: "700" },
  historyAmountText: { color: "#6B7280", fontSize: 15, fontWeight: "600" },
  cardFooterActions: { flexDirection: "row", gap: 8 },
  chatButton: {
    backgroundColor: "#F6D9F1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chatButtonText: {
    color: "#886BC1",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  detailsButton: {
    backgroundColor: "#FF768A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailsButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  reviewButton: {
    backgroundColor: "#FF768A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reviewButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  reviewedButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reviewedButtonText: { color: "#9CA3AF", fontSize: 12, fontWeight: "700" },
  emptyTextSeccion: {
    color: "#9CA3AF",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  starsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  textInput: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: { color: "#6B7280", fontWeight: "600" },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#886BC1",
  },
  submitButtonText: { color: "#FFFFFF", fontWeight: "700" },
  rejectionNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF1F0",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 6,
  },
  rejectionText: {
    color: "#DC2626",
    fontSize: 12,
    flex: 1,
  },
  cancelBookingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: "#FEF2F2", // Un fondo rojo muy suave
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: 10,
  },
  cancelBookingText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  warningContainer: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  warningText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
});
