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
  photo?: string;
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
    const fetchFullProfile = async () => {
      if (!babysitterId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [profileRes, reviewsRes] = await Promise.all([
          fetch(ENDPOINTS.get_detalle_ninera(babysitterId as string)),
          fetch(ENDPOINTS.get_resenas_ninera(babysitterId as string)),
        ]);

        const data = await profileRes.json();
        const resData = await reviewsRes.json();

        if (profileRes.ok) {
          const rawReviews = Array.isArray(resData)
            ? resData
            : resData.data || [];

          const formattedReviews = rawReviews.map((r: any) => ({
            id: r.id,
            name: r.autor_nombre || "Usuario de Nani",
            rating: r.puntuacion || 0,
            date: r.created_at
              ? new Date(r.created_at).toLocaleDateString("es-HN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Fecha no disp.",
            comment: r.comentario || "Sin comentario.",
            photo: r.autor_foto || null,
          }));

          setBabysitter({
            id: data.id,
            name: `${data.persona?.nombre || "Niñera"} ${data.persona?.apellido || ""}`,
            photo: data.persona?.foto_url || "https://via.placeholder.com/300",
            rating: data.promedio_rating || 0.0,
            reviews: formattedReviews.length,
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
            reviewsList: formattedReviews,
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        Alert.alert("Error", "No se pudo conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchFullProfile();
  }, [babysitterId]);

  const ratingFinal = babysitter?.rating || 0;

  const handleBook = () => {
    if (!babysitter) return;
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color="#886BC1" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  if (!babysitter) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header con Imagen */}
          <View style={styles.imageHeader}>
            <Image
              source={{ uri: babysitter.photo }}
              style={styles.headerImage}
            />
            <TouchableOpacity
              style={styles.topLeftButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#2E2E2E" />
            </TouchableOpacity>
          </View>

          {/* Tarjeta Principal Corregida */}
          <View style={styles.profileWrapper}>
            <View style={styles.profileCard}>
              <View style={styles.profileTopRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  {/* numberOfLines evita que el nombre desplace el precio */}
                  <Text style={styles.profileName} numberOfLines={2}>
                    {babysitter.name}
                  </Text>
                  <View style={styles.infoRow}>
                    <FontAwesome name="star" size={14} color="#FF768A" />
                    <Text style={styles.ratingValue}>
                      {ratingFinal.toFixed(1)}
                    </Text>
                    <Text style={styles.reviewsText}>
                      ({babysitter.reviews} reseñas)
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
            </View>
          </View>

          {/* Sobre mí */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Sobre mí</Text>
              <Text style={styles.aboutText}>{babysitter.about}</Text>
            </View>
          </View>

          {/* Disponibilidad */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Disponibilidad</Text>
              {babysitter.availability.map((item, index) => (
                <View key={index} style={styles.availabilityRow}>
                  <Text style={styles.availabilityLabel}>{item.label}</Text>
                  <Text style={styles.availabilityTime}>{item.time}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reseñas Corregidas */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Reseñas de padres</Text>
                <View style={styles.miniRatingContainer}>
                  <FontAwesome name="star" size={12} color="#FF768A" />
                  <Text style={styles.miniRatingText}>
                    {ratingFinal.toFixed(1)}
                  </Text>
                </View>
              </View>

              {babysitter.reviewsList.map((review, index) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    {/* flex: 1 aquí permite que el nombre se corte si es muy largo */}
                    <View style={styles.authorInfo}>
                      <View style={styles.avatarPlaceholder}>
                        {review.photo ? (
                          <Image
                            source={{ uri: review.photo }}
                            style={styles.authorAvatar}
                          />
                        ) : (
                          <Text style={styles.avatarText}>
                            {review.name.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewAuthor} numberOfLines={1}>
                          {review.name}
                        </Text>
                        <Text style={styles.reviewDate}>{review.date}</Text>
                      </View>
                    </View>
                    <View style={styles.starsRow}>
                      {[...Array(5)].map((_, i) => (
                        <FontAwesome
                          key={i}
                          name="star"
                          size={10}
                          color={i < review.rating ? "#FF768A" : "#E0E0E0"}
                          style={{ marginLeft: 2 }}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        <View style={styles.bottomAction}>
          <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
            <Text style={styles.bookButtonText}>Solicitar reserva</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#886BC1" },
  container: { flex: 1 },
  imageHeader: { height: 260 },
  headerImage: { width: "100%", height: "100%" },
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
    elevation: 5,
  },
  profileWrapper: { marginTop: -30, paddingHorizontal: 16 },
  profileCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    elevation: 4,
  },
  profileTopRow: { flexDirection: "row", justifyContent: "space-between" },
  profileName: { fontSize: 22, fontWeight: "700", color: "#2E2E2E" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingValue: { marginLeft: 5, fontWeight: "600" },
  reviewsText: { marginLeft: 5, color: "#9A9A9A", fontSize: 12 },
  priceBox: { alignItems: "flex-end", minWidth: 80 },
  priceValue: { color: "#886BC1", fontSize: 24, fontWeight: "800" },
  priceLabel: { color: "#8A8A8A", fontSize: 11 },
  sectionContainer: { paddingHorizontal: 16, marginTop: 15 },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 10,
  },
  aboutText: { color: "#666", lineHeight: 20 },
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  availabilityLabel: { color: "#666" },
  availabilityTime: { color: "#886BC1", fontWeight: "700" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  miniRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  miniRatingText: {
    marginLeft: 4,
    color: "#FF768A",
    fontWeight: "800",
    fontSize: 12,
  },
  reviewItem: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0DAFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  authorAvatar: { width: "100%", height: "100%", borderRadius: 18 },
  avatarText: { color: "#886BC1", fontWeight: "bold" },
  reviewAuthor: { fontWeight: "700", color: "#2E2E2E" },
  reviewDate: { fontSize: 11, color: "#AAA" },
  starsRow: { flexDirection: "row" },
  reviewComment: { marginTop: 8, color: "#555", fontSize: 13, paddingLeft: 46 },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  bookButton: {
    backgroundColor: "#FF768A",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  bookButtonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
