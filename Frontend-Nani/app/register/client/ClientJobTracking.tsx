import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Phone,
  MessageCircle,
  QrCode,
  AlertCircle,
  Copy,
  Star,
} from "lucide-react-native";

export default function ClientJobTracking() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const booking = {
    id: Number(params.bookingId ?? 0),
    babysitterName: String(params.babysitterName ?? ""),
    babysitterPhoto: String(params.babysitterPhoto ?? ""),
    time: String(params.time ?? ""),
    children: Number(params.children ?? 0),
    address: String(params.address ?? ""),
    payment: Number(params.payment ?? 0),
    paymentMethod: String(params.paymentMethod ?? ""),
    childrenDetails: String(params.childrenDetails ?? ""),
    notes: String(params.notes ?? ""),
    scheduledHours: Number(params.scheduledHours ?? 0),
    hourlyRate: Number(params.hourlyRate ?? 0),
    location: {
      latitude: Number(params.latitude ?? 0),
      longitude: Number(params.longitude ?? 0),
    },
    babysitterPhone: String(params.babysitterPhone ?? ""),
  };

  const [qrValue, setQrValue] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const qrData = {
      type: "checkin",
      bookingId: booking.id,
      timestamp: Date.now(),
      location: {
        latitude: booking.location.latitude,
        longitude: booking.location.longitude,
      },
    };

    setQrValue(JSON.stringify(qrData));
  }, [booking.id, booking.location.latitude, booking.location.longitude]);

  const handleCopyAddress = async () => {
    try {
      await Clipboard.setStringAsync(booking.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert("Error", "No se pudo copiar la dirección.");
    }
  };

  const formattedTotal = useMemo(() => {
    return `$${booking.payment}`;
  }, [booking.payment]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#886BC1", "#FF768A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View>
              <Text style={styles.headerTitle}>Detalles de la Reserva</Text>
              <Text style={styles.headerSubtitle}>Reserva #{booking.id}</Text>
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              <Clock size={24} color="#FFFFFF" />
            </View>

            <View>
              <Text style={styles.statusLabel}>Estado</Text>
              <Text style={styles.statusText}>
                Esperando llegada de niñera
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tu Niñera</Text>

            <View style={styles.babysitterRow}>
              <Image
                source={{
                  uri:
                    booking.babysitterPhoto ||
                    "https://via.placeholder.com/100",
                }}
                style={styles.babysitterImage}
              />

              <View style={styles.babysitterInfo}>
                <Text style={styles.babysitterName}>
                  {booking.babysitterName}
                </Text>

                <View style={styles.infoRow}>
                  <Clock size={16} color="#886BC1" />
                  <Text style={styles.infoText}>{booking.time}</Text>
                </View>

                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      color="#FF768A"
                      fill="#FF768A"
                    />
                  ))}
                  <Text style={styles.ratingText}>5.0</Text>
                </View>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <Users size={18} color="#886BC1" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Cuidará a</Text>
                <Text style={styles.detailValue}>{booking.childrenDetails}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ubicación</Text>

            <View style={styles.detailRow}>
              <MapPin size={18} color="#FF768A" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.addressText}>{booking.address}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyAddress}
              activeOpacity={0.8}
            >
              <Copy size={16} color="#886BC1" />
              <Text style={styles.copyButtonText}>
                {copied ? "¡Copiado!" : "Copiar dirección"}
              </Text>
            </TouchableOpacity>
          </View>

          {!!booking.notes && (
            <View style={styles.notesCard}>
              <View style={styles.notesTitleRow}>
                <AlertCircle size={18} color="#FF768A" />
                <Text style={styles.notesTitle}>Notas para la Niñera</Text>
              </View>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Detalles del Pago</Text>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Método de pago</Text>
              <Text style={styles.paymentValue}>{booking.paymentMethod}</Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Horas programadas</Text>
              <Text style={styles.paymentValue}>{booking.scheduledHours}h</Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tarifa por hora</Text>
              <Text style={styles.paymentValue}>${booking.hourlyRate}/h</Text>
            </View>

            <View style={styles.paymentDivider} />

            <View style={styles.paymentRow}>
              <Text style={styles.totalLabel}>Total estimado</Text>
              <Text style={styles.totalValue}>{formattedTotal}</Text>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                💡 El costo final puede variar si hay tiempo extra de trabajo
              </Text>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <Phone size={22} color="#886BC1" />
              </View>
              <Text style={styles.quickActionText}>Llamar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <MessageCircle size={22} color="#886BC1" />
              </View>
              <Text style={styles.quickActionText}>Mensaje</Text>
            </TouchableOpacity>
          </View>

          {!showQR ? (
            <View style={styles.qrSection}>
              <View style={styles.qrInfoCard}>
                <View style={styles.qrInfoRow}>
                  <QrCode size={18} color="#886BC1" />
                  <View style={styles.qrInfoTextWrapper}>
                    <Text style={styles.qrInfoTitle}>Código QR de Entrada</Text>
                    <Text style={styles.qrInfoDescription}>
                      Cuando la niñera llegue, genera el código QR para que ella
                      confirme su llegada escaneándolo.
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.generateQRButton}
                onPress={() => setShowQR(true)}
                activeOpacity={0.85}
              >
                <QrCode size={20} color="#FFFFFF" />
                <Text style={styles.generateQRButtonText}>
                  Generar Código QR de Entrada
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.qrCard}>
              <View style={styles.qrHeader}>
                <Text style={styles.qrCardTitle}>Código QR de Entrada</Text>
                <Text style={styles.qrCardSubtitle}>
                  Muestra este código a la niñera para que lo escanee
                </Text>
              </View>

              <View style={styles.qrCodeWrapper}>
                <QRCode value={qrValue || "empty"} size={220} color="#886BC1" />
              </View>

              <View style={styles.waitingBox}>
                <Text style={styles.waitingText}>
                  Esperando confirmación del escaneo...
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 2,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.20)",
    borderRadius: 20,
    padding: 16,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(59,130,246,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statusLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    opacity: 0.9,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    color: "#2E2E2E",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  babysitterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  babysitterImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
    backgroundColor: "#EEE",
  },
  babysitterInfo: {
    flex: 1,
  },
  babysitterName: {
    color: "#2E2E2E",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#666666",
    marginLeft: 6,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 13,
    color: "#666666",
    marginLeft: 6,
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F1F1",
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#8A8A8A",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#2E2E2E",
    lineHeight: 20,
  },
  addressText: {
    fontSize: 14,
    color: "#2E2E2E",
    lineHeight: 21,
  },
  copyButton: {
    marginTop: 14,
    backgroundColor: "#F6D9F1",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  copyButtonText: {
    color: "#886BC1",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  notesCard: {
    backgroundColor: "#FFF5F7",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,118,138,0.20)",
  },
  notesTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  notesTitle: {
    color: "#2E2E2E",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  notesText: {
    color: "#666666",
    fontSize: 14,
    lineHeight: 21,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  paymentLabel: {
    color: "#666666",
    fontSize: 14,
  },
  paymentValue: {
    color: "#2E2E2E",
    fontSize: 14,
    fontWeight: "600",
  },
  paymentDivider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginTop: 4,
    marginBottom: 14,
  },
  totalLabel: {
    color: "#2E2E2E",
    fontSize: 15,
    fontWeight: "700",
  },
  totalValue: {
    color: "#886BC1",
    fontSize: 28,
    fontWeight: "800",
  },
  tipBox: {
    marginTop: 16,
    backgroundColor: "#F6D9F1",
    borderRadius: 12,
    padding: 12,
  },
  tipText: {
    color: "#666666",
    fontSize: 12,
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F6D9F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionText: {
    color: "#2E2E2E",
    fontSize: 14,
    fontWeight: "600",
  },
  qrSection: {
    gap: 12,
  },
  qrInfoCard: {
    backgroundColor: "#F6D9F1",
    borderRadius: 16,
    padding: 16,
  },
  qrInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  qrInfoTextWrapper: {
    flex: 1,
    marginLeft: 10,
  },
  qrInfoTitle: {
    color: "#2E2E2E",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  qrInfoDescription: {
    color: "#666666",
    fontSize: 12,
    lineHeight: 18,
  },
  generateQRButton: {
    backgroundColor: "#FF768A",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  generateQRButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    borderWidth: 2,
    borderColor: "#886BC1",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  qrHeader: {
    alignItems: "center",
    marginBottom: 18,
  },
  qrCardTitle: {
    color: "#2E2E2E",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  qrCardSubtitle: {
    color: "#666666",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  qrCodeWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  waitingBox: {
    backgroundColor: "#F6D9F1",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  waitingText: {
    color: "#2E2E2E",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
});
