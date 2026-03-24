import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { ENDPOINTS } from "../../../constants/apiConfig";

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

  // ESTADOS
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("en-CA"),
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(
    null,
  );
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [selectedNinos, setSelectedNinos] = useState<string[]>([]);
  const [isLoadingNinos, setIsLoadingNinos] = useState(true);
  const [notas, setNotas] = useState("");

  // ESTADOS PAGO
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string | null>(
    null,
  );
  const [isConfirming, setIsConfirming] = useState(false);

  const babysitter = {
    name: name ? String(name) : "Cargando...",
    photo: photo ? String(photo) : "https://via.placeholder.com/150",
    hourlyRate: hourlyRate ? parseFloat(String(hourlyRate)) : 0,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");

        const resNinos = await fetch(ENDPOINTS.get_mis_ninos, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataNinos = await resNinos.json();
        setNinos(dataNinos || []);

        const resMetodos = await fetch(ENDPOINTS.get_metodo_pago, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataMetodos = await resMetodos.json();
        setMetodosPago(dataMetodos || []);
        if (dataMetodos.length > 0) setMetodoSeleccionado(dataMetodos[0].id);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setIsLoadingNinos(false);
      }
    };
    fetchData();
  }, []);

  const calendarDays = useMemo(() => {
    const days = [];
    const formatterFull = new Intl.DateTimeFormat("es-ES", { weekday: "long" });
    const formatterInicial = new Intl.DateTimeFormat("es-ES", {
      weekday: "narrow",
    });
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      const nombreDiaRaw = formatterFull.format(d);
      days.push({
        numero: d.getDate(),
        inicial: formatterInicial.format(d).toUpperCase(),
        nombreDia: nombreDiaRaw.charAt(0).toUpperCase() + nombreDiaRaw.slice(1),
        fechaFull: d.toLocaleDateString("en-CA"),
      });
    }
    return days;
  }, []);

  const fetchAvailability = async (fecha: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(ENDPOINTS.get_disponibilidad(id, fecha));
      const data = await response.json();
      setTimeSlots(data || []);
    } catch (error) {
      Alert.alert("Error", "No se pudo obtener disponibilidad.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [selectedDate]);

  const handleSelectSlot = (time: string) => {
    if (!selectedStartTime || (selectedStartTime && selectedEndTime)) {
      setSelectedStartTime(time);
      setSelectedEndTime(null);
    } else {
      if (time <= selectedStartTime) {
        setSelectedStartTime(time);
        return;
      }
      setSelectedEndTime(time);
    }
  };

  const duration = useMemo(() => {
    if (!selectedStartTime || !selectedEndTime) return 0;
    const start = parseInt(selectedStartTime.split(":")[0]);
    const end = parseInt(selectedEndTime.split(":")[0]);
    return end - start;
  }, [selectedStartTime, selectedEndTime]);

  const { subtotal, fee, total } = useMemo(() => {
    const sub = babysitter.hourlyRate * duration;
    const f = sub * 0.1;
    return { subtotal: sub, fee: f, total: sub + f };
  }, [duration, babysitter.hourlyRate]);

  const handleConfirmarReserva = async () => {
    if (!metodoSeleccionado) {
      return Alert.alert("Error", "Selecciona un método de pago.");
    }

    setIsConfirming(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const body = {
        ninera_id: id,
        metodo_pago_id: metodoSeleccionado,
        fecha_servicio: selectedDate,
        hora_inicio: selectedStartTime,
        hora_fin: selectedEndTime,
        notas_importantes: notas,
        ninos_ids: selectedNinos,
        monto_base: subtotal,
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

      if (response.ok) {
        const metodoNombre = metodosPago
          .find((m) => m.id === metodoSeleccionado)
          ?.nombre.toLowerCase();

        // 1. Caso Pago con Tarjeta (PixelPay)
        if (metodoNombre?.includes("tarjeta")) {
          if (result.pixelPayUrl) {
            router.push({
              pathname: "/register/client/WebView",
              params: { url: result.pixelPayUrl, reservaId: result.reservaId },
            });
          } else {
            Alert.alert("Aviso", "Reserva creada, procediendo a pago.", [
              {
                text: "Continuar",
                onPress: () =>
                  router.replace({
                    pathname: "/register/client/BabysitterProfile",
                    params: { babysitterId: id }, // Enviamos el ID para evitar el loading infinito
                  }),
              },
            ]);
          }
        }
        // 2. Caso Efectivo u otros métodos
        else {
          Alert.alert("¡Éxito!", "Reserva creada correctamente.", [
            {
              text: "OK",
              onPress: () =>
                router.replace({
                  pathname: "/register/client/BabysitterProfile",
                  params: { babysitterId: id }, // Enviamos el ID para que el perfil cargue
                }),
            },
          ]);
        }
      } else {
        throw new Error(result.message || "Error al procesar la reserva");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
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
          <View style={styles.babysitterCard}>
            <Image
              source={{ uri: babysitter.photo }}
              style={styles.babysitterImage}
            />
            <View>
              <Text style={styles.babysitterName}>{babysitter.name}</Text>
              <Text style={styles.babysitterRate}>
                L {babysitter.hourlyRate.toFixed(2)}/hora
              </Text>
            </View>
          </View>

          {/* Selección Niños */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitlePlain}>¿A quién cuidaremos?</Text>
            {isLoadingNinos ? (
              <ActivityIndicator color="#886BC1" />
            ) : (
              <View style={styles.ninosGrid}>
                {ninos.map((nino) => (
                  <TouchableOpacity
                    key={nino.id}
                    style={[
                      styles.ninoChip,
                      selectedNinos.includes(nino.id) &&
                        styles.ninoChipSelected,
                    ]}
                    onPress={() =>
                      setSelectedNinos((prev) =>
                        prev.includes(nino.id)
                          ? prev.filter((i) => i !== nino.id)
                          : [...prev, nino.id],
                      )
                    }
                  >
                    <Ionicons
                      name={
                        selectedNinos.includes(nino.id)
                          ? "checkbox"
                          : "square-outline"
                      }
                      size={18}
                      color={
                        selectedNinos.includes(nino.id) ? "#FFF" : "#886BC1"
                      }
                    />
                    <Text
                      style={[
                        styles.ninoText,
                        selectedNinos.includes(nino.id) &&
                          styles.ninoTextSelected,
                      ]}
                    >
                      {nino.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Campo de Notas */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitlePlain}>Notas Importantes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Ej: Alergias, instrucciones de la casa..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={notas}
              onChangeText={setNotas}
            />
          </View>

          {/* Calendario */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitlePlain}>Selecciona el día</Text>
            <View style={styles.daysRow}>
              {calendarDays.map((item) => (
                <TouchableOpacity
                  key={item.fechaFull}
                  style={[
                    styles.dayButton,
                    item.fechaFull === selectedDate && styles.dayButtonSelected,
                  ]}
                  onPress={() => setSelectedDate(item.fechaFull)}
                >
                  <Text
                    style={[
                      styles.dayInitialText,
                      item.fechaFull === selectedDate &&
                        styles.dayButtonTextSelected,
                    ]}
                  >
                    {item.inicial}
                  </Text>
                  <Text
                    style={[
                      styles.dayButtonText,
                      item.fechaFull === selectedDate &&
                        styles.dayButtonTextSelected,
                    ]}
                  >
                    {item.numero}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Horas */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitlePlain}>Horas disponibles</Text>
            {isLoading ? (
              <ActivityIndicator size="large" color="#886BC1" />
            ) : (
              <View style={styles.slotsGrid}>
                {timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.time}
                    disabled={slot.status !== "available"}
                    onPress={() => handleSelectSlot(slot.time)}
                    style={[
                      styles.slotButton,
                      (slot.time === selectedStartTime ||
                        slot.time === selectedEndTime ||
                        (selectedStartTime &&
                          selectedEndTime &&
                          slot.time > selectedStartTime &&
                          slot.time < selectedEndTime)) &&
                        styles.slotSelected,
                      slot.status !== "available" && styles.slotDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        (slot.time === selectedStartTime ||
                          slot.time === selectedEndTime) &&
                          styles.slotTextSelected,
                      ]}
                    >
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* SECCIÓN DINÁMICA: RESUMEN Y PAGO (Solo si hay horas seleccionadas) */}
          {duration > 0 && (
            <>
              <View style={styles.summaryCard}>
                <Text style={[styles.sectionTitlePlain, { color: "#886BC1" }]}>
                  Resumen de Pago
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Subtotal ({duration}h):
                  </Text>
                  <Text style={styles.summaryValue}>
                    L {subtotal.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Comisión Nani (10%):</Text>
                  <Text style={styles.summaryValue}>L {fee.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryTotalLabel}>Total a Pagar:</Text>
                  <Text style={styles.summaryTotalValue}>
                    L {total.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitlePlain}>
                  Selecciona Método de Pago
                </Text>
                <View style={styles.paymentRow}>
                  {metodosPago.map((metodo) => (
                    <TouchableOpacity
                      key={metodo.id}
                      style={[
                        styles.payMethod,
                        metodoSeleccionado === metodo.id &&
                          styles.payMethodSelected,
                      ]}
                      onPress={() => setMetodoSeleccionado(metodo.id)}
                    >
                      <Ionicons
                        name={
                          metodo.nombre.toLowerCase().includes("tarjeta")
                            ? "card"
                            : "cash"
                        }
                        size={24}
                        color={
                          metodoSeleccionado === metodo.id ? "#FFF" : "#886BC1"
                        }
                      />
                      <Text
                        style={[
                          styles.payText,
                          metodoSeleccionado === metodo.id &&
                            styles.payTextSelected,
                        ]}
                      >
                        {metodo.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (duration === 0 ||
                selectedNinos.length === 0 ||
                isConfirming) && { backgroundColor: "#CCC" },
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

const styles = StyleSheet.create({
  // ... (Tus estilos anteriores se mantienen)
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
    marginTop: 20,
  },
  headerTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  babysitterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  babysitterImage: { width: 64, height: 64, borderRadius: 32 },
  babysitterName: { fontSize: 18, fontWeight: "700", color: "#2E2E2E" },
  babysitterRate: { color: "#886BC1", fontSize: 16, fontWeight: "600" },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitlePlain: {
    color: "#2E2E2E",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
    color: "#333",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  daysRow: { flexDirection: "row", justifyContent: "space-between" },
  dayButton: {
    width: "13%",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  dayButtonSelected: { backgroundColor: "#FF768A" },
  dayInitialText: { fontSize: 10, color: "#888" },
  dayButtonText: { color: "#2E2E2E", fontWeight: "700" },
  dayButtonTextSelected: { color: "#FFFFFF" },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  slotButton: {
    width: "30%",
    padding: 12,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#886BC1",
    alignItems: "center",
  },
  slotSelected: { backgroundColor: "#FF768A", borderColor: "#FF768A" },
  slotDisabled: { backgroundColor: "#F9F9F9", borderColor: "#EEE" },
  slotText: { color: "#886BC1", fontWeight: "700" },
  slotTextSelected: { color: "#FFFFFF" },
  paymentRow: { flexDirection: "row", gap: 12 },
  payMethod: {
    flex: 1,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#886BC1",
    alignItems: "center",
    gap: 8,
  },
  payMethodSelected: { backgroundColor: "#886BC1" },
  payText: { fontWeight: "700", color: "#886BC1" },
  payTextSelected: { color: "#FFF" },
  summaryCard: {
    backgroundColor: "#F6EFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0D1F9",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: { color: "#555", fontSize: 14 },
  summaryValue: { fontWeight: "600", color: "#333" },
  summaryDivider: { height: 1, backgroundColor: "#D1C4E9", marginVertical: 10 },
  summaryTotalLabel: { fontWeight: "700", color: "#886BC1", fontSize: 16 },
  summaryTotalValue: { fontWeight: "800", fontSize: 22, color: "#886BC1" },
  bottomBar: { padding: 16, backgroundColor: "#FFF" },
  confirmButton: {
    backgroundColor: "#FF768A",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  ninosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  ninoChip: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#886BC1",
    gap: 5,
  },
  ninoChipSelected: { backgroundColor: "#886BC1" },
  ninoText: { color: "#886BC1" },
  ninoTextSelected: { color: "#FFF" },
});
