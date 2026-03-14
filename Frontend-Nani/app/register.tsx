import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"client" | "babysitter" | null>(null);

  return (
    <LinearGradient
      colors={["#886BC1", "#FF768A"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* BOTÓN VOLVER */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/login")}
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>

        {/* TÍTULO */}
        <View style={styles.header}>
          <Text style={styles.title}>¡Bienvenido a Nani!</Text>
          <Text style={styles.subtitle}>
            ¿Qué tipo de cuenta deseas crear?
          </Text>
        </View>

        {/* CLIENTE */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("./register/client/ClientRegistrationForm")}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: "#FF768A" }]}>
              <Feather name="users" size={28} color="white" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Soy Cliente</Text>
              <Text style={styles.cardDescription}>
                Busco una niñera confiable para cuidar a mis hijos
              </Text>

              <View style={styles.bulletRow}>
                <Ionicons name="checkmark" size={16} color="#FF768A" />
                <Text style={styles.bulletText}>
                  Encuentra niñeras verificadas
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Ionicons name="checkmark" size={16} color="#FF768A" />
                <Text style={styles.bulletText}>
                  Reserva fácil y rápido
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Ionicons name="checkmark" size={16} color="#FF768A" />
                <Text style={styles.bulletText}>
                  Pago seguro
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* NIÑERA */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("./register/babysister/BabysitterRegistrationForm")}
        >
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: "#886BC1" }]}>
              <MaterialCommunityIcons
                name="baby-face-outline"
                size={28}
                color="white"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Soy Niñera</Text>
              <Text style={styles.cardDescription}>
                Quiero ofrecer mis servicios de cuidado infantil
              </Text>

              <View style={styles.bulletRow}>
                <Ionicons name="checkmark" size={16} color="#886BC1" />
                <Text style={styles.bulletText}>
                  Gana dinero extra
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Ionicons name="checkmark" size={16} color="#886BC1" />
                <Text style={styles.bulletText}>
                  Gestiona tu disponibilidad
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <Ionicons name="checkmark" size={16} color="#886BC1" />
                <Text style={styles.bulletText}>
                  Perfil verificado y confiable
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Verificación biométrica
          </Text>
          <Text style={styles.infoText}>
            Todos nuestros usuarios pasan por un proceso de verificación con reconocimiento facial para garantizar la seguridad.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    color: "white",
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 6,
  },
  cardRow: {
    flexDirection: "row",
    gap: 15,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E2E2E",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginVertical: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  bulletText: {
    fontSize: 13,
    color: "#666",
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
  },
  infoTitle: {
    color: "white",
    fontWeight: "700",
    marginBottom: 6,
  },
  infoText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  },
});