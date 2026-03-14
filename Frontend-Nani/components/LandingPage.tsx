import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";

// Logo local
const logoImage = require("../assets/images/logo.png");

interface LandingPageProps {
  onLogin: () => void;
  onAbout: () => void;
}

export function LandingPage({ onLogin, onAbout }: LandingPageProps) {
  const screenWidth = Dimensions.get("window").width;

  const images = [
    "https://images.unsplash.com/photo-1484665754804-74b091211472?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1706025000626-6ecadce42a82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1747018838524-71c9f55e9db6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={logoImage} style={styles.logo} />
        <TouchableOpacity style={styles.loginBtn} onPress={onLogin}>
          <Text style={styles.loginText}>Entrar</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>El cuidado perfecto para tus pequeños</Text>
        <Text style={styles.heroSubtitle}>
          Conectamos a padres con niñeras de confianza, verificadas y apasionadas por el cuidado infantil.
        </Text>
        <TouchableOpacity style={styles.aboutBtn} onPress={onAbout}>
          <Text style={styles.aboutText}>Saber más de nosotros</Text>
          <Feather name="chevron-right" size={18} color="#FF768A" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Image Gallery */}
      <View style={{ marginVertical: 20 }}>
        <Text style={styles.sectionTitle}>Nuestras Niñeras Estrella</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {images.map((img, index) => (
            <View key={index} style={[styles.card, { width: screenWidth * 0.6 }]}>
              <Image source={{ uri: img }} style={styles.cardImage} />
              <View style={styles.cardOverlay}>
                <View style={{ flexDirection: "row", marginBottom: 4 }}>
                  {[...Array(5)].map((_, s) => (
                    <FontAwesome5 key={s} name="star" size={12} color="#FFD700" />
                  ))}
                </View>
                <Text style={styles.cardText}>Verificada</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* App Stats */}
      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>500+</Text>
          <Text style={styles.statLabel}>Niñeras</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>1.2k+</Text>
          <Text style={styles.statLabel}>Familias</Text>
        </View>
      </View>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <Ionicons name="heart" size={48} color="white" style={{ marginBottom: 12 }} />
        <Text style={styles.footerTitle}>Únete a la familia Nani</Text>
        <Text style={styles.footerSubtitle}>Regístrate hoy y encuentra la tranquilidad que buscas.</Text>
        <TouchableOpacity style={styles.startBtn} onPress={onLogin}>
          <Text style={styles.startText}>Empezar Ahora</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF768A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  logo: {
    width: 100,
    height: 40,
    resizeMode: "contain",
  },
  loginBtn: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 25,
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
  },
  aboutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  aboutText: {
    color: "#FF768A",
    fontWeight: "bold",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  card: {
    height: 220,
    borderRadius: 30,
    overflow: "hidden",
    marginRight: 16,
    backgroundColor: "#000",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  cardText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 120,
  },
  statNumber: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 4,
  },
  footer: {
    alignItems: "center",
    padding: 24,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  footerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  footerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 20,
  },
  startBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  startText: {
    color: "#FF768A",
    fontWeight: "bold",
    fontSize: 16,
  },
});