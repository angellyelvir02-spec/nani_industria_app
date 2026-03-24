import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ENDPOINTS } from "../../../constants/apiConfig";

export default function ClientRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert("Error", "Ingresa tu nombre completo");
      return false;
    }
    if (!formData.email.includes("@")) {
      Alert.alert("Error", "Ingresa un correo válido");
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const data = new FormData();
      data.append("nombre", formData.firstName);
      data.append("apellido", formData.lastName);
      data.append("correo", formData.email);
      data.append("password", formData.password);

      const response = await fetch(ENDPOINTS.register_cliente, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Error al registrar");

      Alert.alert(
        "¡Cuenta creada!",
        "Ya eres parte de Nani. Por favor, inicia sesión para explorar.",
        [{ text: "Ir al Login", onPress: () => router.replace("/login") }],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#886BC1", "#FF768A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Únete a Nani</Text>
            <Text style={styles.headerSubtitle}>
              Crea tu cuenta en 10 segundos
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos de acceso</Text>

          <Text style={styles.label}>Nombres</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Tu nombre"
              style={styles.input}
              onChangeText={(v) => handleInputChange("firstName", v)}
            />
          </View>

          <Text style={styles.label}>Apellidos</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Tus apellidos"
              style={styles.input}
              onChangeText={(v) => handleInputChange("lastName", v)}
            />
          </View>

          <Text style={styles.label}>Correo electrónico</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="tu@email.com"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(v) => handleInputChange("email", v)}
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Mínimo 6 caracteres"
              style={styles.input}
              secureTextEntry
              onChangeText={(v) => handleInputChange("password", v)}
            />
          </View>

          <Text style={styles.label}>Confirmar contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Repite tu contraseña"
              style={styles.input}
              secureTextEntry
              onChangeText={(v) => handleInputChange("confirmPassword", v)}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.mainBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.mainBtnText}>Crear cuenta</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ... (Los estilos se mantienen igual que los tuyos)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: "white", fontWeight: "bold", fontSize: 18 },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  content: { padding: 20 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 15,
    fontSize: 15,
    color: "#2E2E2E",
  },
  label: { fontSize: 13, color: "#6B7280", marginBottom: 6, marginTop: 10 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
  },
  input: { flex: 1, fontSize: 14, color: "#111827" },
  mainBtn: {
    backgroundColor: "#FF768A",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 40,
  },
  mainBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
