import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Award,
  CheckCircle,
  MapPin,
  Pencil,
  Shield,
  Star,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ENDPOINTS } from "../../../constants/apiConfig";

type EditMode = "presentacion" | "habilidades" | "certificaciones" | null;

export default function BabysitterOwnProfile() {
  const [activeTab, setActiveTab] = useState<"profile" | "bookings">("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editValue, setEditValue] = useState("");
  const [stats, setStats] = useState({
    monthEarnings: 0,
    completedBookings: 0,
    chats: 0,
  });

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const savedUserId = await AsyncStorage.getItem("userId");

      if (!savedUserId) {
        Alert.alert("Error", "No se encontro el ID del usuario");
        setProfile(null);
        return;
      }

      const response = await fetch(ENDPOINTS.get_perfil_ninera(savedUserId));
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar perfil");
      }

      setProfile(data);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo cargar el perfil");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const savedUserId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("userToken");

      if (!savedUserId) return;

      const [bookingsResponse, chatsResponse] = await Promise.all([
        fetch(ENDPOINTS.get_reservas_ninera(savedUserId)),
        fetch(ENDPOINTS.get_chat_conversations, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const bookingsData = await bookingsResponse.json().catch(() => []);
      const chatsData = await chatsResponse.json().catch(() => []);

      const bookings = Array.isArray(bookingsData) ? bookingsData : [];
      const completedBookings = bookings.filter(
        (item: any) => String(item.estado || "").toLowerCase() === "completada",
      );

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}`;

      const monthEarnings = completedBookings
        .filter(
          (item: any) => String(item.fecha_servicio || "").slice(0, 7) === currentMonth,
        )
        .reduce((total: number, item: any) => total + Number(item.monto_total || 0), 0);

      setStats({
        monthEarnings,
        completedBookings: completedBookings.length,
        chats: Array.isArray(chatsData) ? chatsData.length : 0,
      });
    } catch (error) {
      console.log("Error cargando stats del perfil:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
      fetchStats();
    }, [fetchProfileData, fetchStats]),
  );

  const handleChangePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result.canceled) return;

      const image = result.assets[0];
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        Alert.alert("Error", "No se encontro el usuario");
        return;
      }

      const formData = new FormData();
      formData.append("foto", {
        uri: image.uri,
        name: "foto.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(ENDPOINTS.update_foto_ninera(userId), {
        method: "PATCH",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert("Error", data.message || "No se pudo actualizar la foto");
        return;
      }

      Alert.alert("Exito", "Foto actualizada");
      fetchProfileData();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Ocurrio un error al cambiar la foto",
      );
    }
  };

  const openEditModal = (mode: EditMode) => {
    if (!profile) return;

    if (mode === "presentacion") {
      setEditValue(profile?.presentacion || "");
    } else if (mode === "habilidades") {
      const items = Array.isArray(profile?.habilidades)
        ? profile.habilidades.map((item: any) => item?.nombre || "").filter(Boolean)
        : [];
      setEditValue(items.join(", "));
    } else if (mode === "certificaciones") {
      const items = Array.isArray(profile?.certificaciones)
        ? profile.certificaciones.map((item: any) => item?.nombre || "").filter(Boolean)
        : [];
      setEditValue(items.join(", "));
    }

    setEditMode(mode);
  };

  const saveProfileSection = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (!userId || !editMode) return;

      setSavingProfile(true);

      const payload: any = {};
      if (editMode === "presentacion") {
        payload.presentacion = editValue.trim();
      }
      if (editMode === "habilidades") {
        payload.habilidades = editValue
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      if (editMode === "certificaciones") {
        payload.certificaciones = editValue
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      const response = await fetch(ENDPOINTS.update_perfil_ninera(userId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar");
      }

      setProfile(data);
      setEditMode(null);
      setEditValue("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await AsyncStorage.multiRemove(["userToken", "userId"]);
    router.replace("/login");
  };

  const profileImage = useMemo(
    () =>
      profile?.foto_url ||
      profile?.persona?.foto_url ||
      "https://images.unsplash.com/photo-1584446456661-1039ed1a39d7?w=800",
    [profile],
  );

  const fullName = useMemo(
    () =>
      `${profile?.persona?.nombre || ""} ${profile?.persona?.apellido || ""}`.trim() ||
      "Ninera",
    [profile],
  );

  const ubicacion = useMemo(
    () =>
      profile?.persona?.direccion?.direccion_completa || "Ubicacion no disponible",
    [profile],
  );

  const habilidades = Array.isArray(profile?.habilidades) ? profile.habilidades : [];
  const certificaciones = Array.isArray(profile?.certificaciones)
    ? profile.certificaciones
    : [];

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF768A" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleChangePhoto}>
          <Image source={{ uri: profileImage }} style={styles.headerImage} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2E2E2E" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{fullName}</Text>

            <View style={styles.row}>
              <Star size={14} color="#FF768A" />
              <Text style={styles.rating}>{Number(profile?.promedio_rating || 0).toFixed(1)}</Text>
            </View>

            <View style={styles.row}>
              <MapPin size={14} color="#888" />
              <Text style={styles.location}>{ubicacion}</Text>
            </View>
          </View>

          <View>
            <Text style={styles.price}>L {profile?.tarifa ?? 0}</Text>
            <Text style={styles.priceLabel}>por hora</Text>
          </View>
        </View>

        <View style={styles.badges}>
          {profile?.verificada && (
            <View style={styles.badge}>
              <Shield size={14} color="#886BC1" />
              <Text style={styles.badgeText}>Verificada</Text>
            </View>
          )}

          <View style={styles.badge}>
            <Award size={14} color="#886BC1" />
            <Text style={styles.badgeText}>
              {profile?.experiencia || "Sin experiencia registrada"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCardPurple}>
          <Text style={styles.statValue}>L {stats.monthEarnings}</Text>
          <Text style={styles.statLabelLight}>Ganado este mes</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValuePurple}>{stats.completedBookings}</Text>
          <Text style={styles.statLabel}>Reservas completadas</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValuePurple}>{stats.chats}</Text>
          <Text style={styles.statLabel}>Chats activos</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "profile" && styles.activeTab]}
          onPress={() => setActiveTab("profile")}
        >
          <Text style={activeTab === "profile" ? styles.tabTextActive : styles.tabText}>
            Mi Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "bookings" && styles.activeTab]}
          onPress={() => setActiveTab("bookings")}
        >
          <Text style={activeTab === "bookings" ? styles.tabTextActive : styles.tabText}>
            Reservas
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "profile" ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Presentacion</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal("presentacion")}
            >
              <Pencil size={14} color="#886BC1" />
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.about}>
            {profile?.presentacion || "Sin descripcion disponible."}
          </Text>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habilidades</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal("habilidades")}
            >
              <Pencil size={14} color="#886BC1" />
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.skillWrap}>
            {habilidades.length > 0 ? (
              habilidades.map((skill: any, index: number) => (
                <View key={`${skill?.nombre}-${index}`} style={styles.skill}>
                  <Text style={styles.skillText}>{skill?.nombre || String(skill)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.about}>No hay habilidades registradas.</Text>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Certificaciones</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal("certificaciones")}
            >
              <Pencil size={14} color="#886BC1" />
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>

          {certificaciones.length > 0 ? (
            certificaciones.map((cert: any, index: number) => (
              <View key={`${cert?.nombre}-${index}`} style={styles.certRow}>
                <CheckCircle size={16} color="#FF768A" />
                <Text style={styles.certText}>{cert?.nombre || String(cert)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.about}>No hay certificaciones registradas.</Text>
          )}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutModal(true)}
          >
            <Text style={styles.logoutButtonText}>Cerrar sesion</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.bookingSummaryCard}>
            <Text style={styles.summaryTitle}>Resumen rapido</Text>
            <Text style={styles.summaryText}>
              Este mes llevas L {stats.monthEarnings} y {stats.completedBookings} reservas completadas.
            </Text>
            <Text style={styles.summaryText}>
              Tambien tienes {stats.chats} chats activos con clientes.
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={!!editMode}
        transparent
        animationType="fade"
        onRequestClose={() => setEditMode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editMode === "presentacion" && "Editar presentacion"}
              {editMode === "habilidades" && "Editar habilidades"}
              {editMode === "certificaciones" && "Editar certificaciones"}
            </Text>
            <Text style={styles.modalText}>
              {editMode === "presentacion"
                ? "Escribe una descripcion breve de tu perfil."
                : "Separa cada elemento con coma."}
            </Text>

            <TextInput
              style={[
                styles.input,
                editMode === "presentacion" && styles.textArea,
              ]}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={
                editMode === "presentacion"
                  ? "Cuéntales a los clientes sobre ti"
                  : "Ejemplo: Paciencia, Primeros auxilios"
              }
              multiline={editMode === "presentacion"}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditMode(null)}
                disabled={savingProfile}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={saveProfileSection}
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
              Estas segura de que quieres cerrar sesion?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmButton} onPress={handleLogout}>
                <Text style={styles.confirmButtonText}>Cerrar sesion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  centerContent: { justifyContent: "center", alignItems: "center" },
  headerContainer: { height: 240 },
  headerImage: { width: "100%", height: "100%" },
  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 20,
  },
  profileCard: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 20,
    marginTop: -30,
    elevation: 5,
  },
  profileTop: { flexDirection: "row", justifyContent: "space-between" },
  profileInfo: { flex: 1, marginRight: 10 },
  name: { fontSize: 20, marginBottom: 6, fontWeight: "bold" },
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
  rating: { marginLeft: 4, fontWeight: "700" },
  location: { color: "#777", flexShrink: 1 },
  price: { color: "#886BC1", fontSize: 22, fontWeight: "bold" },
  priceLabel: { color: "#888", textAlign: "right" },
  badges: { flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F6D9F1",
    padding: 6,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
  },
  statCardPurple: {
    flex: 1,
    backgroundColor: "#886BC1",
    padding: 18,
    borderRadius: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 18,
    borderRadius: 20,
    elevation: 2,
  },
  statValue: { fontSize: 22, color: "white", fontWeight: "bold" },
  statValuePurple: { fontSize: 22, color: "#886BC1", fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  statLabelLight: { fontSize: 12, color: "white", marginTop: 4 },
  tabs: {
    flexDirection: "row",
    backgroundColor: "white",
    margin: 20,
    borderRadius: 20,
    padding: 5,
    elevation: 3,
  },
  tabButton: { flex: 1, padding: 10, alignItems: "center" },
  activeTab: { backgroundColor: "#FF768A", borderRadius: 15 },
  tabText: { color: "#666" },
  tabTextActive: { color: "white", fontWeight: "bold" },
  section: { paddingHorizontal: 20, gap: 15, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editText: { color: "#886BC1", fontWeight: "500" },
  about: { color: "#666", lineHeight: 20 },
  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skill: {
    backgroundColor: "#F6D9F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillText: { fontSize: 13 },
  certRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  certText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
  bookingSummaryCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 8,
  },
  summaryText: {
    color: "#666",
    marginBottom: 6,
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "700",
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
    marginBottom: 16,
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
  },
  textArea: {
    minHeight: 120,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 16,
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
