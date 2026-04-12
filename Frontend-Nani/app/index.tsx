// app/index.tsx
/*import LoginScreen from "./login";

export default function Index() {
  return <LoginScreen />;
}*/
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LandingPage() {
  const router = useRouter();

  const stats = [
    { value: "500+", label: "NIÑERAS" },
    { value: "1.2k+", label: "FAMILIAS" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- SECCIÓN HERO --- */}
        <LinearGradient
          colors={["#FF7A8A", "#E86A92", "#8B6CCB"]}
          style={styles.heroContainer}
        >
          <View style={styles.header}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
            />
            <View style={styles.navButtons}>
              <TouchableOpacity 
                style={styles.outlineButton}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.outlineButtonText}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton}  onPress={() => router.push("/about")}>
                 
                <Text style={styles.outlineButtonText}>Sobre Nosotros</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.mainTitle}>
              Encuentra niñeras confiables y verificadas en minutos
            </Text>
            <Text style={styles.mainSubtitle}>
              Conecta con profesionales calificadas, revisadas y listas para cuidar lo que más amas.
            </Text>

            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.ctaButtonText}>Comenzar ahora</Text>
              <Feather name="chevron-right" size={20} color="#FF7A8A" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* --- SECCIÓN ESTADÍSTICAS --- */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Nuestras Niñeras Estrella</Text>
          <View style={styles.statsRow}>
            {stats.map((item, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- NUEVA SECCIÓN: ÚNETE A LA FAMILIA */}
        <View style={styles.joinContainer}>
          <LinearGradient
            colors={["#B074C4", "#8B6CCB"]} // Tonos morados de la captura
            style={styles.joinCard}
          >
            <Ionicons name="heart-outline" size={60} color="white" style={styles.heartIcon} />
            
            <Text style={styles.joinTitle}>Únete a la familia Nani</Text>
            
            <Text style={styles.joinSubtitle}>
              Regístrate hoy y encuentra muchas familias dispuestas a contratarte.
            </Text>

            <TouchableOpacity
              style={styles.registerCTA}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.registerCTAText}>Regístrate para comenzar</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Espacio final */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { flexGrow: 1 },
  heroContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 60 },
  logo: { width: 100, height: 40, resizeMode: "contain", tintColor: "#FFFFFF" },
  navButtons: { flexDirection: "row", gap: 10 },
  outlineButton: { borderWidth: 1.5, borderColor: "rgba(255, 255, 255, 0.8)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  outlineButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  heroContent: { alignItems: "center" },
  mainTitle: { fontSize: 32, fontWeight: "800", color: "#FFFFFF", textAlign: "center", lineHeight: 40, marginBottom: 20 },
  mainSubtitle: { fontSize: 16, color: "rgba(255, 255, 255, 0.9)", textAlign: "center", lineHeight: 24, marginBottom: 40 },
  ctaButton: { flexDirection: "row", backgroundColor: "#FFFFFF", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 20, alignItems: "center", gap: 8 },
  ctaButtonText: { color: "#FF7A8A", fontSize: 18, fontWeight: "700" },
  
  statsSection: { paddingVertical: 40, paddingHorizontal: 24, alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#8B6CCB", marginBottom: 25 },
  statsRow: { flexDirection: "row", gap: 15, justifyContent: "center" },
  statCard: { backgroundColor: "#B074C4", borderRadius: 20, paddingVertical: 25, paddingHorizontal: 20, alignItems: "center", flex: 1, maxWidth: 160 },
  statValue: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  statLabel: { color: "rgba(255, 255, 255, 0.8)", fontSize: 12, fontWeight: "600", marginTop: 4 },

  // ESTILOS DE LA NUEVA TARJETA
  joinContainer: { paddingHorizontal: 24, marginTop: 10 },
  joinCard: {
    borderRadius: 45, // Bordes muy redondeados como en la imagen
    padding: 35,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  heartIcon: { marginBottom: 15, opacity: 0.9 },
  joinTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 15,
  },
  joinSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  registerCTA: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: "center",
    elevation: 4,
  },
  registerCTAText: {
    color: "#FF7A8A", // Texto rosado como en la captura
    fontSize: 16,
    fontWeight: "700",
  },
});