import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ENDPOINTS } from "../../../constants/apiConfig";

export default function ClientRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 1. ESTADO NUEVO: Aquí guardamos los mensajes de error de cada campo
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // 2. ACTUALIZADO: Borra el error de la pantalla en cuanto empiezas a escribir
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // 3. NUEVO: Esta función se dispara cada vez que "sales" de una cajita de texto
  const validateField = (field: string, value: string) => {
    let error = null;

    if (field === "firstName") {
      const nombres = value.trim().split(/\s+/);
      if (nombres.length < 2 || nombres[0] === "") {
        error = "Ingresa tus dos nombres.";
      } else if (!nombres.every(nombre => /^[A-ZÁÉÍÓÚÑ]/.test(nombre))) {
        error = "Cada nombre debe iniciar con mayúscula.";
      }
    }

    if (field === "lastName") {
      const apellidos = value.trim().split(/\s+/);
      if (apellidos.length < 2 || apellidos[0] === "") {
        error = "Ingresa tus dos apellidos.";
      } else if (!apellidos.every(apellido => /^[A-ZÁÉÍÓÚÑ]/.test(apellido))) {
        error = "Cada apellido debe iniciar con mayúscula.";
      }
    }

    if (field === "email") {
      const emailLimpio = value.trim().toLowerCase();
      if (!emailLimpio.endsWith("@gmail.com") && !emailLimpio.endsWith("@icloud.com")) {
        error = "Solo aceptamos correos @gmail.com o @icloud.com.";
      }
    }

    if (field === "password") {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;
      if (!passwordRegex.test(value)) {
        error = "Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo.";
      }
    }

    if (field === "confirmPassword") {
      if (value !== formData.password) {
        error = "Las contraseñas no coinciden.";
      }
    }

    setErrors((prev: any) => ({ ...prev, [field]: error }));
  };

  // 4. ACTUALIZADO: Revisa que todo esté perfecto justo antes de enviar al backend
  const validateForm = () => {
    let isValid = true;
    let newErrors: any = {};

    const nombres = formData.firstName.trim().split(/\s+/);
    if (nombres.length < 2 || nombres[0] === "" || !nombres.every(n => /^[A-ZÁÉÍÓÚÑ]/.test(n))) {
      newErrors.firstName = "Revisa tus nombres.";
      isValid = false;
    }

    const apellidos = formData.lastName.trim().split(/\s+/);
    if (apellidos.length < 2 || apellidos[0] === "" || !apellidos.every(a => /^[A-ZÁÉÍÓÚÑ]/.test(a))) {
      newErrors.lastName = "Revisa tus apellidos.";
      isValid = false;
    }

    const emailLimpio = formData.email.trim().toLowerCase();
    if (!emailLimpio.endsWith("@gmail.com") && !emailLimpio.endsWith("@icloud.com")) {
      newErrors.email = "Solo aceptamos correos @gmail.com o @icloud.com.";
      isValid = false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Contraseña débil.";
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword || formData.confirmPassword === "") {
      newErrors.confirmPassword = "Las contraseñas no coinciden.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Campos incompletos", "Por favor corrige los errores en rojo antes de continuar.");
      return;
    }

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

          {/* NOMBRES */}
          <Text style={styles.label}>Nombres</Text>
          <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
            <Ionicons name="person-outline" size={18} color={errors.firstName ? "#EF4444" : "#9CA3AF"} />
            <TextInput
              placeholder="Ej: Ana María"
              style={styles.input}
              onChangeText={(v) => handleInputChange("firstName", v)}
              onBlur={() => validateField("firstName", formData.firstName)}
            />
          </View>
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

          {/* APELLIDOS */}
          <Text style={styles.label}>Apellidos</Text>
          <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
            <Ionicons name="person-outline" size={18} color={errors.lastName ? "#EF4444" : "#9CA3AF"} />
            <TextInput
              placeholder="Ej: Pérez López"
              style={styles.input}
              onChangeText={(v) => handleInputChange("lastName", v)}
              onBlur={() => validateField("lastName", formData.lastName)}
            />
          </View>
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

          {/* CORREO */}
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={[styles.inputContainer, errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={18} color={errors.email ? "#EF4444" : "#9CA3AF"} />
            <TextInput
              placeholder="tu@gmail.com o @icloud.com"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(v) => handleInputChange("email", v)}
              onBlur={() => validateField("email", formData.email)}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* CONTRASEÑA */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={[styles.inputContainer, errors.password && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={18} color={errors.password ? "#EF4444" : "#9CA3AF"} />
            <TextInput
              placeholder="Mínimo 8 caracteres"
              style={styles.input}
              secureTextEntry
              onChangeText={(v) => handleInputChange("password", v)}
              onBlur={() => validateField("password", formData.password)}
            />
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* CONFIRMAR CONTRASEÑA */}
          <Text style={styles.label}>Confirmar contraseña</Text>
          <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={18} color={errors.confirmPassword ? "#EF4444" : "#9CA3AF"} />
            <TextInput
              placeholder="Repite tu contraseña"
              style={styles.input}
              secureTextEntry
              onChangeText={(v) => handleInputChange("confirmPassword", v)}
              onBlur={() => validateField("confirmPassword", formData.confirmPassword)}
            />
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
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
  
  // 5. NUEVOS ESTILOS PARA LOS ERRORES
  errorText: {
    color: "#EF4444", 
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 1,
  },
});