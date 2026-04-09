import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { ENDPOINTS } from "../../../constants/apiConfig";

// --- TIPOS ---
type Review = {
  id: number;
  name: string;
  rating: number;
  date: string;
  comment: string;
};

type AvailabilitySlot = {
  label: string;
  time: string;
  available: boolean;
};

type ReservedDate = {
  id: number;
  day: string;
  time: string;
  status: string;
};

type Babysitter = {
  id: number;
  name: string;
  photo: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  experience: string;
  location: string;
  about: string;
  verified: boolean;
  skills: string[];
  certifications: string[];
  availability: AvailabilitySlot[];
  reservedDates: ReservedDate[];
  reviewsList: Review[];
};

export default function BabysitterProfile() {
  const router = useRouter();
  const { babysitterId } = useLocalSearchParams();

  const [babysitter, setBabysitter] = useState<Babysitter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBabysitterDetail = async () => {
      // Corrección: Si no hay ID, apagamos el cargando para mostrar el estado "No encontrada"
      if (!babysitterId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          ENDPOINTS.get_detalle_ninera(babysitterId as string),
        );
        const data = await response.json();

        if (response.ok) {
          setBabysitter({
            id: data.id,
            name: `${data.persona?.nombre || "Niñera"} ${data.persona?.apellido || ""}`,
            photo: data.persona?.foto_url || "https://via.placeholder.com/300",
            rating: 5.0,
            reviews: 0,
            hourlyRate: data.tarifa || 0,
            experience: data.experiencia || "Sin experiencia",
            location:
              data.persona?.direccion?.direccion_completa ||
              "Ubicación no disponible",
            about: data.presentacion || "Sin descripción disponible.",
            verified: data.verificada || false,
            skills: data.habilidades?.map((h: any) => h.nombre) || [],
            certifications:
              data.certificaciones?.map((c: any) => c.nombre) || [],
            availability:
              data.disponibilidad?.map((item: any) => ({
                label: item.dia_semana,
                time: `${item.hora_inicio} - ${item.hora_fin}`,
                available: true,
              })) || [],
            reservedDates: [],
            reviewsList: [],
          });
        }
      } catch (error) {
        Alert.alert("Error", "No se pudo conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchBabysitterDetail();
  }, [babysitterId]); // Se ejecutará cada vez que cambie o llegue el ID

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#886BC1" />
        <Text style={styles.loadingText}>Cargando perfil de Nani...</Text>
      </SafeAreaView>
    );
  }

  if (!babysitter) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Niñera no encontrada</Text>
          <TouchableOpacity
            style={styles.backButtonAlone}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonAloneText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBook = () => {
    router.push({
      pathname: "/register/client/BookingScreen",
      params: {
        babysitterId: babysitter.id,
        name: babysitter.name,
        photo: babysitter.photo,
        hourlyRate: babysitter.hourlyRate,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.imageHeader}>
            <Image
              source={{ uri: babysitter.photo }}
              style={styles.headerImage}
            />
            <View style={styles.imageOverlay} />
            <TouchableOpacity
              style={styles.topLeftButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#2E2E2E" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topRightButton}
              onPress={() =>
                Alert.alert("Compartir", `Perfil de ${babysitter.name}`)
              }
            >
              <Feather name="share-2" size={20} color="#2E2E2E" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileWrapper}>
            <View style={styles.profileCard}>
              <View style={styles.profileTopRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.profileName}>{babysitter.name}</Text>
                  <View style={styles.infoRow}>
                    <FontAwesome name="star" size={14} color="#FF768A" />
                    <Text style={styles.ratingValue}>{babysitter.rating}</Text>
                    <Text style={styles.reviewsText}>
                      ({babysitter.reviews} reseñas)
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={15}
                      color="#8A8A8A"
                    />
                    <Text style={styles.locationValue} numberOfLines={1}>
                      {babysitter.location}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.priceValue}>
                    L.{babysitter.hourlyRate}
                  </Text>
                  <Text style={styles.priceLabel}>por hora</Text>
                </View>
              </View>

              <View style={styles.badgesRow}>
                {babysitter.verified && (
                  <View style={styles.badge}>
                    <MaterialIcons
                      name="verified-user"
                      size={16}
                      color="#886BC1"
                    />
                    <Text style={styles.badgeText}>Verificada</Text>
                  </View>
                )}
                <View style={styles.badge}>
                  <Ionicons name="ribbon-outline" size={16} color="#886BC1" />
                  <Text style={styles.badgeText}>
                    {babysitter.experience} exp.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Sobre mí</Text>
              <Text style={styles.aboutText}>{babysitter.about}</Text>
            </View>
          </View>

          {babysitter.skills.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Habilidades</Text>
                <View style={styles.tagsContainer}>
                  {babysitter.skills.map((skill) => (
                    <View key={skill} style={styles.tag}>
                      <Text style={styles.tagText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Disponibilidad</Text>
              {babysitter.availability.length > 0 ? (
                babysitter.availability.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.availabilityRow,
                      index !== babysitter.availability.length - 1 &&
                        styles.rowBorder,
                    ]}
                  >
                    <Text style={styles.availabilityLabel}>{item.label}</Text>
                    <Text style={styles.availabilityTime}>{item.time}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No hay disponibilidad configurada.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Próximas Reservas</Text>
              <Text style={styles.emptyText}>
                No tienes reservas agendadas próximamente.
              </Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Reseñas</Text>
                <Text style={styles.viewAllText}>Ver todas</Text>
              </View>
              <Text style={styles.emptyText}>
                Esta niñera aún no tiene reseñas. ¡Sé el primero en contratarla!
              </Text>
            </View>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBook}
            activeOpacity={0.85}
          >
            <Text style={styles.bookButtonText}>Solicitar reserva</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  centered: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#886BC1", fontWeight: "600" },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 0 },
  imageHeader: { height: 260, position: "relative" },
  headerImage: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  topLeftButton: {
    position: "absolute",
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  topRightButton: {
    position: "absolute",
    top: 40,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileWrapper: { marginTop: -30, paddingHorizontal: 16 },
  profileCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  profileTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  profileName: { fontSize: 24, fontWeight: "700", color: "#2E2E2E" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingValue: { marginLeft: 5, fontWeight: "600" },
  reviewsText: { marginLeft: 5, color: "#9A9A9A", fontSize: 13 },
  locationValue: { marginLeft: 5, color: "#8A8A8A", flex: 1 },
  priceBox: { alignItems: "flex-end" },
  priceValue: { color: "#886BC1", fontSize: 26, fontWeight: "800" },
  priceLabel: { color: "#8A8A8A", fontSize: 12 },
  badgesRow: { flexDirection: "row", gap: 10, marginTop: 5 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6D9F1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "600",
    color: "#2E2E2E",
  },
  sectionContainer: { paddingHorizontal: 16, marginTop: 15 },
  sectionCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  aboutText: { color: "#666", lineHeight: 20 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#F6D9F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  tagText: { fontSize: 12, color: "#2E2E2E" },
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  availabilityLabel: { color: "#666" },
  availabilityTime: { color: "#886BC1", fontWeight: "600" },
  emptyText: { color: "#AAA", fontStyle: "italic", marginTop: 5 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllText: { color: "#886BC1", fontWeight: "600", fontSize: 14 },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  bookButton: {
    backgroundColor: "#FF768A",
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
  },
  bookButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  backButtonAlone: {
    backgroundColor: "#886BC1",
    padding: 15,
    borderRadius: 10,
  },
  backButtonAloneText: { color: "#FFF", fontWeight: "600" },
});
