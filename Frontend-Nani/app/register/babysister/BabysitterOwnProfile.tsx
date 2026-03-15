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
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowLeft,
  Award,
  CheckCircle,
  MapPin,
  Shield,
  Star,
} from "lucide-react-native";
import {ENDPOINTS} from '../../../constants/apiConfig';


// Importa tus ENDPOINTS (asegúrate de que la ruta sea correcta)
// import { ENDPOINTS } from "../constants/Endpoints"; 

export default function BabysitterOwnProfile() {
  const [activeTab, setActiveTab] = useState<"profile" | "bookings">("profile");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useLocalSearchParams();

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const savedUserId = await AsyncStorage.getItem("userId");

      if (!savedUserId) {
        Alert.alert("Error", "No se encontró el ID del usuario");
        return;
      }

      // IMPORTANTE: Asegúrate que ENDPOINTS.get_perfil_ninera esté definido
      const url = `${ENDPOINTS.get_perfil_ninera}/${savedUserId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar perfil");
      }

      setProfile(data);
    } catch (error: any) {
      console.error("Detalle del error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF768A" />
      </View>
    );
  }

  if (!profile) return (
    <View style={styles.container}><Text>No se pudo cargar el perfil.</Text></View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Image 
          source={{ uri: profile.persona?.foto_url || "https://images.unsplash.com/photo-1584446456661-1039ed1a39d7?w=800" }} 
          style={styles.headerImage} 
        />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2E2E2E" />
        </TouchableOpacity>
      </View>

      {/* PROFILE CARD */}
      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View>
            <Text style={styles.name}>{profile.persona?.nombre} {profile.persona?.apellido}</Text>

            <View style={styles.row}>
              <Star size={14} color="#FF768A" />
              <Text style={styles.rating}>4.9</Text>
              <Text style={styles.reviews}>(127 reseñas)</Text>
            </View>

            <View style={styles.row}>
              <MapPin size={14} color="#888" />
              <Text style={styles.location}>{profile.persona?.ubicacion}</Text>
            </View>
          </View>

          <View>
            <Text style={styles.price}>${profile.tarifa}</Text>
            <Text style={styles.priceLabel}>por hora</Text>
          </View>
        </View>

        <View style={styles.badges}>
          {profile.verificada && (
            <View style={styles.badge}>
              <Shield size={14} color="#886BC1" />
              <Text style={{ fontSize: 12 }}>Verificada</Text>
            </View>
          )}

          <View style={styles.badge}>
            <Award size={14} color="#886BC1" />
            <Text style={{ fontSize: 12 }}>{profile.experiencia || "5 años"}</Text>
          </View>
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCardPurple}>
          <Text style={styles.statValue}>$2,450</Text>
          <Text style={[styles.statLabel, { color: 'white' }]}>Ganado este mes</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValuePurple}>87</Text>
          <Text style={styles.statLabel}>Reservas completadas</Text>
        </View>
      </View>

      {/* TABS */}
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

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <View style={styles.section}>
          {/* PRESENTACION */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Presentación</Text>
            <TouchableOpacity onPress={() => router.push("./EditPresentation")}>
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.about}>{profile.presentacion || "Sin descripción disponible."}</Text>

          {/* HABILIDADES */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habilidades</Text>
            <TouchableOpacity onPress={() => router.push("./EditSkills")}>
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.skillWrap}>
            {profile.habilidades?.map((skill: any, i: number) => (
              <View key={i} style={styles.skill}>
                <Text style={{ fontSize: 13 }}>{skill.nombre}</Text>
              </View>
            ))}
          </View>

          {/* CERTIFICACIONES */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Certificaciones</Text>
            <TouchableOpacity onPress={() => router.push("./EditCertifications")}>
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>
          {profile.certificaciones?.map((cert: any, i: number) => (
            <View key={i} style={styles.certRow}>
              <CheckCircle size={16} color="#FF768A" />
              <Text style={{ fontSize: 14 }}>{cert.nombre}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// Los estilos se mantienen igual a los tuyos...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FAFAFA" },
    headerContainer: { height: 240 },
    headerImage: { width: "100%", height: "100%" },
    backBtn: { position: "absolute", top: 50, left: 20, backgroundColor: "white", padding: 10, borderRadius: 20 },
    profileCard: { backgroundColor: "white", margin: 20, padding: 20, borderRadius: 20, marginTop: -30, elevation: 5 },
    profileTop: { flexDirection: "row", justifyContent: "space-between" },
    name: { fontSize: 20, marginBottom: 6, fontWeight: 'bold' },
    row: { flexDirection: "row", alignItems: "center", gap: 5 },
    rating: { marginLeft: 4 },
    reviews: { color: "#888", fontSize: 13 },
    location: { color: "#777" },
    price: { color: "#886BC1", fontSize: 22, fontWeight: 'bold' },
    priceLabel: { color: "#888", textAlign: 'right' },
    badges: { flexDirection: "row", gap: 10, marginTop: 10 },
    badge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F6D9F1", padding: 6, borderRadius: 20 },
    statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20 },
    statCardPurple: { flex: 1, backgroundColor: "#886BC1", padding: 20, borderRadius: 20 },
    statCard: { flex: 1, backgroundColor: "white", padding: 20, borderRadius: 20, elevation: 2 },
    statValue: { fontSize: 22, color: "white", fontWeight: 'bold' },
    statValuePurple: { fontSize: 22, color: "#886BC1", fontWeight: 'bold' },
    statLabel: { fontSize: 12, color: '#666' },
    tabs: { flexDirection: "row", backgroundColor: "white", margin: 20, borderRadius: 20, padding: 5, elevation: 3 },
    tabButton: { flex: 1, padding: 10, alignItems: "center" },
    activeTab: { backgroundColor: "#FF768A", borderRadius: 15 },
    tabText: { color: "#666" },
    tabTextActive: { color: "white", fontWeight: 'bold' },
    section: { paddingHorizontal: 20, gap: 15, paddingBottom: 40 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
    sectionTitle: { fontSize: 16, fontWeight: "600" },
    editText: { color: "#886BC1", fontWeight: "500" },
    about: { color: "#666", lineHeight: 20 },
    skillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    skill: { backgroundColor: "#F6D9F1", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    certRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    availabilityRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },

    skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  skillTag: {
    backgroundColor: '#FFE4EA', // Un color rosa suave como el de tu app
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillText: {
    color: '#FF768A',
    fontSize: 14,
    fontWeight: '500',
  },
  certText: {
    fontSize: 15,
    color: '#374151',          // Un gris oscuro profesional
    flex: 1,                   // Por si el nombre es muy largo, que no rompa el diseño
  },

});