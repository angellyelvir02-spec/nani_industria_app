import React, { useState, useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowLeft,
  Award,
  CheckCircle,
  MapPin,
  Shield,
  Star,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { ENDPOINTS } from "../../../constants/apiConfig";

export default function BabysitterOwnProfile() {
  const [activeTab, setActiveTab] = useState<"profile" | "bookings">("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      const savedUserId = await AsyncStorage.getItem("userId");

      if (!savedUserId) {
        Alert.alert("Error", "No se encontró el ID del usuario");
        setProfile(null);
        return;
      }

      const url =
        typeof ENDPOINTS.get_perfil_ninera === "function"
          ? ENDPOINTS.get_perfil_ninera(savedUserId)
          : `${ENDPOINTS.get_perfil_ninera}/${savedUserId}`;

      console.log("Consultando perfil en:", url);

      const response = await fetch(url);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar perfil");
      }

      setProfile(data);
    } catch (error: any) {
      console.error("Detalle del error del perfil:", error);
      Alert.alert("Error", error.message || "No se pudo cargar el perfil");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

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
        Alert.alert("Error", "No se encontró el usuario");
        return;
      }

      const formData = new FormData();
      formData.append("foto", {
        uri: image.uri,
        name: "foto.jpg",
        type: "image/jpeg",
      } as any);

      const url =
        typeof ENDPOINTS.update_foto_ninera === "function"
          ? ENDPOINTS.update_foto_ninera(userId)
          : `${ENDPOINTS.update_foto_ninera}/${userId}`;

      console.log("Actualizando foto en:", url);

      const response = await fetch(url, {
        method: "PATCH",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.log("Error actualizando foto:", data);
        Alert.alert(
          "Error",
          data.message || "No se pudo actualizar la foto"
        );
        return;
      }

      Alert.alert("Éxito", "Foto actualizada");
      fetchProfileData();
    } catch (error: any) {
      console.log("Error al cambiar foto:", error);
      Alert.alert(
        "Error",
        error?.message || "Ocurrió un error al cambiar la foto"
      );
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#FF768A" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center", padding: 20 },
        ]}
      >
        <Text>No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  const profileImage =
    profile?.foto_url ||
    profile?.persona?.foto_url ||
    "https://images.unsplash.com/photo-1584446456661-1039ed1a39d7?w=800";

  const fullName =
    `${profile?.persona?.nombre || ""} ${profile?.persona?.apellido || ""}`.trim() ||
    "Niñera";

  const ubicacion =
    profile?.ubicacion ||
    profile?.persona?.ubicacion ||
    "Ubicación no disponible";

  const presentacion =
    profile?.presentacion || "Sin descripción disponible.";

  const habilidades = Array.isArray(profile?.habilidades)
    ? profile.habilidades
    : [];

  const certificaciones = Array.isArray(profile?.certificaciones)
    ? profile.certificaciones
    : [];

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
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.name}>{fullName}</Text>

            <View style={styles.row}>
              <Star size={14} color="#FF768A" />
              <Text style={styles.rating}>4.9</Text>
              <Text style={styles.reviews}>(127 reseñas)</Text>
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
              <Text style={{ fontSize: 12 }}>Verificada</Text>
            </View>
          )}

          <View style={styles.badge}>
            <Award size={14} color="#886BC1" />
            <Text style={{ fontSize: 12 }}>
              {profile?.experiencia || "Sin experiencia registrada"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCardPurple}>
          <Text style={styles.statValue}>L 2,450</Text>
          <Text style={[styles.statLabel, { color: "white" }]}>
            Ganado este mes
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValuePurple}>87</Text>
          <Text style={styles.statLabel}>Reservas completadas</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "profile" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("profile")}
        >
          <Text
            style={
              activeTab === "profile" ? styles.tabTextActive : styles.tabText
            }
          >
            Mi Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "bookings" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("bookings")}
        >
          <Text
            style={
              activeTab === "bookings" ? styles.tabTextActive : styles.tabText
            }
          >
            Reservas
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "profile" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Presentación</Text>
            <TouchableOpacity onPress={() => router.push("./EditPresentation")}>
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.about}>{presentacion}</Text>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habilidades</Text>
            <TouchableOpacity onPress={() => router.push("./EditSkills")}>
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.skillWrap}>
            {habilidades.length > 0 ? (
              habilidades.map((skill: any, i: number) => (
                <View key={i} style={styles.skill}>
                  <Text style={{ fontSize: 13 }}>
                    {skill?.nombre || skill?.descripcion || String(skill)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.about}>No hay habilidades registradas.</Text>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Certificaciones</Text>
            <TouchableOpacity
              onPress={() => router.push("./EditCertifications")}
            >
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>

          {certificaciones.length > 0 ? (
            certificaciones.map((cert: any, i: number) => (
              <View key={i} style={styles.certRow}>
                <CheckCircle size={16} color="#FF768A" />
                <Text style={styles.certText}>
                  {cert?.nombre || cert?.descripcion || String(cert)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.about}>No hay certificaciones registradas.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
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
  name: { fontSize: 20, marginBottom: 6, fontWeight: "bold" },
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
  rating: { marginLeft: 4 },
  reviews: { color: "#888", fontSize: 13 },
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
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20 },
  statCardPurple: {
    flex: 1,
    backgroundColor: "#886BC1",
    padding: 20,
    borderRadius: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    elevation: 2,
  },
  statValue: { fontSize: 22, color: "white", fontWeight: "bold" },
  statValuePurple: { fontSize: 22, color: "#886BC1", fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#666" },
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
  editText: { color: "#886BC1", fontWeight: "500" },
  about: { color: "#666", lineHeight: 20 },
  skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skill: {
    backgroundColor: "#F6D9F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  certRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  skillTag: {
    backgroundColor: "#FFE4EA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillText: {
    color: "#FF768A",
    fontSize: 14,
    fontWeight: "500",
  },
  certText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
});