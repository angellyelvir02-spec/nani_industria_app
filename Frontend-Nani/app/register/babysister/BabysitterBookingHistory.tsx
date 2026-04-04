import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../../../constants/apiConfig";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  onBack: () => void;
}

export default function BabysitterBookingHistory({ onBack }: Props) {
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "in_progress" | "completed"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchBookings = async () => {
    try {
      setLoading(true);

      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        console.log("No se encontró userId");
        return;
      }

      const response = await fetch(ENDPOINTS.get_reservas_ninera(userId));
      const data = await response.json();

      if (!response.ok) {
        console.log("Error obteniendo reservas:", data);
        return;
      }

      const mappedBookings = data.map((item: any) => {
        const clientePersona = item.cliente?.persona;
        const fecha = item.fecha_servicio || "";
        const horaInicio = item.hora_inicio || "";
        const horaFin = item.hora_fin || "";

        const estadoNormalizado = (item.estado || "")
          .toString()
          .trim()
          .toLowerCase();

        let status: "pending" | "confirmed" | "in_progress" | "completed" = "pending";

        if (estadoNormalizado === "pendiente") {
          status = "pending";
        } else if (estadoNormalizado === "confirmado") {
          status = "confirmed";
        } else if (estadoNormalizado === "en progreso") {
          status = "in_progress";
        } else if (estadoNormalizado === "finalizado") {
          status = "completed";
        }
      
        return {
          id: item.id,
          clientName: clientePersona
            ? `${clientePersona.nombre} ${clientePersona.apellido}`
            : "Cliente",
          clientPhoto:
            clientePersona?.foto_url || "https://via.placeholder.com/150",
          date: fecha,
          time: `${horaInicio} - ${horaFin}`,
          duration: item.duracion_horas || 0,
          children: 0,
          payment: 0,
          status,
          rating: null,
        };
      });

      setBookings(mappedBookings);
    } catch (error) {
      console.log("Error fetchBookings:", error);
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
    .reduce((sum, b) => sum + b.payment, 0);

  const completedCount = bookings.filter(
    (b) => b.status === "completed",
  ).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          Cargando reservas...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Historial de Reservas</Text>
          </View>

          {/* STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Completadas</Text>
              <Text style={styles.statValue}>{completedCount}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ganado total</Text>
              <Text style={styles.statValue}>${totalEarnings}</Text>
            </View>
          </View>
        </View>

        {/* SEARCH */}
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

          {/* FILTERS */}
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
                Completadas
              </Text>
            </TouchableOpacity>

            {/* Todas 
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
            </TouchableOpacity>*/}
              
            {/* Pendientes */}
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
              
            {/* Confirmadas */}
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
              
            {/* En progreso */}
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
              
            {/* Finalizadas */}
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

        {/* BOOKINGS */}
        <View style={{ padding: 20 }}>
          {filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <Image
                source={{ uri: booking.clientPhoto }}
                style={styles.clientPhoto}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{booking.clientName}</Text>

                <View style={styles.row}>
                  <MaterialIcons name="calendar-month" size={16} color="gray" />
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
                    <Text style={styles.payment}>${booking.payment}</Text>

                    <Text
                    style={
                      booking.status === "completed"
                        ? styles.completed
                        : booking.status === "in_progress"
                        ? styles.inProgress
                        : booking.status === "confirmed"
                        ? styles.confirmed
                        : styles.pending
                    }
                  >
                    {booking.status === "completed"
                      ? "Finalizado"
                      : booking.status === "in_progress"
                      ? "En progreso"
                      : booking.status === "confirmed"
                      ? "Confirmado"
                      : "Pendiente"}
                  </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  header: {
    paddingTop: 60,
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
    gap: 10,
  },

  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
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
  },

  completed: {
    color: "green",
    fontSize: 12,
  },

  cancelled: {
    color: "red",
    fontSize: 12,
  },

  pending: {
    color: "#E69B00",
    fontSize: 12,
  },

  confirmed: {
    color: "#2D9CDB",
    fontSize: 12,
  },

  inProgress: {
    color: "#9B51E0",
    fontSize: 12,
  },
});
