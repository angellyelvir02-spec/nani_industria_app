import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  ArrowLeft,
  Award,
  CheckCircle,
  MapPin,
  Shield,
  Star,
} from "lucide-react-native";

export default function BabysitterOwnProfile() {
  const [activeTab, setActiveTab] = useState<"profile" | "bookings">("profile");

  const profile = {
    name: "María González",
    photo: "https://images.unsplash.com/photo-1584446456661-1039ed1a39d7?w=800",
    rating: 4.9,
    reviews: 127,
    hourlyRate: 15,
    experience: "5 años",
    location: "Centro, Ciudad",
    about:
      "Soy una niñera profesional con amplia experiencia en el cuidado de niños de todas las edades. Me encanta crear un ambiente seguro y divertido para los pequeños.",
    skills: [
      "Primeros auxilios",
      "Educación infantil",
      "Cocina saludable",
      "Bilingüe",
    ],
    certifications: [
      "Certificada en RCP",
      "Curso de primeros auxilios",
      "Pedagogía infantil",
    ],
    totalEarnings: 2450,
    completedBookings: 87,
  };

  const availability = [
    { day: "Lunes - Viernes", hours: "8:00 AM - 6:00 PM", available: true },
    { day: "Sábados", hours: "9:00 AM - 2:00 PM", available: true },
    { day: "Domingos", hours: "No disponible", available: false },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}

      <View style={styles.headerContainer}>
        <Image source={{ uri: profile.photo }} style={styles.headerImage} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2E2E2E" />
        </TouchableOpacity>
      </View>

      {/* PROFILE CARD */}

      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View>
            <Text style={styles.name}>{profile.name}</Text>

            <View style={styles.row}>
              <Star size={14} color="#FF768A" />
              <Text style={styles.rating}>{profile.rating}</Text>
              <Text style={styles.reviews}>({profile.reviews} reseñas)</Text>
            </View>

            <View style={styles.row}>
              <MapPin size={14} color="#888" />
              <Text style={styles.location}>{profile.location}</Text>
            </View>
          </View>

          <View>
            <Text style={styles.price}>${profile.hourlyRate}</Text>
            <Text style={styles.priceLabel}>por hora</Text>
          </View>
        </View>

        <View style={styles.badges}>
          <View style={styles.badge}>
            <Shield size={14} color="#886BC1" />
            <Text>Verificada</Text>
          </View>

          <View style={styles.badge}>
            <Award size={14} color="#886BC1" />
            <Text>{profile.experience}</Text>
          </View>
        </View>
      </View>

      {/* STATS */}

      <View style={styles.statsRow}>
        <View style={styles.statCardPurple}>
          <Text style={styles.statValue}>${profile.totalEarnings}</Text>
          <Text style={styles.statLabel}>Ganado este mes</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValuePurple}>
            {profile.completedBookings}
          </Text>
          <Text style={styles.statLabel}>Reservas completadas</Text>
        </View>
      </View>

      {/* TABS */}

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

          <Text style={styles.about}>{profile.about}</Text>

          {/* HABILIDADES */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habilidades</Text>

            <TouchableOpacity onPress={() => router.push("./EditSkills")}>
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.skillWrap}>
            {profile.skills.map((skill) => (
              <View key={skill} style={styles.skill}>
                <Text>{skill}</Text>
              </View>
            ))}
          </View>

          {/* CERTIFICACIONES */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Certificaciones</Text>

            <TouchableOpacity
              onPress={() => router.push("./EditCertifications")}
            >
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>

          {profile.certifications.map((cert) => (
            <View key={cert} style={styles.certRow}>
              <CheckCircle size={16} color="#FF768A" />
              <Text>{cert}</Text>
            </View>
          ))}

          {/* DISPONIBILIDAD */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Disponibilidad</Text>

            <TouchableOpacity
              onPress={() => router.push("./BabysitterAvailabilityEditor")}
            >
              <Text style={styles.editText}>Editar</Text>
            </TouchableOpacity>
          </View>

          {availability.map((slot, i) => (
            <View key={i} style={styles.availabilityRow}>
              <Text>{slot.day}</Text>
              <Text style={{ color: slot.available ? "#886BC1" : "#999" }}>
                {slot.hours}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  headerContainer: {
    height: 240,
  },

  headerImage: {
    width: "100%",
    height: "100%",
  },

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
  },

  profileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: {
    fontSize: 20,
    marginBottom: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  rating: {
    marginLeft: 4,
  },

  reviews: {
    color: "#888",
  },

  location: {
    color: "#777",
  },

  price: {
    color: "#886BC1",
    fontSize: 22,
  },

  priceLabel: {
    color: "#888",
  },

  badges: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F6D9F1",
    padding: 6,
    borderRadius: 20,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
  },

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
  },

  statValue: {
    fontSize: 22,
    color: "white",
  },

  statValuePurple: {
    fontSize: 22,
    color: "#886BC1",
  },

  statLabel: {
    fontSize: 12,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "white",
    margin: 20,
    borderRadius: 20,
    padding: 5,
  },

  tabButton: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },

  activeTab: {
    backgroundColor: "#FF768A",
    borderRadius: 15,
  },

  tabText: {
    color: "#666",
  },

  tabTextActive: {
    color: "white",
  },

  section: {
    paddingHorizontal: 20,
    gap: 15,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  editText: {
    color: "#886BC1",
    fontWeight: "500",
  },

  about: {
    color: "#666",
  },

  skillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skill: {
    backgroundColor: "#F6D9F1",
    padding: 8,
    borderRadius: 20,
  },

  certRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
});
