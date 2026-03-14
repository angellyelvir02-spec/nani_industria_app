import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  onNotificationClick?: (id: number) => void;
  onBack: () => void;
}

export default function BabysitterNotifications({
  onNotificationClick,
  onBack,
}: Props) {
  const notifications = [
    {
      id: 1,
      type: "booking",
      title: "Nueva reserva",
      message: "Laura Pérez ha reservado tus servicios para el 15 de febrero",
      time: "Hace 5 minutos",
      read: false,
      icon: "calendar",
      color: "#FF768A",
    },
    {
      id: 2,
      type: "review",
      title: "Nueva reseña",
      message: "Carlos Mendoza dejó una reseña de 5 estrellas en tu perfil",
      time: "Hace 1 hora",
      read: false,
      icon: "star",
      color: "#FFC107",
    },
    {
      id: 3,
      type: "message",
      title: "Nuevo mensaje",
      message: "Ana Torres te envió un mensaje",
      time: "Hace 2 horas",
      read: true,
      icon: "chatbubble",
      color: "#886BC1",
    },
    {
      id: 4,
      type: "booking",
      title: "Reserva confirmada",
      message: "Tu reserva con Carlos Mendoza ha sido confirmada",
      time: "Hace 3 horas",
      read: true,
      icon: "calendar",
      color: "green",
    },
    {
      id: 5,
      type: "review",
      title: "Nuevo comentario",
      message: "María López ha comentado en tu perfil",
      time: "Ayer",
      read: true,
      icon: "chatbubble",
      color: "#886BC1",
    },
    {
      id: 6,
      type: "booking",
      title: "Solicitud de reserva",
      message:
        "Tienes una nueva solicitud de reserva para el próximo fin de semana",
      time: "Hace 2 días",
      read: true,
      icon: "calendar",
      color: "#FF768A",
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Notificaciones</Text>

            <View style={styles.bellContainer}>
              <Ionicons name="notifications" size={24} color="white" />

              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </View>

          {unreadCount > 0 && (
            <Text style={styles.unreadText}>{unreadCount} sin leer</Text>
          )}
        </View>

        {/* LISTA DE NOTIFICACIONES */}

        <View style={styles.notificationsContainer}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => onNotificationClick?.(notification.id)}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard,
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: notification.color },
                ]}
              >
                {notification.icon === "calendar" && (
                  <MaterialIcons
                    name="calendar-month"
                    size={22}
                    color="white"
                  />
                )}

                {notification.icon === "star" && (
                  <FontAwesome name="star" size={20} color="white" />
                )}

                {notification.icon === "chatbubble" && (
                  <Ionicons name="chatbubble" size={20} color="white" />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadTitle,
                    ]}
                  >
                    {notification.title}
                  </Text>

                  {!notification.read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.message}>{notification.message}</Text>

                <Text style={styles.time}>{notification.time}</Text>
              </View>
            </TouchableOpacity>
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
  },

  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 20,
  },

  headerTitle: {
    color: "white",
    fontSize: 20,
    flex: 1,
    marginLeft: 10,
  },

  bellContainer: {
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    color: "#FF768A",
    fontSize: 10,
  },

  unreadText: {
    color: "white",
    marginTop: 10,
    marginLeft: 50,
    opacity: 0.8,
  },

  notificationsContainer: {
    padding: 20,
  },

  notificationCard: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  unreadCard: {
    borderColor: "#FF768A",
    borderWidth: 2,
  },

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  notificationTitle: {
    fontSize: 16,
    color: "#2E2E2E",
  },

  unreadTitle: {
    fontWeight: "bold",
  },

  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: "#FF768A",
    borderRadius: 4,
  },

  message: {
    color: "#666",
    marginTop: 4,
  },

  time: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
});
