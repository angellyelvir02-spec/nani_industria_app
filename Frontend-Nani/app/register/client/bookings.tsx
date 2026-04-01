import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
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
  | "en_progreso";

export default function BookingsListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  const fetchBookings = async () => {
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
        photo: item.photo,
        date: item.date,
        time: item.time,
        duration: item.duration,
        location: item.location || "Ubicación no especificada",
        status: item.status as BookingStatus,
        amount: item.amount,
        rating: item.rating || 5.0,
        reviewed: item.reviewed || false,
      }));

      setBookings(mapped);
    } catch (error) {
      console.log("Error fetchBookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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
        color: "#DC2626",
        icon: <XCircle size={12} color="#DC2626" />,
        label: "Cancelada",
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

  // --- LÓGICA DE FILTRADO CORREGIDA ---
  const today = new Date().toISOString().split("T")[0];

  const upcomingBookings = bookings.filter((b) => {
    // Si está en curso, mostrar siempre en próximas
    if (b.status === "en_progreso") return true;

    // Para confirmadas y pendientes, validamos que sean de hoy o futuro
    const isFutureOrToday = b.date >= today;
    return (
      (b.status === "confirmed" || b.status === "pending") && isFutureOrToday
    );
  });

  const pastBookings = bookings.filter((b) => {
    // Si está en curso, NO va al historial
    if (b.status === "en_progreso") return false;

    // Si está completada o cancelada, VA al historial siempre
    if (b.status === "completed" || b.status === "cancelled") return true;

    // Si la fecha ya pasó (ayer o antes) y no está confirmada/pendiente, va al historial
    return b.date < today;
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
                    <TouchableOpacity style={styles.qrEntryButton}>
                      <QrCode size={16} color="#16A34A" />
                      <Text style={styles.qrEntryButtonText}>Entrada</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qrExitButton}>
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
                <View style={styles.cardFooter}>
                  <Text style={styles.historyAmountText}>{booking.amount}</Text>
                  <TouchableOpacity
                    style={
                      booking.reviewed
                        ? styles.reviewedButton
                        : styles.reviewButton
                    }
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
});
