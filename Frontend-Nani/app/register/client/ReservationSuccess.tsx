import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export default function ReservationSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parámetros con valores de respaldo
  const codigoReserva = params.codigoReserva || "RES-PENDIENTE";
  const montoTotal = params.montoTotal || "0";
  const nombreNinera = params.nombreNinera || "Niñera Nani";
  const fecha = params.fecha || "Fecha no definida";
  const nombreCliente = params.nombreCliente || "Usuario Nani";
  const correoCliente = params.correoCliente || "No disponible";

  // Parsear la lista de niños
  const listaNinos = params.ninos ? JSON.parse(String(params.ninos)) : [];

  const descargarComprobante = async () => {
    const montoFormateado = parseFloat(String(montoTotal)).toFixed(2);

    // Generar bloque de texto para los niños en el PDF
    const ninosNombres = listaNinos
      .map((n: any) => `${n.nombre} (${n.edad} años)`)
      .join(", ");

    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: 'Helvetica', Arial, sans-serif; padding: 20px; color: #333; }
            .ticket { border: 2px dashed #886BC1; padding: 30px; border-radius: 20px; background-color: #fff; }
            .header { text-align: center; margin-bottom: 25px; }
            .brand { color: #886BC1; font-size: 35px; font-weight: bold; margin-bottom: 5px; }
            .res-code { font-size: 18px; color: #555; font-weight: bold; }
            .status-banner { 
              background-color: #FFF4E5; 
              color: #B07219; 
              text-align: center; 
              padding: 8px; 
              border-radius: 8px; 
              font-size: 12px; 
              font-weight: bold; 
              margin-bottom: 20px;
              border: 1px solid #FFE6C9;
            }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #F0F0F0; padding-bottom: 5px; }
            .label { color: #888; font-size: 13px; text-transform: uppercase; }
            .value { font-weight: bold; font-size: 14px; color: #2E2E2E; }
            .price-box { background: #F9F7FF; padding: 20px; text-align: center; border-radius: 15px; margin-top: 25px; border: 1px solid #E0D1F9; }
            .price-label { color: #886BC1; font-size: 11px; font-weight: bold; letter-spacing: 1px; }
            .price { font-size: 32px; color: #886BC1; font-weight: 900; margin-top: 5px; }
            .clause-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #EEE; }
            .clause-title { font-size: 11px; font-weight: bold; color: #886BC1; margin-bottom: 8px; }
            .clause-text { font-size: 10px; color: #666; text-align: justify; line-height: 1.5; }
            .highlight { color: #2E2E2E; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="brand">Nani</div>
              <div class="res-code">ID: ${codigoReserva}</div>
            </div>

            <div class="status-banner">SOLICITUD ENVIADA - PENDIENTE DE ACEPTACIÓN</div>

            <div class="info-row"><span class="label">Cliente:</span><span class="value">${nombreCliente}</span></div>
            <div class="info-row"><span class="label">Correo:</span><span class="value">${correoCliente}</span></div>
            <div class="info-row"><span class="label">Niñera:</span><span class="value">${nombreNinera}</span></div>
            <div class="info-row"><span class="label">Fecha:</span><span class="value">${fecha}</span></div>
            <div class="info-row"><span class="label">Menores:</span><span class="value">${ninosNombres}</span></div>

            <div class="price-box">
              <div class="price-label">MONTO TOTAL ESTIMADO</div>
              <div class="price">L ${montoFormateado}</div>
            </div>

            <div class="clause-section">
              <div class="clause-title">TÉRMINOS DEL RESPALDO DIGITAL:</div>
              <div class="clause-text">
                Este documento es un comprobante de <b>solicitud de servicio</b> generado por la plataforma <span class="highlight">Nani</span>. 
                (1) El servicio queda formalizado únicamente tras la <span class="highlight">aceptación de la niñera</span> en la aplicación. 
                (2) El cliente se compromete a realizar el pago íntegro de la tarifa mostrada al finalizar el servicio. 
                (3) En caso de pago en efectivo, el cliente debe liquidar el monto al momento de concluir el tiempo de cuidado. 
                (4) Este código de reserva sirve como referencia para auditorías de seguridad y resolución de disputas.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el archivo PDF.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-done-circle" size={100} color="#886BC1" />
        </View>

        <Text style={styles.title}>¡Reserva Solicitada!</Text>
        <Text style={styles.subtitle}>
          Esperando confirmación de la niñera.
        </Text>

        <View style={styles.ticketCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PENDIENTE DE ACEPTACIÓN</Text>
          </View>

          <Text style={styles.ticketLabel}>RESPALDO DIGITAL NANI</Text>
          <Text style={styles.refCode}>{codigoReserva}</Text>
          <View style={styles.divider} />

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cliente:</Text>
              <Text style={styles.detailValue}>{nombreCliente}</Text>
            </View>

            {listaNinos.map((nino: any, index: number) => (
              <View key={index} style={styles.detailRow}>
                <Text style={styles.detailLabel}>Niño/a:</Text>
                <Text style={styles.detailValue}>
                  {nino.nombre} ({nino.edad} años)
                </Text>
              </View>
            ))}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Niñera:</Text>
              <Text style={styles.detailValue}>{nombreNinera}</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabelCard}>TOTAL A PAGAR</Text>
            <Text style={styles.amount}>
              L {parseFloat(String(montoTotal)).toFixed(2)}
            </Text>
          </View>

          <View style={styles.clauseCard}>
            <Text style={styles.clauseTextCard}>
              * Al finalizar, el cliente se compromete al pago total del
              servicio.
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={descargarComprobante}
          >
            <Ionicons name="download-outline" size={22} color="#886BC1" />
            <Text style={styles.downloadButtonText}>
              Descargar Respaldo PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/register/client/home")}
          >
            <Text style={styles.buttonText}>Ir al Inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContent: { alignItems: "center", padding: 24 },
  iconContainer: { marginTop: 10 },
  title: { fontSize: 24, fontWeight: "800", color: "#2E2E2E", marginTop: 10 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  ticketCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#886BC1",
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  badge: {
    backgroundColor: "#FFF4E5",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 15,
  },
  badgeText: {
    color: "#B07219",
    fontSize: 10,
    fontWeight: "800",
  },
  ticketLabel: {
    textAlign: "center",
    color: "#886BC1",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  refCode: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E2E2E",
  },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 15 },
  detailsContainer: { gap: 10 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { color: "#999", fontSize: 13 },
  detailValue: { fontWeight: "600", fontSize: 13, color: "#333" },
  priceContainer: {
    marginTop: 20,
    backgroundColor: "#F9F7FF",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D1F9",
  },
  priceLabelCard: {
    fontSize: 10,
    color: "#886BC1",
    fontWeight: "bold",
    marginBottom: 5,
  },
  amount: { fontSize: 30, fontWeight: "900", color: "#886BC1" },
  clauseCard: { marginTop: 15 },
  clauseTextCard: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
  buttonContainer: { width: "100%", marginTop: 25, gap: 12 },
  button: {
    backgroundColor: "#886BC1",
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  downloadButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#886BC1",
    backgroundColor: "#FFF",
    gap: 10,
  },
  downloadButtonText: { color: "#886BC1", fontWeight: "bold", fontSize: 15 },
});

