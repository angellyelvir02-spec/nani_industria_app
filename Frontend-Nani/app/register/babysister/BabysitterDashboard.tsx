import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import {
  Bell,
  Calendar,
  Clock,
  MessageCircle,
  QrCode,
  Star,
  TrendingUp,
  User,
  X,
} from "lucide-react-native";

export default function BabysitterDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("home");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const stats = {
    todayBookings: 2,
    monthEarnings: 2450,
    rating: 4.9,
    newMessages: 3,
  };

  const todayBookings = [
    {
      id: 1,
      clientName: "Laura Pérez",
      clientPhoto:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
      time: "2:00 PM - 6:00 PM",
      children: 2,
      address: "Calle Principal 123",
      payment: 60,
      paymentMethod: "Tarjeta",
      childrenDetails: "Emma (5 años) y Lucas (3 años)",
      notes: "Alergia al maní en Emma",
    },
    {
      id: 2,
      clientName: "Carlos Mendoza",
      clientPhoto:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      time: "7:00 PM - 10:00 PM",
      children: 1,
      address: "Av. Central 456",
      payment: 45,
      paymentMethod: "Efectivo",
      childrenDetails: "Sofía (7 años)",
      notes: "Debe cenar a las 7:30 PM",
    },
  ];

  const handleShowDetails = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.hello}>Hola, María 👋</Text>
            <Text style={styles.sub}>
              Tienes {stats.todayBookings} reservas hoy
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notification}
            onPress={() => router.push("./BabysitterNotifications")}
          >
            <Bell color="white" size={22} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.newMessages}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* STATS */}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <TrendingUp color="white" size={20} />
            <Text style={styles.statValue}>${stats.monthEarnings}</Text>
            <Text style={styles.statLabel}>Este mes</Text>
          </View>

          <View style={styles.statCard}>
            <Star color="white" size={20} />
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>

          <View style={styles.statCard}>
            <MessageCircle color="white" size={20} />
            <Text style={styles.statValue}>{stats.newMessages}</Text>
            <Text style={styles.statLabel}>Mensajes</Text>
          </View>
        </View>
      </View>

      {/* CONTENT */}

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Reservas de hoy</Text>

        {todayBookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingRow}>
              <Image
                source={{ uri: booking.clientPhoto }}
                style={styles.avatar}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{booking.clientName}</Text>

                <View style={styles.row}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.timeText}>{booking.time}</Text>
                </View>

                <Text style={styles.address}>{booking.address}</Text>

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.acceptBtn}>
                    <QrCode size={14} color="white" />
                    <Text style={styles.acceptText}>Aceptar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => handleShowDetails(booking)}
                  >
                    <Text>Detalles</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.paymentBox}>
                <Text style={styles.payment}>${booking.payment}</Text>
                <Text style={styles.children}>{booking.children} niños</Text>
              </View>
            </View>
          </View>
        ))}

        {/* QUICK ACTIONS */}

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>

        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("./BabysitterOwnProfile")}
          >
            <User color="#886BC1" />
            <Text style={styles.quickTitle}>Mi perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("./Babysitterchats")}
          >
            <MessageCircle color="#886BC1" />
            <Text style={styles.quickTitle}>Mensajes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("./BabysitterBookingHistory")}
          >
            <Calendar color="#886BC1" />
            <Text style={styles.quickTitle}>Reservas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("./BabysitterNotifications")}
          >
            <Bell color="#886BC1" />
            <Text style={styles.quickTitle}>Notificaciones</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* NAVBAR */}

      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("home")}
        >
          <Calendar color={activeTab === "home" ? "#FF768A" : "#999"} />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("./BabysitterBookingHistory")}
        >
          <Clock color="#999" />
          <Text style={styles.navText}>Reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("./Babysitterchats")}
        >
          <MessageCircle color="#999" />
          <Text style={styles.navText}>Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("./BabysitterOwnProfile")}
        >
          <User color="#999" />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL */}

      <Modal visible={isDetailsOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.close}
              onPress={() => setIsDetailsOpen(false)}
            >
              <X />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Detalles de la reserva</Text>

            {selectedBooking && (
              <View>
                <Text style={styles.modalText}>
                  Cliente: {selectedBooking.clientName}
                </Text>

                <Text style={styles.modalText}>
                  Dirección: {selectedBooking.address}
                </Text>

                <Text style={styles.modalText}>
                  Pago: ${selectedBooking.payment}
                </Text>

                <Text style={styles.modalText}>
                  Niños: {selectedBooking.childrenDetails}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.okBtn}
              onPress={() => setIsDetailsOpen(false)}
            >
              <Text style={{ color: "white" }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#886BC1",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  hello: { color: "white", fontSize: 20 },

  sub: { color: "white", opacity: 0.8 },

  notification: {
    width: 45,
    height: 45,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 4,
  },

  badgeText: { color: "#FF768A", fontSize: 10 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 15,
    width: "30%",
  },

  statValue: { color: "white", fontSize: 18 },

  statLabel: { color: "white", fontSize: 11, opacity: 0.8 },

  content: { padding: 20 },

  sectionTitle: { fontSize: 18, marginBottom: 10 },

  bookingCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },

  bookingRow: { flexDirection: "row", gap: 10 },

  avatar: { width: 55, height: 55, borderRadius: 30 },

  clientName: { fontSize: 16, marginBottom: 4 },

  row: { flexDirection: "row", alignItems: "center", gap: 5 },

  timeText: { color: "#666", fontSize: 12 },

  address: { color: "#999", fontSize: 12 },

  buttonRow: { flexDirection: "row", marginTop: 8, gap: 8 },

  acceptBtn: {
    flexDirection: "row",
    backgroundColor: "#FF768A",
    padding: 6,
    borderRadius: 10,
    alignItems: "center",
    gap: 4,
  },

  acceptText: { color: "white" },

  detailsBtn: { backgroundColor: "#eee", padding: 6, borderRadius: 10 },

  paymentBox: { alignItems: "flex-end" },

  payment: { color: "#886BC1", fontSize: 18 },

  children: { fontSize: 12, color: "#777" },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  quickCard: {
    backgroundColor: "white",
    width: "48%",
    padding: 20,
    borderRadius: 20,
    marginBottom: 10,
  },

  quickTitle: { marginTop: 5 },

  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  navItem: { alignItems: "center" },

  navText: { fontSize: 11 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    backgroundColor: "white",
    width: "85%",
    borderRadius: 20,
    padding: 20,
  },

  modalTitle: { fontSize: 18, marginBottom: 10 },

  modalText: { marginBottom: 5 },

  okBtn: {
    backgroundColor: "#FF768A",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },

  close: { position: "absolute", right: 10, top: 10 },
});
