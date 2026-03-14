import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";

interface AboutUsScreenProps {
  onBack: () => void;
}

export function AboutUsScreen({ onBack }: AboutUsScreenProps) {
  const commitments = [
    "Atención personalizada 24/7",
    "Seguro de accidentes incluido",
    "Pagos seguros y transparentes",
    "Garantía de satisfacción",
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sobre Nani</Text>
      </View>

      {/* Misión */}
      <View style={styles.mission}>
        <View style={styles.iconWrapper}>
          <Ionicons name="heart" size={32} color="#fff" />
        </View>
        <Text style={styles.missionTitle}>Nuestra Misión</Text>
        <Text style={styles.missionText}>
          En Nani, creemos que cada niño merece un cuidado excepcional y cada padre la tranquilidad de saber que sus hijos están en las mejores manos.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {/* Seguridad */}
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: "#FFE0E5" }]}>
            <Ionicons name="shield" size={20} color="#FF768A" />
          </View>
          <View>
            <Text style={styles.featureTitle}>Seguridad Rigurosa</Text>
            <Text style={styles.featureText}>
              Cada niñera pasa por un proceso de validación que incluye antecedentes penales, referencias verificadas y entrevistas personales.
            </Text>
          </View>
        </View>

        {/* Expertas */}
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: "#E0EBFF" }]}>
            <FontAwesome5 name="star" size={20} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.featureTitle}>Expertas en Cuidado</Text>
            <Text style={styles.featureText}>
              Fomentamos el desarrollo infantil a través de profesionales con experiencia en pedagogía, primeros auxilios y recreación.
            </Text>
          </View>
        </View>

        {/* Comunidad */}
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: "#F3E8FF" }]}>
            <FontAwesome5 name="users" size={20} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.featureTitle}>Comunidad Activa</Text>
            <Text style={styles.featureText}>
              Unimos familias para crear una red de apoyo basada en la confianza mutua y recomendaciones reales.
            </Text>
          </View>
        </View>
      </View>

      {/* Commitments */}
      <View style={styles.commitments}>
        <Text style={styles.commitmentsTitle}>Nuestro Compromiso</Text>
        {commitments.map((item, index) => (
          <View key={index} style={styles.commitmentItem}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
            <Text style={styles.commitmentText}>{item}</Text>
          </View>
        ))}
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
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginRight: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  mission: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  iconWrapper: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 16,
    borderRadius: 50,
    marginBottom: 12,
  },
  missionTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  missionText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    textAlign: "center",
  },
  features: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  featureCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  featureIcon: {
    padding: 12,
    borderRadius: 16,
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: "#6B7280",
  },
  commitments: {
    backgroundColor: "rgba(255,255,255,0.1)",
    margin: 16,
    borderRadius: 32,
    padding: 24,
  },
  commitmentsTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  commitmentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  commitmentText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
});