import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ENDPOINTS } from "../../../constants/apiConfig";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  color: string;
};

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        setNotifications([]);
        return;
      }

      const response = await fetch(ENDPOINTS.get_notificaciones_cliente(userId));
      const data = await response.json().catch(() => []);

      if (!response.ok) {
        setNotifications([]);
        return;
      }

      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Error cargando notificaciones del cliente:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/register/client/UserProfile")}
            >
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
        </View>

        <View style={styles.notificationsContainer}>
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#886BC1" />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No hay notificaciones</Text>
              <Text style={styles.emptyText}>
                Aqui veras mensajes, cambios de reserva y actualizaciones.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <View
                key={notification.id}
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
                  {notification.icon === "chatbubble" && (
                    <Ionicons name="chatbubble" size={20} color="white" />
                  )}
                  {notification.icon === "star" && (
                    <FontAwesome name="star" size={20} color="white" />
                  )}
                </View>

                <View style={styles.notificationContent}>
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
  safeArea: { flex: 1, backgroundColor: "#886BC1" },
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContent: { paddingBottom: 24 },
  header: {
    paddingTop: 14,
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
  bellContainer: { position: "relative" },
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
  notificationsContainer: { padding: 20 },
  centerState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 8,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
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
  notificationContent: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    color: "#2E2E2E",
    flex: 1,
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
  message: { color: "#666", marginTop: 4 },
  time: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
});

