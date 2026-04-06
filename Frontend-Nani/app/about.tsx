import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function AboutScreen() {
  const router = useRouter();

  const features = [
    {
      title: "Seguridad Rigurosa",
      desc: "Cada niñera pasa por un proceso de validación que incluye antecedentes penales, referencias verificadas y entrevistas personales.",
      icon: "shield-checkmark-outline",
      iconColor: "#FF7A8A",
      bgColor: "#FFF1F2",
    },
    {
      title: "Expertas en Cuidado",
      desc: "Fomentamos el desarrollo infantil a través de profesionales con experiencia en pedagogía, primeros auxilios y recreación.",
      icon: "star-outline",
      iconColor: "#3B82F6",
      bgColor: "#EFF6FF",
    },
    {
      title: "Comunidad Activa",
      desc: "Unimos familias para crear una red de apoyo basada en la confianza mutua y recomendaciones reales.",
      icon: "people-outline",
      iconColor: "#8B6CCB",
      bgColor: "#F5F3FF",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sobre Nani</Text>
      </View>

      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={["#FF7A8A", "#E86A92", "#B074C4"]}
          style={styles.topSection}
        >
          <View style={styles.heartContainer}>
            <FontAwesome5 name="heart" size={35} color="white" solid />
          </View>

          <Text style={styles.missionTitle}>Nuestra Misión</Text>
          <Text style={styles.missionDesc}>
            En Nani, creemos que cada niño merece un cuidado excepcional y cada padre la
            tranquilidad de saber que sus hijos están en las mejores manos.
          </Text>
        </LinearGradient>

        {/* LISTA DE CARACTERÍSTICAS CON MÁS ESPACIADO */}
        <View style={styles.featuresContainer}>
          {features.map((item, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.iconWrapper, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon as any} size={30} color={item.iconColor} />
              </View>
              <View style={styles.textWrapper}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Espacio final para que no pegue al borde */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#FF7A8A" // Mantiene el color del header
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FF7A8A",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 15,
  },
  scrollContent: { 
    flexGrow: 1, 
    backgroundColor: "#FDFDFD" // Fondo casi blanco para que resalten los cuadros
  },
  topSection: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 70, // Más espacio abajo para la superposición
    paddingTop: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heartContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  missionTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  missionDesc: {
    fontSize: 17,
    color: "white",
    textAlign: "center",
    lineHeight: 26,
    opacity: 0.9,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    paddingHorizontal: 22,
    marginTop: -40, // Superposición más marcada
    gap: 20, // --- ESTO SEPARA LOS CUADROS ENTRE SÍ ---
  },
  featureCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 28,
    padding: 24, // --- MÁS ESPACIO INTERNO ---
    alignItems: "flex-start", // Alinea el icono arriba si el texto es largo
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  textWrapper: { 
    flex: 1, 
    marginLeft: 18,
    justifyContent: "center"
  },
  featureTitle: { 
    fontSize: 19, 
    fontWeight: "800", 
    color: "#2D3748", 
    marginBottom: 8 
  },
  featureDesc: { 
    fontSize: 15, 
    color: "#718096", 
    lineHeight: 22 
  },
});