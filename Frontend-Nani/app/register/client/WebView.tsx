import React from "react";
import { StyleSheet, View, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

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
