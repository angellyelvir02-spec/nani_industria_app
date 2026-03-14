import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
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
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const bookings = [
    {
      id: 1,
      clientName: "Laura Pérez",
      clientPhoto:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      date: "Sábado, 8 Feb 2026",
      time: "2:00 PM - 6:00 PM",
      duration: 4,
      children: 2,
      payment: 60,
      status: "completed",
      rating: 5,
    },
    {
      id: 2,
      clientName: "Carlos Mendoza",
      clientPhoto:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      date: "Miércoles, 5 Feb 2026",
      time: "3:00 PM - 7:00 PM",
      duration: 4,
      children: 1,
      payment: 60,
      status: "completed",
      rating: 5,
    },
    {
      id: 3,
      clientName: "Ana Torres",
      clientPhoto:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
      date: "Viernes, 31 Ene 2026",
      time: "10:00 AM - 2:00 PM",
      duration: 4,
      children: 3,
      payment: 60,
      status: "completed",
      rating: 4,
    },
    {
      id: 4,
      clientName: "Roberto Silva",
      clientPhoto:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
      date: "Lunes, 27 Ene 2026",
      time: "9:00 AM - 1:00 PM",
      duration: 4,
      children: 2,
      payment: 60,
      status: "cancelled",
      rating: null,
    },
  ];

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

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "cancelled" && styles.activeFilter,
              ]}
              onPress={() => setFilter("cancelled")}
            >
              <Text
                style={
                  filter === "cancelled"
                    ? styles.activeFilterText
                    : styles.filterText
                }
              >
                Canceladas
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
                          : styles.cancelled
                      }
                    >
                      {booking.status === "completed"
                        ? "Completada"
                        : "Cancelada"}
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
});
