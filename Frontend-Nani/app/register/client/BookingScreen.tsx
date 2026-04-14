import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ENDPOINTS } from "../../../constants/apiConfig";

// --- TIPOS ---
type TimeSlot = {
  time: string;
  status: "available" | "occupied" | "off-work";
};

type Nino = {
  id: string;
  nombre: string;
  edad: number;
};

type MetodoPago = {
  id: string;
  nombre: string;
};

export default function BookingScreen() {
  const router = useRouter();
  const { babysitterId, name, photo, hourlyRate } = useLocalSearchParams();
  const id = String(babysitterId);

  // --- ESTADOS ---
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("en-CA"),
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(
    null,
  );
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);

  const [ninos, setNinos] = useState<Nino[]>([]);
  const [selectedNinos, setSelectedNinos] = useState<string[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [notas, setNotas] = useState("");

  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string | null>(
    null,
  );
  const [isConfirming, setIsConfirming] = useState(false);

  const babysitter = useMemo(
    () => ({
      name: name ? String(name) : "Cargando...",
      photo: photo ? String(photo) : "https://via.placeholder.com/150",
      hourlyRate: hourlyRate ? parseFloat(String(hourlyRate)) : 0,
    }),
    [name, photo, hourlyRate],
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const headers = { Authorization: `Bearer ${token}` };

        const [resNinos, resMetodos] = await Promise.all([
          fetch(ENDPOINTS.get_mis_ninos, { headers }),
          fetch(ENDPOINTS.get_metodo_pago, { headers }),
        ]);

        const dataNinos = await resNinos.json();
        const dataMetodos = await resMetodos.json();

        setNinos(dataNinos || []);
        setMetodosPago(dataMetodos || []);
        if (dataMetodos.length > 0) setMetodoSeleccionado(dataMetodos[0].id);
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        setIsLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  // Carga de disponibilidad al cambiar fecha
  const fetchAvailability = useCallback(
    async (fecha: string) => {
      setIsLoadingAvailability(true);
      try {
        const response = await fetch(ENDPOINTS.get_disponibilidad(id, fecha));
        const data = await response.json();
        setTimeSlots(data || []);
        setSelectedStartTime(null);
        setSelectedEndTime(null);
      } catch (error) {
        Alert.alert("Error", "No se pudo obtener disponibilidad.");
      } finally {
        setIsLoadingAvailability(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [selectedDate, fetchAvailability]);

  const calendarDays = useMemo(() => {
    const days = [];
    const locale = "es-ES";
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = new Intl.DateTimeFormat(locale, {
        weekday: "long",
      }).format(d);
      days.push({
        numero: d.getDate(),
        inicial: new Intl.DateTimeFormat(locale, { weekday: "narrow" })
          .format(d)
          .toUpperCase(),
        nombreDia: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        fechaFull: d.toLocaleDateString("en-CA"),
      });
    }
    return days;
  }, []);

  const handleSelectSlot = (time: string) => {
    if (!selectedStartTime || (selectedStartTime && selectedEndTime)) {
      setSelectedStartTime(time);
      setSelectedEndTime(null);
    } else {
      if (time < selectedStartTime) {
        setSelectedEndTime(selectedStartTime);
        setSelectedStartTime(time);
      } else if (time === selectedStartTime) {
        setSelectedEndTime(null);
      } else {
        setSelectedEndTime(time);
      }
    }
  };

  const duration = useMemo(() => {
    if (!selectedStartTime) return 0;

    if (!selectedStartTime || !selectedEndTime) return 1;

    const start = parseInt(selectedStartTime.split(":")[0]);
    const end = parseInt(selectedEndTime.split(":")[0]);

    return end - start + 1;
  }, [selectedStartTime, selectedEndTime]);

  const pricing = useMemo(() => {
    const subtotal = babysitter.hourlyRate * duration;
    const fee = subtotal * 0.1;
    return { subtotal, fee, total: subtotal + fee };
  }, [duration, babysitter.hourlyRate]);

  // Helper para saber si el método seleccionado es tarjeta
  const esTarjetaSeleccionada = useMemo(() => {
    if (!metodoSeleccionado) return false;
    return (
      metodosPago
        .find((m) => m.id === metodoSeleccionado)
        ?.nombre.toLowerCase()
        .includes("tarjeta") ?? false
    );
  }, [metodoSeleccionado, metodosPago]);

  const handleConfirmarReserva = async () => {
    if (selectedNinos.length === 0) {
      if (Platform.OS === "web") {
        window.alert("Por favor, selecciona al menos un niño.");
      } else {
        Alert.alert(
          "Información faltante",
          "Por favor, selecciona al menos un niño.",
        );
      }
      return;
    }

    if (!selectedStartTime) {
      if (Platform.OS === "web") {
        window.alert("Debes elegir al menos una hora.");
      } else {
        Alert.alert("Selección de tiempo", "Debes elegir al menos una hora.");
      }
      return;
    }

    if (!metodoSeleccionado) {
      if (Platform.OS === "web") {
        window.alert("Por favor, selecciona un método de pago.");
      } else {
        Alert.alert(
          "Método de pago",
          "Por favor, selecciona un método de pago.",
        );
      }
      return;
    }

    const horaFinBase = selectedEndTime || selectedStartTime;

    const startIdx = timeSlots.findIndex((s) => s.time === selectedStartTime);
    const endIdx = timeSlots.findIndex((s) => s.time === horaFinBase);
    if (startIdx === -1 || endIdx === -1) {
      Alert.alert("Error", "Horario inválido.");
      return;
    }

    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);

    const hasConflict = timeSlots
      .slice(minIdx, maxIdx + 1)
      .some((s) => s.status !== "available");

    if (hasConflict) {
      if (Platform.OS === "web") {
        window.alert("El rango seleccionado incluye horas no disponibles.");
      } else {
        Alert.alert(
          "Conflicto",
          "El rango seleccionado incluye horas no disponibles.",
        );
      }
      return;
    }

    setIsConfirming(true);
    console.log("🚀 Iniciando proceso de reserva...");

    try {
      const token = await AsyncStorage.getItem("userToken");

      const sumarUnaHora = (hora: string) => {
        const [h, m] = hora.split(":").map(Number);
        const nuevaHora = h + 1;
        return `${String(nuevaHora).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      };

      const body = {
        ninera_id: id,
        metodo_pago_id: metodoSeleccionado,
        fecha_servicio: selectedDate,
        hora_inicio: selectedStartTime,
        hora_fin: sumarUnaHora(horaFinBase),
        monto_base: pricing.subtotal,
        monto_comision: pricing.fee,
        tarifa_por_hora: babysitter.hourlyRate,
        propina: 0,
        notas_importantes: notas,
        ninos_ids: selectedNinos,
      };

      const response = await fetch(ENDPOINTS.crear_reserva, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Error en la reserva");
      }

      // Si es tarjeta y el backend devuelve una URL de pago (PixelPay), redirigir
      if (esTarjetaSeleccionada && result.pixelPayUrl) {
        router.push({
          pathname: "/register/client/WebView",
          params: { url: result.pixelPayUrl, reservaId: result.reservaId },
        });
      } else {
        const ninosDetalle = ninos.filter((n) => selectedNinos.includes(n.id));

        const successMsg = "Reserva creada correctamente.";

        if (Platform.OS === "web") {
          window.alert(successMsg);
          router.replace({
            pathname: "/register/client/ReservationSuccess" as any,
            params: {
              reservaId: result.reservaId,
              codigoReserva: result.codigoReserva,
              montoTotal: result.montoTotal || pricing.total,
              nombreNinera: babysitter.name,
              fecha: selectedDate,
              ninos: JSON.stringify(ninosDetalle),
              metodoPago:
                metodosPago.find((m) => m.id === metodoSeleccionado)?.nombre ||
                "",
            },
          });
        } else {
          Alert.alert("¡Éxito!", successMsg, [
            {
              text: "OK",
              onPress: () =>
                router.replace({
                  pathname: "/register/client/ReservationSuccess" as any,
                  params: {
                    reservaId: result.reservaId,
                    codigoReserva: result.codigoReserva,
                    montoTotal: result.montoTotal || pricing.total,
                    nombreNinera: babysitter.name,
                    fecha: selectedDate,
                    ninos: JSON.stringify(ninosDetalle),
                    metodoPago:
                      metodosPago.find((m) => m.id === metodoSeleccionado)
                        ?.nombre || "",
                  },
                }),
            },
          ]);
        }
      }
    } catch (error: any) {
      console.error("Error:", error);

      if (Platform.OS === "web") {
        window.alert("Error: " + (error.message || "No se pudo conectar"));
      } else {
        Alert.alert(
          "Error de Conexión",
          error.message || "No se pudo conectar.",
        );
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBackButton}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nueva Reserva</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Tarjeta Niñera */}
          <View style={styles.babysitterCard}>
            <Image
              source={{ uri: babysitter.photo }}
              style={styles.babysitterImage}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={styles.babysitterName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {babysitter.name}
              </Text>
              <Text style={styles.babysitterRate}>
                L {babysitter.hourlyRate.toFixed(2)}/h
              </Text>
            </View>
          </View>

          {/* Niños */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitlePlain}>¿A quién cuidaremos?</Text>
            {isLoadingInitial ? (
              <ActivityIndicator color="#886BC1" />
            ) : (
              <View style={styles.ninosGrid}>
                {ninos.map((nino) => {
                  const isSel = selectedNinos.includes(nino.id);
                  return (
                    <TouchableOpacity
                      key={nino.id}
                      style={[
                        styles.ninoChip,
                        isSel && styles.ninoChipSelected,
                      ]}
                      onPress={() =>
                        setSelectedNinos((prev) =>
                          isSel
                            ? prev.filter((i) => i !== nino.id)
                            : [...prev, nino.id],
                        )
                      }
                    >
                      <Ionicons
                        name={isSel ? "checkbox" : "square-outline"}
                        size={18}
                        color={isSel ? "#FFF" : "#886BC1"}
                      />
                      <Text
                        style={[
                          styles.ninoText,
                          isSel && styles.ninoTextSelected,
                        ]}
                      >
                        {nino.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Notas */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitlePlain}>Notas Importantes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Alergias, reglas de la casa..."
              multiline
              numberOfLines={3}
              value={notas}
              onChangeText={setNotas}
            />
          </View>

          {/* ── MÉTODO DE PAGO — ahora siempre visible ── */}
          <View style={styles.sectionCard}>
            <View style={styles.paymentSectionHeader}>
              <Ionicons name="wallet-outline" size={20} color="#886BC1" />
              <Text style={styles.sectionTitlePlain}>Método de Pago</Text>
            </View>
            {isLoadingInitial ? (
              <ActivityIndicator color="#886BC1" />
            ) : (
              <>
                <View style={styles.paymentRow}>
                  {metodosPago.map((m) => {
                    const isSel = metodoSeleccionado === m.id;
                    const esTarjeta = m.nombre
                      .toLowerCase()
                      .includes("tarjeta");
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.payMethod,
                          isSel && styles.payMethodSelected,
                        ]}
                        onPress={() => setMetodoSeleccionado(m.id)}
                      >
                        <Ionicons
                          name={esTarjeta ? "card" : "cash"}
                          size={26}
                          color={isSel ? "#FFF" : "#886BC1"}
                        />
                        <Text
                          style={[
                            styles.payText,
                            isSel && styles.payTextSelected,
                          ]}
                        >
                          {m.nombre}
                        </Text>
                        {isSel && (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#FFF"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Aviso informativo según el método */}
                {metodoSeleccionado && (
                  <View
                    style={[
                      styles.paymentInfoBox,
                      esTarjetaSeleccionada && styles.paymentInfoBoxCard,
                    ]}
                  >
                    <Ionicons
                      name={
                        esTarjetaSeleccionada
                          ? "information-circle"
                          : "cash-outline"
                      }
                      size={16}
                      color={esTarjetaSeleccionada ? "#886BC1" : "#2E7D32"}
                    />
                    <Text
                      style={[
                        styles.paymentInfoText,
                        esTarjetaSeleccionada && styles.paymentInfoTextCard,
                      ]}
                    >
                      {esTarjetaSeleccionada
                        ? "Al finalizar el servicio se te solicitará los datos de tu tarjeta para completar el pago."
                        : "Al finalizar el servicio, la niñera confirmará que recibió el pago en efectivo."}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Calendario */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitlePlain}>Selecciona el día</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollContainer}
            >
              {calendarDays.map((item) => {
                const isSel = item.fechaFull === selectedDate;
                return (
                  <TouchableOpacity
                    key={item.fechaFull}
                    style={[
                      styles.dayButton,
                      isSel && styles.dayButtonSelected,
                    ]}
                    onPress={() => setSelectedDate(item.fechaFull)}
                  >
                    <Text
                      style={[
                        styles.dayInitialText,
                        isSel && styles.dayButtonTextSelected,
                      ]}
                    >
                      {item.inicial}
                    </Text>
                    <Text
                      style={[
                        styles.dayButtonText,
                        isSel && styles.dayButtonTextSelected,
                      ]}
                    >
                      {item.numero}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Horas */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitlePlain}>Horas disponibles</Text>
            {isLoadingAvailability ? (
              <ActivityIndicator size="large" color="#886BC1" />
            ) : (
              <View style={styles.slotsGrid}>
                {timeSlots.map((slot) => {
                  const currentHour = parseInt(slot.time.split(":")[0]);
                  const startHour = selectedStartTime
                    ? parseInt(selectedStartTime.split(":")[0])
                    : null;
                  const endHour = selectedEndTime
                    ? parseInt(selectedEndTime.split(":")[0])
                    : null;

                  let isSelected = false;

                  if (startHour !== null && endHour !== null) {
                    const min = Math.min(startHour, endHour);
                    const max = Math.max(startHour, endHour);
                    isSelected = currentHour >= min && currentHour <= max;
                  } else if (startHour !== null) {
                    isSelected = currentHour === startHour;
                  }

                  return (
                    <TouchableOpacity
                      key={slot.time}
                      disabled={slot.status !== "available"}
                      onPress={() => handleSelectSlot(slot.time)}
                      style={[
                        styles.slotButton,
                        isSelected && styles.slotSelected,
                        slot.status !== "available" && styles.slotDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          isSelected && styles.slotTextSelected,
                        ]}
                      >
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <Text style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
                  Puedes seleccionar una sola hora o un rango. Si eliges solo
                  una, se reservará 1 hora.
                </Text>
              </View>
            )}
          </View>

          {/* Resumen de Pago */}
          {duration > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen de Pago</Text>
              <View style={styles.summaryRow}>
                <Text>Subtotal ({duration}h):</Text>
                <Text>L {pricing.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Comisión Nani (10%):</Text>
                <Text>L {pricing.fee.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total:</Text>
                <Text style={styles.summaryTotalValue}>
                  L {pricing.total.toFixed(2)}
                </Text>
              </View>
              {metodoSeleccionado && (
                <View style={styles.summaryMethodRow}>
                  <Ionicons
                    name={esTarjetaSeleccionada ? "card" : "cash"}
                    size={16}
                    color="#886BC1"
                  />
                  <Text style={styles.summaryMethodText}>
                    Pago con:{" "}
                    {
                      metodosPago.find((m) => m.id === metodoSeleccionado)
                        ?.nombre
                    }
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedStartTime ||
                selectedNinos.length === 0 ||
                !metodoSeleccionado ||
                isConfirming) &&
                styles.btnDisabled,
            ]}
            disabled={
              !selectedStartTime ||
              selectedNinos.length === 0 ||
              !metodoSeleccionado ||
              isConfirming
            }
            onPress={handleConfirmarReserva}
          >
            {isConfirming ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar Reserva</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  container: { flex: 1 },
  header: {
    backgroundColor: "#886BC1",
    padding: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  headerTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  babysitterCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
    elevation: 2,
    overflow: "hidden",
  },
  babysitterImage: { width: 60, height: 60, borderRadius: 30 },
  babysitterName: { fontSize: 18, fontWeight: "700", flexShrink: 1 },
  babysitterRate: { color: "#886BC1", fontWeight: "600" },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitlePlain: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    textAlignVertical: "top",
  },
  daysScrollContainer: { gap: 10, paddingRight: 20 },
  dayButton: {
    width: 55,
    height: 65,
    borderRadius: 15,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonSelected: { backgroundColor: "#FF768A" },
  dayInitialText: { fontSize: 10, color: "#888" },
  dayButtonText: { fontWeight: "700" },
  dayButtonTextSelected: { color: "#FFF" },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  slotButton: {
    width: "31%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#886BC1",
    alignItems: "center",
    marginBottom: 4,
  },
  slotSelected: { backgroundColor: "#FF768A", borderColor: "#FF768A" },
  slotDisabled: { backgroundColor: "#F0F0F0", borderColor: "#DDD" },
  slotText: { color: "#886BC1", fontWeight: "600" },
  slotTextSelected: { color: "#FFF" },
  summaryCard: {
    backgroundColor: "#F6EFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0D1F9",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#886BC1",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryDivider: { height: 1, backgroundColor: "#D1C4E9", marginVertical: 10 },
  summaryTotalLabel: { fontWeight: "700", fontSize: 16 },
  summaryTotalValue: { fontWeight: "800", fontSize: 20, color: "#886BC1" },
  summaryMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0D1F9",
  },
  summaryMethodText: { color: "#886BC1", fontWeight: "600", fontSize: 13 },

  // Método de pago
  paymentSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  paymentRow: { flexDirection: "row", gap: 10, marginTop: 5 },
  payMethod: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#886BC1",
    alignItems: "center",
    gap: 6,
  },
  payMethodSelected: { backgroundColor: "#886BC1" },
  payText: { fontSize: 13, fontWeight: "700", color: "#886BC1" },
  payTextSelected: { color: "#FFF" },
  paymentInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  paymentInfoBoxCard: { backgroundColor: "#F3EEFF" },
  paymentInfoText: { flex: 1, fontSize: 12, color: "#2E7D32", lineHeight: 18 },
  paymentInfoTextCard: { color: "#6A4C9C" },

  bottomBar: {
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  confirmButton: {
    backgroundColor: "#FF768A",
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnDisabled: { backgroundColor: "#CCC" },
  confirmButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  ninosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ninoChip: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#886BC1",
    gap: 6,
  },
  ninoChipSelected: { backgroundColor: "#886BC1" },
  ninoText: { color: "#886BC1", fontWeight: "600" },
  ninoTextSelected: { color: "#FFF" },
});
