import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

/**
 * Pantalla de pago mediante WebView
 */
export default function PaymentScreen() {
  const router = useRouter();

  // Parámetros recibidos por navegación (URL de pago)
  const { url } = useLocalSearchParams();

  // Estado para detectar errores de carga del WebView
  const [isError, setIsError] = useState(false);

  /**
   * Detecta cambios en la navegación del WebView
   * para identificar estados de pago
   */
  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;

    // Validación de pago exitoso
    if (
      currentUrl.includes("pago-exito") ||
      currentUrl.includes("order-completed")
    ) {
      Alert.alert(
        "¡Pago Exitoso!",
        "Tu reserva se ha confirmado correctamente.",
        [
          {
            text: "Entendido",
            onPress: () =>
              router.replace("/register/client/BabysitterProfile"),
          },
        ]
      );
      return;
    }

    // Validación de error o cancelación
    if (
      currentUrl.includes("pago-error") ||
      currentUrl.includes("pago-cancelado")
    ) {
      Alert.alert(
        "Pago no procesado",
        "Hubo un inconveniente con la transacción. ¿Deseas intentar de nuevo?",
        [
          {
            text: "Regresar",
            onPress: () => router.back(),
            style: "cancel",
          },
          {
            text: "Reintentar",
            onPress: () => setIsError(false),
          },
        ]
      );
    }
  };

  /**
   * Si no existe URL, se muestra pantalla de error
   */
  if (!url) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={50} color="#EF4444" />
        <Text style={styles.errorText}>
          No se pudo generar el enlace de pago.
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header superior */}
      <View style={styles.miniHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={24} color="#2E2E2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pago Seguro</Text>
      </View>

      {/* WebView de pago */}
      <WebView
        source={{ uri: String(url) }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        onError={() => setIsError(true)}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#886BC1" size="large" />
            <Text style={styles.loadingText}>
              Conectando con la pasarela...
            </Text>
          </View>
        )}
      />

      {/* Overlay de error de conexión */}
      {isError && (
        <View style={styles.errorOverlay}>
          <Ionicons
            name="cloud-offline-outline"
            size={50}
            color="#EF4444"
          />
          <Text style={styles.errorText}>
            Error de conexión al procesar el pago.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.retryBtnText}>
              Reintentar más tarde
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  miniHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 15,
    color: "#2E2E2E",
  },
  closeBtn: {
    padding: 5,
  },
  loadingContainer: {
    position: "absolute",
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 14,
  },
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
  retryBtn: {
    backgroundColor: "#FF768A",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  retryBtnText: {
    color: "white",
    fontWeight: "bold",
  },
  backBtn: {
    marginTop: 10,
  },
  backBtnText: {
    color: "#886BC1",
    fontWeight: "600",
  },
});
