import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { ENDPOINTS } from "../../../constants/apiConfig";

const DEFAULT_PHOTO =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function UserProfile() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    chats: 0,
  });
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        setProfile(null);
        return;
      }

      const response = await fetch(ENDPOINTS.get_perfil_cliente(userId));
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "No se pudo cargar el perfil");
      }

      setProfile(data);
      setForm({
        nombre: data?.persona?.nombre || "",
        apellido: data?.persona?.apellido || "",
        telefono: data?.persona?.telefono || "",
      });
    } catch (error) {
      console.log("Error cargando perfil cliente:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("userToken");

      if (!userId) return;

      const [bookingsResponse, chatsResponse] = await Promise.all([
        fetch(ENDPOINTS.get_reservas_cliente(userId)),
        fetch(ENDPOINTS.get_chat_conversations, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const bookingsData = await bookingsResponse.json().catch(() => []);
      const chatsData = await chatsResponse.json().catch(() => []);

      const bookings = Array.isArray(bookingsData) ? bookingsData : [];
      const totalBookings = bookings.length;
      const activeBookings = bookings.filter((booking: any) =>
        ["pending", "confirmed", "en_progreso"].includes(
          String(booking.status || "").toLowerCase(),
        ),
      ).length;

      setStats({
        totalBookings,
        activeBookings,
        chats: Array.isArray(chatsData) ? chatsData.length : 0,
      });
    } catch (error) {
      console.log("Error cargando stats cliente:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchStats();
    }, [fetchProfile, fetchStats]),
  );

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await AsyncStorage.multiRemove(["userToken", "userId"]);
    router.replace("/login");
  };

  const saveProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      setSavingProfile(true);
      const response = await fetch(ENDPOINTS.update_perfil_cliente(userId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar el perfil");
      }

      setProfile(data);
      setShowEditModal(false);
    } catch (error: any) {
      console.log("Error guardando perfil:", error);
    } finally {
      setSavingProfile(false);
    }
  };

  const resolvedPhoto =
    profile?.persona?.foto_url && String(profile.persona.foto_url).trim() !== ""
      ? profile.persona.foto_url
      : DEFAULT_PHOTO;

  if (loading) {
    return (
      <View style={[styles.safeArea, styles.centerState]}>
        <ActivityIndicator size="large" color="#886BC1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#886BC1" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#886BC1", "#FF768A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Feather name="arrow-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Mi perfil</Text>
            </View>
          </LinearGradient>

          <View style={styles.profileWrapper}>
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View style={styles.photoContainer}>
                  <Image source={{ uri: resolvedPhoto }} style={styles.userPhoto} />
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {`${profile?.persona?.nombre || ""} ${
                      profile?.persona?.apellido || ""
                    }`.trim() || "Cliente"}
                  </Text>
                  <Text style={styles.userDetail}>
                    {profile?.usuario?.correo || "correo@ejemplo.com"}
                  </Text>
                  <Text style={styles.userDetail}>
                    {profile?.persona?.telefono || "Sin telefono"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => setShowEditModal(true)}
              >
                <Text style={styles.editProfileButtonText}>Editar perfil</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalBookings}</Text>
                <Text style={styles.statLabel}>Reservas totales</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.activeBookings}</Text>
                <Text style={styles.statLabel}>Activas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.chats}</Text>
                <Text style={styles.statLabel}>Chats</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Informacion personal</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre</Text>
                <Text style={styles.infoValue}>{profile?.persona?.nombre || "-"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Apellido</Text>
                <Text style={styles.infoValue}>
                  {profile?.persona?.apellido || "-"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telefono</Text>
                <Text style={styles.infoValue}>
                  {profile?.persona?.telefono || "-"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Direccion</Text>
                <Text style={styles.infoValue}>
                  {profile?.persona?.direccion?.direccion_completa || "-"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ninos registrados</Text>
                <Text style={styles.infoValue}>{profile?.total_ninos || 0}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/register/client/bookings" as any)}
              >
                <View style={styles.menuIconWrapper}>
                  <Ionicons name="calendar-outline" size={20} color="#886BC1" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Reservas</Text>
                  <Text style={styles.menuSubtitle}>Revisa tu historial</Text>
                </View>
                <MaterialIcons
                  name="keyboard-arrow-right"
                  size={24}
                  color="#9CA3AF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push("/register/client/Notifications" as any)}
              >
                <View style={styles.menuIconWrapper}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="#886BC1"
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Notificaciones</Text>
                  <Text style={styles.menuSubtitle}>Alertas y novedades</Text>
                </View>
                <MaterialIcons
                  name="keyboard-arrow-right"
                  size={24}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setShowLogoutModal(true)}
            >
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color="#9CA3AF"
              />
              <Text style={styles.logoutText}>Cerrar sesion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View
          style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 14) }]}
        >
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/register/client/home")}
          >
            <Feather name="home" size={22} color="#9CA3AF" />
            <Text style={styles.navText}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/register/client/bookings")}
          >
            <Ionicons name="calendar-outline" size={22} color="#9CA3AF" />
            <Text style={styles.navText}>Reservas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/register/client/ChatList")}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#9CA3AF" />
            <Text style={styles.navText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={1}>
            <Feather name="user" size={22} color="#886BC1" />
            <Text style={styles.navTextActive}>Perfil</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showLogoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Cerrar sesion</Text>
              <Text style={styles.modalText}>
                Estas seguro de que quieres cerrar sesion?
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleLogout}
                >
                  <Text style={styles.confirmButtonText}>Cerrar sesion</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <TextInput
                style={styles.input}
                value={form.nombre}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, nombre: value }))
                }
                placeholder="Nombre"
              />
              <TextInput
                style={styles.input}
                value={form.apellido}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, apellido: value }))
                }
                placeholder="Apellido"
              />
              <TextInput
                style={styles.input}
                value={form.telefono}
                onChangeText={(value) =>
                  setForm((prev) => ({ ...prev, telefono: value }))
                }
                placeholder="Telefono"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditModal(false)}
                  disabled={savingProfile}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={saveProfile}
                  disabled={savingProfile}
                >
                  <Text style={styles.confirmButtonText}>
                    {savingProfile ? "Guardando..." : "Guardar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  centerState: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: 14,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  profileWrapper: {
    paddingHorizontal: 24,
    marginTop: -16,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  photoContainer: {
    position: "relative",
    marginRight: 16,
  },
  userPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  editProfileButton: {
    backgroundColor: "#F6D9F1",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  editProfileButtonText: {
    color: "#886BC1",
    fontSize: 15,
    fontWeight: "600",
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#886BC1",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2E2E",
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: "#2E2E2E",
    fontWeight: "500",
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F6D9F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E2E2E",
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E2E2E",
    marginLeft: 8,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 12,
    color: "#886BC1",
    marginTop: 4,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.50)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2E2E",
    textAlign: "center",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#2E2E2E",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginRight: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginLeft: 6,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

