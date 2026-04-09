import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ENDPOINTS } from '../constants/apiConfig';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // NUEVO: Estados para los errores visuales
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // NUEVO: Funciones de validación individual (OnBlur)
  const validateEmail = () => {
    const emailLimpio = email.trim().toLowerCase();
    if (!emailLimpio) {
      setEmailError("Ingresa tu correo electrónico.");
      return false;
    } else if (!emailLimpio.endsWith("@gmail.com") && !emailLimpio.endsWith("@icloud.com")) {
      setEmailError("Solo aceptamos correos @gmail.com o @icloud.com.");
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (!password) {
      setPasswordError("Ingresa tu contraseña.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    // Validamos todo junto antes de enviar
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isEmailValid || !isPasswordValid) {
      return; // Detenemos la ejecución si hay errores
    }

    try {
      setLoading(true);

      const response = await fetch(ENDPOINTS.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: email.trim().toLowerCase(), // Enviamos limpio al backend
          password: password,
        }),
      });

      const data = await response.json();

   if (!response.ok) {
  setLoading(false);
  const data = await response.json().catch(() => ({}));
  let mensaje = "";

  // 1. Determinar el mensaje según el status
  if (response.status === 404) {
    mensaje = "Este correo no está registrado.";
    setEmailError(mensaje);
  } else if (response.status === 401) {
    mensaje = "La contraseña o el correo es incorrecta.";
    setPasswordError(mensaje);
  } else {
    mensaje = data.message || "Ocurrió un error inesperado";
  }

  // 2. DISPARAR LA ALERTA SEGÚN LA PLATAFORMA (Igual que en tu HomeScreen)
  if (Platform.OS === 'web') {
    // En web usamos el alert nativo del navegador
    window.alert(mensaje); 
  } else {
    // En celular usamos el Alert de React Native
    Alert.alert("Atención", mensaje);
  }

  return;
}
      try {
        if (data.user && data.user.id) {
          await AsyncStorage.setItem("userId", data.user.id.toString());
          await AsyncStorage.setItem("userRole", data.user.rol);

          if (data.session?.access_token) {
            await AsyncStorage.setItem("userToken", data.session.access_token);
          }

          if (data.user.rol === 'ninera') {
            router.replace("/register/babysister/BabysitterDashboard");
          } else if (data.user.rol === 'cliente') {
            router.replace("/register/client/home");
          } else {
            router.replace("/");
          }
        } else {
          throw new Error("El servidor no devolvió los datos del usuario");
        }
      } catch (storageError) {
        console.error("Error al guardar sesión", storageError);
        Alert.alert("Error", "No se pudo guardar la sesión en el dispositivo");
      }
    } catch (error) {
      Alert.alert("Error de red", "No se pudo conectar con el servidor. Verifica tu conexión.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#FF7A8A", "#8B6CCB"]} style={styles.container}>
      <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.subtitle}>Cuidamos lo que más amas</Text>
        </View>

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>¡Bienvenido!</Text>
          <Text style={styles.description}>Inicia sesión para continuar</Text>

          {/* EMAIL */}
          <Text style={styles.label}>Correo electrónico</Text>
          <View style={[styles.inputContainer, emailError && styles.inputError]}>
            <MaterialIcons name="email" size={20} color={emailError ? "#EF4444" : "#9CA3AF"} />
            <TextInput
              placeholder="tu@gmail.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(null); // Borra el error al escribir
              }}
              onBlur={validateEmail} // Valida al salir de la cajita
              style={styles.input}
            />
          </View>
          {emailError && <Text style={styles.errorText}>{emailError}</Text>}

          {/* PASSWORD */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={[styles.inputContainer, passwordError && styles.inputError]}>
            <Feather name="lock" size={20} color={passwordError ? "#EF4444" : "#9CA3AF"} />
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(null);
              }}
              onBlur={validatePassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

          {/* FORGOT */}
          <TouchableOpacity style={styles.forgot}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* BUTTON */}
          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          {/* DIVIDER */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.line} />
          </View>

          {/* GOOGLE */}
          <TouchableOpacity style={styles.googleButton}>
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png",
              }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleText}>Google</Text>
          </TouchableOpacity>

          {/* REGISTER */}
          <View style={styles.register}>
            <Text style={styles.registerText}>¿No tienes cuenta?</Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.registerLink}> Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20 },
  logoContainer: { alignItems: "center", marginBottom: 30 },
  logo: { width: 160, height: 160, resizeMode: "contain" },
  subtitle: { color: "white", marginTop: 10, fontSize: 14, opacity: 0.9 },
  card: { backgroundColor: "white", borderRadius: 32, padding: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", color: "#111827" },
  description: { textAlign: "center", color: "#6B7280", marginBottom: 20 },
  label: { fontSize: 13, color: "#374151", marginBottom: 6, marginTop: 4 },
  
  // Modificado: Quitamos el marginBottom de aquí para manejarlo dinámicamente con el error
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 14, color: "#111827" },
  
  forgot: { alignItems: "flex-end", marginBottom: 16, marginTop: 8 },
  forgotText: { fontSize: 12, color: "#8B6CCB" },
  loginButton: { backgroundColor: "#FF7A8A", borderRadius: 16, paddingVertical: 14, alignItems: "center", marginBottom: 16, height: 50, justifyContent: 'center' },
  loginText: { color: "white", fontWeight: "700", fontSize: 15 },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  line: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 8, fontSize: 12, color: "#6B7280" },
  googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 16, paddingVertical: 12, gap: 10, marginBottom: 16 },
  googleIcon: { width: 18, height: 18 },
  googleText: { fontSize: 14, color: "#111827", fontWeight: "500" },
  register: { flexDirection: "row", justifyContent: "center" },
  registerText: { fontSize: 13, color: "#6B7280" },
  registerLink: { fontSize: 13, color: "#8B6CCB", fontWeight: "600" },

  // ESTILOS NUEVOS PARA LOS ERRORES
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4, marginLeft: 4, marginBottom: 10 },
  inputError: { borderColor: "#EF4444", borderWidth: 1 },
});