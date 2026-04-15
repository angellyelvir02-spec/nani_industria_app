import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

type BookingStatus = "Próxima" | "Completada" | "Cancelada" | string;

type UserData = {
  id?: number | string;
  name: string;
  email: string;
  phone: string;
  photo?: string | null;
};

type BookingItem = {
  id: number | string;
  babysitter: string;
  date: string;
  status: BookingStatus;
  amount: string;
};

type MenuItem = {
  id: number | string;
  title: string;
  subtitle: string;
  icon:
    | "credit-card"
    | "heart"
    | "notifications"
    | "shield"
    | "help-circle";
  route: string;
};

interface UserProfileProps {
  user?: UserData;
  bookingHistory?: BookingItem[];
  menuItems?: MenuItem[];
  onLogout?: () => void;
  onEditPhoto?: () => void;
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 1,
    title: "Métodos de pago",
    subtitle: "Administra tus tarjetas",
    icon: "credit-card",
    route: "/register/client/payment-methods",
  },
  {
    id: 2,
    title: "Favoritas",
    subtitle: "Tus niñeras favoritas",
    icon: "heart",
    route: "/register/client/favorites",
  },
  {
    id: 3,
    title: "Notificaciones",
    subtitle: "Configura alertas",
    icon: "notifications",
    route: "/register/client/notification-settings",
  },
  {
    id: 4,
    title: "Seguridad y privacidad",
    subtitle: "Protege tu cuenta",
    icon: "shield",
    route: "/register/client/security-settings",
  },
  {
    id: 5,
    title: "Ayuda y soporte",
    subtitle: "Centro de ayuda",
    icon: "help-circle",
    route: "/register/client/help-center",
  },
];

const DEFAULT_PHOTO =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const DEFAULT_USER: UserData = {
  id: "",
  name: "Usuario",
  email: "correo@ejemplo.com",
  phone: "+504 0000-0000",
  photo: DEFAULT_PHOTO,
};

export default function UserProfile({
  user = DEFAULT_USER,
  bookingHistory = [],
  menuItems = DEFAULT_MENU_ITEMS,
  onLogout,
  onEditPhoto,
}: UserProfileProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const safeUser = user ?? DEFAULT_USER;

  const resolvedPhoto =
    safeUser.photo && safeUser.photo.trim() !== ""
      ? safeUser.photo
      : DEFAULT_PHOTO;

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "Próxima":
        return "#886BC1";
      case "Completada":
        return "#22C55E";
      case "Cancelada":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const renderedMenu = useMemo(() => menuItems, [menuItems]);

  const renderMenuIcon = (icon: MenuItem["icon"]) => {
    switch (icon) {
      case "credit-card":
        return <Feather name="credit-card" size={20} color="#886BC1" />;
      case "heart":
        return <AntDesign name="heart" size={20} color="#886BC1" />;
      case "notifications":
        return (
          <Ionicons
            name="notifications-outline"
            size={20}
            color="#886BC1"
          />
        );
      case "shield":
        return (
          <MaterialCommunityIcons
            name="shield-outline"
            size={20}
            color="#886BC1"
          />
        );
      case "help-circle":
        return <Feather name="help-circle" size={20} color="#886BC1" />;
      default:
        return <Feather name="circle" size={20} color="#886BC1" />;
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);

    if (onLogout) {
      onLogout();
      return;
    }

    await AsyncStorage.multiRemove(["userToken", "userId"]);
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Mi perfil</Text>
          </LinearGradient>

          <View style={styles.profileWrapper}>
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View style={styles.photoContainer}>
                  <Image
                    source={{ uri: resolvedPhoto }}
                    style={styles.userPhoto}
                  />

                  <TouchableOpacity
                    style={styles.editPhotoButton}
                    onPress={onEditPhoto}
                    activeOpacity={0.8}
                  >
                    <Feather name="edit-2" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{safeUser.name}</Text>
                  <Text style={styles.userDetail}>{safeUser.email}</Text>
                  <Text style={styles.userDetail}>{safeUser.phone}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => router.push("/register/client/edit-profile")}
              >
                <Text style={styles.editProfileButtonText}>Editar perfil</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Historial de reservas</Text>

                <TouchableOpacity
                  onPress={() => router.push("/register/client/bookings")}
                >
                  <Text style={styles.viewAllText}>Ver todo</Text>
                </TouchableOpacity>
              </View>

              {bookingHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>
                    No tienes reservas aún
                  </Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Aquí aparecerá tu historial de contrataciones.
                  </Text>
                </View>
              ) : (
                bookingHistory.map((booking) => (
                  <TouchableOpacity
                    key={booking.id}
                    style={styles.bookingItem}
                    activeOpacity={0.8}
                  >
                    <View style={styles.bookingLeft}>
                      <View style={styles.bookingIconWrapper}>
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#886BC1"
                        />
                      </View>

                      <View>
                        <Text style={styles.bookingBabysitter}>
                          {booking.babysitter}
                        </Text>
                        <Text style={styles.bookingDate}>{booking.date}</Text>
                      </View>
                    </View>

                    <View style={styles.bookingRight}>
                      <Text style={styles.bookingAmount}>{booking.amount}</Text>
                      <Text
                        style={[
                          styles.bookingStatus,
                          { color: getStatusColor(booking.status) },
                        ]}
                      >
                        {booking.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.menuCard}>
              {renderedMenu.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuIconWrapper}>
                    {renderMenuIcon(item.icon)}
                  </View>

                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>

                  <MaterialIcons
                    name="keyboard-arrow-right"
                    size={24}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setShowLogoutModal(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color="#9CA3AF"
              />
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
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
              <Text style={styles.modalTitle}>¿Cerrar sesión?</Text>
              <Text style={styles.modalText}>
                ¿Estás seguro de que quieres cerrar sesión?
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
                  <Text style={styles.confirmButtonText}>Cerrar sesión</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
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
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF768A",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
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
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#886BC1",
  },
  bookingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  bookingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  bookingIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F6D9F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bookingBabysitter: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E2E2E",
  },
  bookingDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  bookingRight: {
    alignItems: "flex-end",
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E2E2E",
  },
  bookingStatus: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
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
  modalButtons: {
    flexDirection: "row",
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
