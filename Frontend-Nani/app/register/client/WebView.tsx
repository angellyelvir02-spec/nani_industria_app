/*import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function PaymentScreen() {
  const router = useRouter();
  const { url, reservaId } = useLocalSearchParams();

  // Esta función detecta cambios en la URL del WebView
  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;

    // DEFINIR AQUÍ TUS URLS DE ÉXITO O CANCELACIÓN
    // Estas son las que configurarás en el dashboard de PixelPay
    if (
      currentUrl.includes("pago-exito") ||
      currentUrl.includes("order-completed")
    ) {
      Alert.alert("¡Éxito!", "Tu pago ha sido procesado correctamente.");
      router.replace("/register/client/BabysitterProfile"); // Te manda al inicio
    }

    if (
      currentUrl.includes("pago-error") ||
      currentUrl.includes("pago-cancelado")
    ) {
      Alert.alert(
        "Pago fallido",
        "No se pudo procesar el pago. Inténtalo de nuevo.",
      );
      router.back(); // Regresa a la pantalla de reserva
    }
  };

  if (!url) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#886BC1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: String(url) }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator
            color="#886BC1"
            size="large"
            style={styles.loading}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: {
    position: "absolute",
    height: "100%",
    width: "100%",
  },
});
*/
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function PaymentScreen() {
  const router = useRouter();
  const { url } = useLocalSearchParams();
  const [isError, setIsError] = useState(false);

  // 1. VALIDACIÓN DE NAVEGACIÓN (Lógica central)
  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;

    // URLs de Éxito
    if (currentUrl.includes("pago-exito") || currentUrl.includes("order-completed")) {
      Alert.alert(
        "¡Pago Exitoso!", 
        "Tu reserva se ha confirmado correctamente.",
        [{ text: "Entendido", onPress: () => router.replace("/register/client/BabysitterProfile") }]
      );
      return;
    }

    // URLs de Error o Cancelación
    if (currentUrl.includes("pago-error") || currentUrl.includes("pago-cancelado")) {
      Alert.alert(
        "Pago no procesado",
        "Hubo un inconveniente con la transacción. ¿Deseas intentar de nuevo?",
        [
          { text: "Regresar", onPress: () => router.back(), style: "cancel" },
          { text: "Reintentar", onPress: () => setIsError(false) } // Recarga el estado
        ]
      );
    }
  };

  // 2. VALIDACIÓN INICIAL: Si no hay URL, mostramos error de inmediato
  if (!url) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={50} color="#EF4444" />
        <Text style={styles.errorText}>No se pudo generar el enlace de pago.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SIMPLE PARA CERRAR */}
      <View style={styles.miniHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#2E2E2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pago Seguro</Text>
      </View>

      <WebView
        source={{ uri: String(url) }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        // 3. VALIDACIÓN DE CARGA: Manejo de errores de red (ej. sin internet)
        onError={() => setIsError(true)}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#886BC1" size="large" />
            <Text style={styles.loadingText}>Conectando con la pasarela...</Text>
          </View>
        )}
      />

      {isError && (
        <View style={styles.errorOverlay}>
          <Ionicons name="cloud-offline-outline" size={50} color="#EF4444" />
          <Text style={styles.errorText}>Error de conexión al procesar el pago.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Reintentar más tarde</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  miniHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 16, fontWeight: "bold", marginLeft: 15, color: "#2E2E2E" },
  closeBtn: { padding: 5 },
  loadingContainer: {
    position: "absolute",
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingText: { marginTop: 10, color: "#6B7280", fontSize: 14 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 20,
  },
  retryBtn: { backgroundColor: "#FF768A", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 15 },
  retryBtnText: { color: "white", fontWeight: "bold" },
  backBtn: { marginTop: 10 },
  backBtnText: { color: "#886BC1", fontWeight: "600" },
});