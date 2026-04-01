import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";

import React, { useEffect, useMemo, useState, useCallback } from "react";

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

  // Memoización de datos de la niñera para evitar re-renders innecesarios
  const babysitter = useMemo(
    () => ({
      name: name ? String(name) : "Cargando...",
      photo: photo ? String(photo) : "https://via.placeholder.com/150",
      hourlyRate: hourlyRate ? parseFloat(String(hourlyRate)) : 0,
    }),
    [name, photo, hourlyRate],
  );

  // --- EFECTOS ---

  // Carga inicial de niños y métodos de pago
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
        // Resetear horas al cambiar de día para evitar errores de lógica
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

  // --- LÓGICA DE NEGOCIO ---

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
      // Si selecciona una hora anterior a la de inicio, la convertimos en la nueva hora de inicio
      if (time <= selectedStartTime) {
        setSelectedStartTime(time);
        setSelectedEndTime(null);
        return;
      }
      setSelectedEndTime(time);
    }
  };

  const duration = useMemo(() => {
    if (!selectedStartTime || !selectedEndTime) return 0;
    const start = parseInt(selectedStartTime.split(":")[0]);
    const end = parseInt(selectedEndTime.split(":")[0]);
    return end - start + 1;
  }, [selectedStartTime, selectedEndTime]);

  const pricing = useMemo(() => {
    const subtotal = babysitter.hourlyRate * duration;
    const fee = subtotal * 0.1;
    return { subtotal, fee, total: subtotal + fee };
  }, [duration, babysitter.hourlyRate]);

  const handleConfirmarReserva = async () => {
    // 1. Validaciones iniciales (de ambas)
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

    if (!selectedStartTime || !selectedEndTime) {
      if (Platform.OS === "web") {
        window.alert("Debes elegir inicio y fin.");
      } else {
        Alert.alert("Selección de tiempo", "Debes elegir inicio y fin.");
      }
      return;
    }

    // Validar que no haya huecos ocupados (de tu versión)
    const startIdx = timeSlots.findIndex((s) => s.time === selectedStartTime);
    const endIdx = timeSlots.findIndex((s) => s.time === selectedEndTime);
    const hasConflict = timeSlots
      .slice(startIdx, endIdx + 1)
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

      // Body combinado (con todos los campos necesarios)
      const body = {
        ninera_id: id,
        metodo_pago_id: metodoSeleccionado,
        fecha_servicio: selectedDate,
        hora_inicio: selectedStartTime,
        hora_fin: selectedEndTime,
        duracion_horas: duration, // ← tuyo
        monto_base: pricing.subtotal, // ← tuyo
        monto_comision: pricing.fee, // ← tuyo
        propina: 0, // ← tuyo
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
      console.log("📥 Respuesta completa del servidor:", result);

      if (!response.ok) {
        throw new Error(result.message || "Error en la reserva");
      }

      // --- TU LÓGICA DE PAGO Y REDIRECCIÓN (mejor) ---
      const esTarjeta = metodosPago
        .find((m) => m.id === metodoSeleccionado)
        ?.nombre.toLowerCase()
        .includes("tarjeta");

      if (esTarjeta && result.pixelPayUrl) {
        router.push({
          pathname: "/register/client/WebView",
          params: { url: result.pixelPayUrl, reservaId: result.reservaId },
        });
      } else {
        const ninosDetalle = ninos.filter((n) => selectedNinos.includes(n.id));

        // Mensaje de éxito multiplataforma (de ella)
        const successMsg = "Reserva creada correctamente.";

        if (Platform.OS === "web") {
          window.alert(successMsg);
          router.replace({
            pathname: "/register/client/ReservationSuccess",
            params: {
              reservaId: result.reservaId,
              codigoReserva: result.codigoReserva,
              montoTotal: result.montoTotal || pricing.total,
              nombreNinera: babysitter.name,
              fecha: selectedDate,
              ninos: JSON.stringify(ninosDetalle),
            },
          });
        } else {
          Alert.alert("¡Éxito!", successMsg, [
            {
              text: "OK",
              onPress: () =>
                router.replace({
                  pathname: "/register/client/ReservationSuccess",
                  params: {
                    reservaId: result.reservaId,
                    codigoReserva: result.codigoReserva,
                    montoTotal: result.montoTotal || pricing.total,
                    nombreNinera: babysitter.name,
                    fecha: selectedDate,
                    ninos: JSON.stringify(ninosDetalle),
                  },
                }),
            },
          ]);
        }
      }
    } catch (error: any) {
      console.error("🔥 Error:", error);

      // Manejo de errores multiplataforma (de ella)
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

  // --- RENDER ---
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
            <View>
              <Text style={styles.babysitterName}>{babysitter.name}</Text>
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
                  const isStart = slot.time === selectedStartTime;
                  const isEnd = slot.time === selectedEndTime;
                  const inRange =
                    selectedStartTime &&
                    selectedEndTime &&
                    slot.time > selectedStartTime &&
                    slot.time < selectedEndTime;
                  const isSelected = isStart || isEnd || inRange;

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
              </View>
            )}
          </View>

          {/* Pago */}
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

              <Text style={[styles.sectionTitlePlain, { marginTop: 15 }]}>
                Método de Pago
              </Text>
              <View style={styles.paymentRow}>
                {metodosPago.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.payMethod,
                      metodoSeleccionado === m.id && styles.payMethodSelected,
                    ]}
                    onPress={() => setMetodoSeleccionado(m.id)}
                  >
                    <Ionicons
                      name={
                        m.nombre.toLowerCase().includes("tarjeta")
                          ? "card"
                          : "cash"
                      }
                      size={20}
                      color={metodoSeleccionado === m.id ? "#FFF" : "#886BC1"}
                    />
                    <Text
                      style={[
                        styles.payText,
                        metodoSeleccionado === m.id && styles.payTextSelected,
                      ]}
                    >
                      {m.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (duration === 0 || selectedNinos.length === 0 || isConfirming) &&
                styles.btnDisabled,
            ]}
            disabled={
              duration === 0 || selectedNinos.length === 0 || isConfirming
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
  },
  babysitterImage: { width: 60, height: 60, borderRadius: 30 },
  babysitterName: { fontSize: 18, fontWeight: "700" },
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
  paymentRow: { flexDirection: "row", gap: 10, marginTop: 5 },
  payMethod: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#886BC1",
    alignItems: "center",
    gap: 5,
  },
  payMethodSelected: { backgroundColor: "#886BC1" },
  payText: { fontSize: 12, fontWeight: "700", color: "#886BC1" },
  payTextSelected: { color: "#FFF" },
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
