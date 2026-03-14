import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AvailabilitySlot {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface Props {
  onBack: () => void;
  onSave?: () => void;
}

export default function BabysitterAvailabilityEditor({
  onBack,
  onSave,
}: Props) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    {
      id: 1,
      day: "Lunes",
      startTime: "08:00",
      endTime: "18:00",
      enabled: true,
    },
    {
      id: 2,
      day: "Martes",
      startTime: "08:00",
      endTime: "18:00",
      enabled: true,
    },
    {
      id: 3,
      day: "Miércoles",
      startTime: "08:00",
      endTime: "18:00",
      enabled: true,
    },
    {
      id: 4,
      day: "Jueves",
      startTime: "08:00",
      endTime: "18:00",
      enabled: true,
    },
    {
      id: 5,
      day: "Viernes",
      startTime: "08:00",
      endTime: "18:00",
      enabled: true,
    },
    {
      id: 6,
      day: "Sábado",
      startTime: "09:00",
      endTime: "14:00",
      enabled: true,
    },
    {
      id: 7,
      day: "Domingo",
      startTime: "09:00",
      endTime: "14:00",
      enabled: false,
    },
  ]);

  const toggleDay = (id: number) => {
    setAvailability(
      availability.map((slot) =>
        slot.id === id ? { ...slot, enabled: !slot.enabled } : slot,
      ),
    );
  };

  const updateTime = (
    id: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setAvailability(
      availability.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot,
      ),
    );
  };

  const handleSave = () => {
    onSave?.();
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                // Si hay historial, regresa, si no, va a la pantalla Home
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push("./BabysitterOwnProfile"); // Cambia "/Home" por la ruta a la que quieras ir
                }
              }}
            >
              <ArrowLeft size={20} color="#2E2E2E" />
            </TouchableOpacity>

            <View>
              <Text style={styles.headerTitle}>Editar Disponibilidad</Text>
              <Text style={styles.headerSubtitle}>Configura tus horarios</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* INFO BOX */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Los clientes verán tu disponibilidad al buscar niñeras.
              Actualiza tus horarios regularmente.
            </Text>
          </View>

          {/* WEEK SCHEDULE */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Horarios semanales</Text>

            {availability.map((slot) => (
              <View key={slot.id} style={styles.dayCard}>
                <View style={styles.dayRow}>
                  <View style={styles.dayLeft}>
                    <Switch
                      value={slot.enabled}
                      onValueChange={() => toggleDay(slot.id)}
                      trackColor={{ true: "#FF768A" }}
                    />

                    <Text
                      style={[
                        styles.dayText,
                        !slot.enabled && { color: "#aaa" },
                      ]}
                    >
                      {slot.day}
                    </Text>
                  </View>
                </View>

                {slot.enabled && (
                  <View style={styles.timeRow}>
                    <View style={styles.timeBox}>
                      <Text style={styles.label}>Desde</Text>

                      <TextInput
                        value={slot.startTime}
                        onChangeText={(value) =>
                          updateTime(slot.id, "startTime", value)
                        }
                        style={styles.timeInput}
                      />
                    </View>

                    <View style={styles.timeBox}>
                      <Text style={styles.label}>Hasta</Text>

                      <TextInput
                        value={slot.endTime}
                        onChangeText={(value) =>
                          updateTime(slot.id, "endTime", value)
                        }
                        style={styles.timeInput}
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* RATE */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tarifa por hora</Text>

            <View style={styles.rateRow}>
              <Text style={styles.dollar}>$</Text>

              <TextInput
                defaultValue="15"
                keyboardType="numeric"
                style={styles.rateInput}
              />

              <Text style={styles.perHour}>/ hora</Text>
            </View>

            <Text style={styles.rateInfo}>
              Esta es la tarifa que verán los clientes al buscar tus servicios
            </Text>
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Guardar cambios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#886BC1",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },

  headerTitle: {
    color: "white",
    fontSize: 20,
  },

  headerSubtitle: {
    color: "white",
    opacity: 0.8,
    fontSize: 13,
  },

  content: {
    padding: 20,
  },

  infoBox: {
    backgroundColor: "#F6D9F1",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },

  infoText: {
    color: "#2E2E2E",
    fontSize: 13,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    marginBottom: 15,
    color: "#2E2E2E",
  },

  dayCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },

  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  dayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  dayText: {
    fontSize: 15,
    marginLeft: 10,
  },

  timeRow: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },

  timeBox: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: "gray",
    marginBottom: 5,
  },

  timeInput: {
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 10,
  },

  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  dollar: {
    fontSize: 24,
    color: "#886BC1",
    marginRight: 5,
  },

  rateInput: {
    flex: 1,
    fontSize: 22,
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 10,
    color: "#886BC1",
  },

  perHour: {
    marginLeft: 10,
    color: "gray",
  },

  rateInfo: {
    fontSize: 12,
    color: "gray",
  },

  saveButton: {
    backgroundColor: "#FF768A",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },

  saveText: {
    color: "white",
    fontSize: 16,
  },
});
