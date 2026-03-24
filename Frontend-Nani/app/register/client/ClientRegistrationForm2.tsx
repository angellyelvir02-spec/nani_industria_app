import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import MapView from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { ENDPOINTS } from "../../../constants/apiConfig";

export default function ClientRegistrationForm2() {
  const router = useRouter();
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [isAdult, setIsAdult] = useState(false);
  const [issubmitting, setIsSubmitting] = useState(false);
  const [reference, setReference] = useState("");

  // --- NUEVO: ESTADO PARA MANEJAR MÚLTIPLES NIÑOS ---
  const [ninos, setNinos] = useState([{ nombre: "", edad: "", nota: "" }]);

  const INITIAL_REGION = {
    latitude: 14.0818,
    longitude: -87.2068,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const [region, setRegion] = useState(INITIAL_REGION);

  const [formData, setFormData] = useState({
    phone: "",
    birthDate: new Date(2000, 0, 1),
    showDatePicker: false,
    addressSearch: "",
    profilePhoto: null as any,
    dniFront: null as any,
    dniBack: null as any,
  });

  const isLocationSelected =
    region.latitude.toFixed(4) !== INITIAL_REGION.latitude.toFixed(4) ||
    region.longitude.toFixed(4) !== INITIAL_REGION.longitude.toFixed(4);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permiso denegado",
            "Nani necesita acceso al GPS para que las niñeras encuentren tu casa.",
          );
          setLoadingLocation(false);
          return;
        }
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setRegion({
          ...region,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log("Error obteniendo GPS local");
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // --- FUNCIONES PARA GESTIONAR NIÑOS ---
  const addNino = () => {
    setNinos([...ninos, { nombre: "", edad: "", nota: "" }]);
  };

  const removeNino = (index: number) => {
    if (ninos.length > 1) {
      const newNinos = [...ninos];
      newNinos.splice(index, 1);
      setNinos(newNinos);
    } else {
      Alert.alert("Aviso", "Debes registrar al menos un niño.");
    }
  };

  const updateNino = (index: number, field: string, value: string) => {
    const newNinos = [...ninos];
    newNinos[index] = { ...newNinos[index], [field]: value };
    setNinos(newNinos);
  };

  const searchLocation = async () => {
    if (!formData.addressSearch.trim()) return;
    try {
      let result = await Location.geocodeAsync(formData.addressSearch);
      if (result.length > 0) {
        setRegion({
          ...region,
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        });
      } else {
        Alert.alert("No encontrado", "Prueba con un nombre más específico.");
      }
    } catch (error) {
      Alert.alert("Error", "No pudimos buscar la dirección.");
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setFormData((prev) => ({ ...prev, showDatePicker: false }));
    }
    if (event.type === "set" && selectedDate) {
      const today = new Date();
      let age = today.getFullYear() - selectedDate.getFullYear();
      if (age < 18) {
        setIsAdult(false);
        Alert.alert("Edad mínima", "Debes ser mayor de 18 años.");
      } else {
        setIsAdult(true);
        setFormData((prev) => ({ ...prev, birthDate: selectedDate }));
      }
    }
  };

  const pickImage = async (field: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
    });
    if (!result.canceled) {
      setFormData({ ...formData, [field]: result.assets[0] });
    }
  };

  const handleFinish = async () => {
    // Validación de fotos y niños
    if (!formData.profilePhoto || !formData.dniFront || !formData.dniBack) {
      Alert.alert("Faltan fotos", "Sube tu perfil y ambos lados del DNI.");
      return;
    }

    const ninosValidos = ninos.every(
      (n) => n.nombre.trim() !== "" && n.edad.trim() !== "",
    );
    if (!ninosValidos) {
      Alert.alert(
        "Datos incompletos",
        "Completa el nombre y edad de todos los niños.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let nombreDireccionFinal = formData.addressSearch;

      if (!nombreDireccionFinal.trim()) {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: region.latitude,
          longitude: region.longitude,
        });

        if (reverseGeocode.length > 0) {
          const place = reverseGeocode[0];
          const calle =
            place.street && !place.street.includes("+") ? place.street : "";
          const colonia = place.district || place.subregion || "";
          const ciudad = place.city || "";

          nombreDireccionFinal = `${calle} ${colonia}, ${ciudad}`
            .trim()
            .replace(/^,|,$/g, "")
            .replace(/,\s*,/g, ",");
        }
      }

      const token = await AsyncStorage.getItem("userToken");
      const uploadData = new FormData();

      // Archivos
      uploadData.append("foto_url", {
        uri: formData.profilePhoto.uri,
        type: "image/jpeg",
        name: "avatar.jpg",
      } as any);
      uploadData.append("DNI_frontal_url", {
        uri: formData.dniFront.uri,
        type: "image/jpeg",
        name: "dnif.jpg",
      } as any);
      uploadData.append("DNI_reverso_url", {
        uri: formData.dniBack.uri,
        type: "image/jpeg",
        name: "dnir.jpg",
      } as any);

      // Datos base
      uploadData.append("telefono", formData.phone);
      uploadData.append("fecha_nacimiento", formData.birthDate.toISOString());
      uploadData.append(
        "direccion",
        nombreDireccionFinal || "Ubicación en mapa",
      );
      uploadData.append("punto_referencia", reference);
      uploadData.append("ubicacion", `${region.latitude},${region.longitude}`);

      // --- ENVIAR LOS NIÑOS COMO STRING JSON ---
      uploadData.append("ninos", JSON.stringify(ninos));

      const response = await fetch(ENDPOINTS.complete_perfil_cliente, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: uploadData,
      });

      if (response.ok) {
        Alert.alert("¡Éxito!", "Perfil de Nani completado correctamente.", [
          {
            text: "Entrar",
            onPress: () => router.replace("/register/client/home"),
          },
        ]);
      } else {
        const errorRes = await response.json();
        throw new Error(errorRes.message || "Error al guardar perfil.");
      }
    } catch (error: any) {
      Alert.alert("Error de Registro", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      <Text style={styles.title}>Verifica tu identidad</Text>

      {/* UBICACIÓN */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tu Ubicación Exacta</Text>
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Buscar colonia o calle..."
            style={styles.searchInput}
            value={formData.addressSearch}
            onChangeText={(v) => setFormData({ ...formData, addressSearch: v })}
            onSubmitEditing={searchLocation}
          />
          <TouchableOpacity onPress={searchLocation} style={styles.searchIcon}>
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          {loadingLocation ? (
            <ActivityIndicator
              size="large"
              color="#886BC1"
              style={{ marginTop: 70 }}
            />
          ) : (
            <MapView
              style={styles.map}
              region={region}
              onRegionChangeComplete={(r) => setRegion(r)}
              showsUserLocation={true}
              onPanDrag={() => {}} // Para evitar conflictos de scroll
            />
          )}
          {!loadingLocation && (
            <View style={styles.markerFixed} pointerEvents="none">
              <Ionicons name="location" size={40} color="#FF768A" />
              <View style={styles.markerShadow} />
            </View>
          )}
        </View>
        <Text style={styles.hint}>
          Mueve el mapa para que el pin rosa apunte a tu casa.
        </Text>

        <Text style={[styles.label, { marginTop: 20 }]}>
          Señas de tu casa (Referencia)
        </Text>
        <View style={styles.inputContainer}>
          <Ionicons name="map-outline" size={18} color="#886BC1" />
          <TextInput
            placeholder="Ej: Portón negro frente a la escuela"
            style={styles.input}
            value={reference}
            onChangeText={setReference}
          />
        </View>
      </View>

      {/* DATOS PERSONALES */}
      <View style={styles.card}>
        <Text style={styles.label}>Fecha de Nacimiento</Text>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setFormData({ ...formData, showDatePicker: true })}
        >
          <Ionicons name="calendar-outline" size={20} color="#886BC1" />
          <Text style={styles.dateText}>
            {formData.birthDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {formData.showDatePicker && (
          <DateTimePicker
            value={formData.birthDate}
            mode="date"
            display={Platform.OS === "android" ? "calendar" : "spinner"}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        <Text style={[styles.label, { marginTop: 15 }]}>
          Teléfono de contacto
        </Text>
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Ej: 9988-7766"
            style={styles.input}
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(v) => setFormData({ ...formData, phone: v })}
          />
        </View>
      </View>

      {/* --- NUEVA SECCIÓN: DATOS DE LOS NIÑOS --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información de los niños</Text>
        {ninos.map((nino, index) => (
          <View key={index} style={styles.ninoItem}>
            <View style={styles.row}>
              <Text style={styles.ninoSubtitle}>Niño #{index + 1}</Text>
              {ninos.length > 1 && (
                <TouchableOpacity onPress={() => removeNino(index)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.inputContainer, { marginBottom: 8 }]}>
              <TextInput
                placeholder="Nombre del niño"
                style={styles.input}
                value={nino.nombre}
                onChangeText={(v) => updateNino(index, "nombre", v)}
              />
            </View>

            <View style={styles.row}>
              <View
                style={[styles.inputContainer, { flex: 0.4, marginRight: 8 }]}
              >
                <TextInput
                  placeholder="Edad"
                  style={styles.input}
                  keyboardType="numeric"
                  value={nino.edad}
                  onChangeText={(v) => updateNino(index, "edad", v)}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <TextInput
                  placeholder="Alergias o notas especiales"
                  style={styles.input}
                  value={nino.nota}
                  onChangeText={(v) => updateNino(index, "nota", v)}
                />
              </View>
            </View>
            <View style={styles.separator} />
          </View>
        ))}

        <TouchableOpacity style={styles.addNinoBtn} onPress={addNino}>
          <Ionicons name="add-circle-outline" size={20} color="#886BC1" />
          <Text style={styles.addNinoText}>Agregar otro niño</Text>
        </TouchableOpacity>
      </View>

      {/* DOCUMENTACIÓN */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Documentación</Text>
        <TouchableOpacity
          style={styles.photoBtn}
          onPress={() => pickImage("profilePhoto")}
        >
          <Ionicons name="camera-outline" size={24} color="#886BC1" />
          <Text style={styles.photoBtnText}>
            {formData.profilePhoto
              ? "Foto de perfil lista"
              : "Subir foto de perfil"}
          </Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.photoBtn, { flex: 1, marginRight: 5 }]}
            onPress={() => pickImage("dniFront")}
          >
            <Text style={styles.smallText}>
              {formData.dniFront ? " DNI Frontal" : "DNI Frontal"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoBtn, { flex: 1, marginLeft: 5 }]}
            onPress={() => pickImage("dniBack")}
          >
            <Text style={styles.smallText}>
              {formData.dniBack ? " DNI Reverso" : "DNI Reverso"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.mainBtn,
          (!isAdult || issubmitting || !isLocationSelected) && {
            backgroundColor: "#D1D5DB",
          },
        ]}
        disabled={!isAdult || issubmitting || !isLocationSelected}
        onPress={handleFinish}
      >
        {issubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.mainBtnText}>Finalizar Verificación</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginVertical: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
    color: "#4B5563",
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  searchInput: { flex: 1, padding: 12, fontSize: 14 },
  searchIcon: {
    backgroundColor: "#886BC1",
    padding: 12,
    justifyContent: "center",
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  map: { flex: 1 },
  markerFixed: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -44,
    alignItems: "center",
  },
  markerShadow: {
    width: 4,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 2,
    marginTop: -2,
  },
  hint: { fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 8 },
  label: { fontSize: 13, color: "#6B7280", marginBottom: 6 },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  dateText: { fontSize: 15, color: "#374151" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: { flex: 1 },
  photoBtn: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  photoBtnText: { fontSize: 14, color: "#4B5563", marginTop: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainBtn: {
    backgroundColor: "#FF768A",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
    height: 60,
    justifyContent: "center",
  },
  mainBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  smallText: { fontSize: 12, color: "#4B5563" },

  // ESTILOS NUEVOS PARA NIÑOS
  ninoItem: { marginBottom: 15 },
  ninoSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#886BC1",
    marginBottom: 8,
  },
  separator: { height: 1, backgroundColor: "#F3F4F6", marginTop: 15 },
  addNinoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  addNinoText: { color: "#886BC1", fontWeight: "bold" },
});
