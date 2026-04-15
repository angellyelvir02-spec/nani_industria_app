import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ENDPOINTS } from "../../../constants/apiConfig";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  onBack: () => void;
}

type BookingStatus =
  | "all"
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "rejected";

export default function BabysitterBookingHistory({ onBack }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<BookingStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeStatus = (
    estado: string,
  ): "pending" | "confirmed" | "in_progress" | "completed" => {
    const estadoNormalizado = (estado || "").toString().trim().toLowerCase();

    if (estadoNormalizado === "pendiente") return "pending";
    if (estadoNormalizado === "confirmado") return "confirmed";
    if (
      estadoNormalizado === "rechazada" ||
      estadoNormalizado === "rechazado"
    ) {
      return "rejected";
    }
    if (
      estadoNormalizado === "en progreso" ||
      estadoNormalizado === "en_progreso"
    ) {
      return "in_progress";
    }
    if (
      estadoNormalizado === "finalizado" ||
      estadoNormalizado === "finalizada" ||
      estadoNormalizado === "completado" ||
      estadoNormalizado === "completada"
    ) {
      return "completed";
    }

    return "pending";
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        console.log("No se encontró userId");
        setBookings([]);
        return;
      }

      const url = ENDPOINTS.get_reservas_ninera(userId);
      console.log("Consultando reservas en:", url);

      const response = await fetch(url);
      const data = await response.json().catch(() => []);

      if (!response.ok) {
        console.log("Error obteniendo reservas:", data);
        setBookings([]);
        return;
      }

      const reservasArray = Array.isArray(data) ? data : [];

      const mappedBookings = reservasArray.map((item: any) => {
        const clientePersona = item?.cliente?.persona;
        const fecha = item?.fecha_servicio || "";
        const horaInicio = item?.hora_inicio || "";
        const horaFin = item?.hora_fin || "";

        const status = normalizeStatus(item?.estado || "");

        return {
          id: item?.id,
          clientName: clientePersona
            ? `${clientePersona?.nombre || ""} ${clientePersona?.apellido || ""}`.trim()
            : "Cliente",
          clientPhoto:
            clientePersona?.foto_url || "https://via.placeholder.com/150",
          date: fecha,
          time:
            horaInicio && horaFin
              ? `${horaInicio} - ${horaFin}`
              : horaInicio || horaFin || "Horario no disponible",
          duration: item?.duracion_horas || 0,
          children:
            item?.cantidad_ninos ??
            item?.ninos_cantidad ??
            item?.total_ninos ??
            0,
          payment:
            item?.monto_total ??
            item?.total ??
            item?.pago_total ??
            item?.tarifa_total ??
            0,
          status,
          rating: item?.rating ?? null,
        };
      });

      setBookings(mappedBookings);
    } catch (error) {
      console.log("Error fetchBookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter = filter === "all" || booking.status === filter;
    const matchesSearch = booking.clientName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalEarnings = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + Number(b.payment || 0), 0);

  const completedCount = bookings.filter(
    (b) => b.status === "completed",
  ).length;

  const getStatusText = (status: string) => {
    if (status === "completed") return "Finalizado";
    if (status === "in_progress") return "En progreso";
    if (status === "confirmed") return "Confirmado";
    if (status === "rejected") return "Rechazada";
    return "Pendiente";
  };

  const getStatusStyle = (status: string) => {
    if (status === "completed") return styles.completed;
    if (status === "in_progress") return styles.inProgress;
    if (status === "confirmed") return styles.confirmed;
    if (status === "rejected") return styles.rejected;
    return styles.pending;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#886BC1" />
          <Text style={{ textAlign: "center", marginTop: 12 }}>
            Cargando reservas...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                onBack
                  ? onBack()
                  : router.replace("/register/babysister/BabysitterDashboard")
              }
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Historial de Reservas</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Completadas</Text>
              <Text style={styles.statValue}>{completedCount}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ganado total</Text>
              <Text style={styles.statValue}>L {totalEarnings}</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="gray" />
            <TextInput
              placeholder="Buscar por cliente..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "all" && styles.activeFilter,
              ]}
              onPress={() => setFilter("all")}
            >
              <Text
                style={
                  filter === "all" ? styles.activeFilterText : styles.filterText
                }
              >
                Todas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "pending" && styles.activeFilter,
              ]}
              onPress={() => setFilter("pending")}
            >
              <Text
                style={
                  filter === "pending"
                    ? styles.activeFilterText
                    : styles.filterText
                }
              >
                Pendientes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "confirmed" && styles.activeFilter,
              ]}
              onPress={() => setFilter("confirmed")}
            >
              <Text
                style={
                  filter === "confirmed"
                    ? styles.activeFilterText
                    : styles.filterText
                }
              >
                Confirmadas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "in_progress" && styles.activeFilter,
              ]}
              onPress={() => setFilter("in_progress")}
            >
              <Text
                style={
                  filter === "in_progress"
                    ? styles.activeFilterText
                    : styles.filterText
                }
              >
                En progreso
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "completed" && styles.activeFilter,
              ]}
              onPress={() => setFilter("completed")}
            >
              <Text
                style={
                  filter === "completed"
                    ? styles.activeFilterText
                    : styles.filterText
                }
              >
                Finalizadas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No hay reservas</Text>
              <Text style={styles.emptyText}>
                No encontramos reservas con ese filtro o búsqueda.
              </Text>
            </View>
          ) : (
            filteredBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <Image
                  source={{ uri: booking.clientPhoto }}
                  style={styles.clientPhoto}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>{booking.clientName}</Text>

                  <View style={styles.row}>
                    <MaterialIcons
                      name="calendar-month"
                      size={16}
                      color="gray"
                    />
                    <Text style={styles.infoText}>{booking.date}</Text>
                  </View>

                  <View style={styles.row}>
                    <Ionicons name="time-outline" size={16} color="gray" />
                    <Text style={styles.infoText}>{booking.time}</Text>
                  </View>

                  <View style={styles.footerRow}>
                    <Text style={styles.childrenText}>
                      {booking.children} niños
                    </Text>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.payment}>L {booking.payment}</Text>
                      <Text style={getStatusStyle(booking.status)}>
                        {getStatusText(booking.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#886BC1",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#886BC1",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    color: "white",
    fontSize: 20,
    marginLeft: 10,
  },

  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 20,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 15,
    width: "48%",
  },

  statLabel: {
    color: "white",
    opacity: 0.8,
  },

  statValue: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },

  searchContainer: {
    padding: 20,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },

  searchInput: {
    marginLeft: 10,
    flex: 1,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 6,
  },

  activeFilter: {
    backgroundColor: "#FF768A",
    borderColor: "#FF768A",
  },

  filterText: {
    color: "#666",
  },

  activeFilterText: {
    color: "white",
  },

  bookingCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    marginBottom: 15,
  },

  clientPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },

  clientName: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  infoText: {
    color: "gray",
    marginLeft: 6,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  childrenText: {
    color: "gray",
  },

  payment: {
    fontSize: 16,
    color: "#886BC1",
    fontWeight: "bold",
  },

  completed: {
    color: "green",
    fontSize: 12,
    fontWeight: "600",
  },

  pending: {
    color: "#E69B00",
    fontSize: 12,
    fontWeight: "600",
  },

  confirmed: {
    color: "#2D9CDB",
    fontSize: 12,
    fontWeight: "600",
  },

  inProgress: {
    color: "#9B51E0",
    fontSize: 12,
    fontWeight: "600",
  },

  emptyCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#2E2E2E",
  },

  emptyText: {
    color: "#666",
    textAlign: "center",
  },
  rejected: { color: "#DC2626", fontSize: 12, fontWeight: "600" },
});


