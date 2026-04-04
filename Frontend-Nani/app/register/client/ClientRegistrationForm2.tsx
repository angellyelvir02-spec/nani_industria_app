import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ENDPOINTS } from "../../../constants/apiConfig";
//import CustomMap from './CustomMap';
/*const CustomMap = Platform.OS === 'web' 
  ? require('./CustomMap').default 
  : require('./CustomMap.native').default;*/


import CustomMap from "../../../components/CustomMap";

const { width } = Dimensions.get("window");

export default function ClientRegistrationForm2() {
  const router = useRouter();

  // --- ESTADOS DE NAVEGACIÓN ---
  const [step, setStep] = useState(1);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [isAdult, setIsAdult] = useState(false);
  const [issubmitting, setIsSubmitting] = useState(false);
  const [reference, setReference] = useState("");

  // --- ESTADOS DE DATOS ---
  const [errors, setErrors] = useState<any>({});
  const [ninos, setNinos] = useState([{ nombre: "", edad: "", nota: "" }]);

  const INITIAL_REGION = {
    latitude: 14.0818,
    longitude: -87.2068,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const [region, setRegion] = useState(INITIAL_REGION);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // SOLUCIÓN PUNTO #1: Iniciamos con la fecha de hoy
  const [pickerDate, setPickerDate] = useState(new Date());

  const [formData, setFormData] = useState({
    phone: "",
    birthDate: "",
    addressSearch: "",
    profilePhoto: null as any,
    dniFront: null as any,
    dniBack: null as any,
  });

  const isLocationSelected =
    region.latitude.toFixed(4) !== INITIAL_REGION.latitude.toFixed(4) ||
    region.longitude.toFixed(4) !== INITIAL_REGION.longitude.toFixed(4);

  // --- EFECTOS ---
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso denegado", "Nani necesita acceso al GPS.");
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
        console.log("Error obteniendo GPS");
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  // --- LÓGICA DE NEGOCIO ---
  const validateField = (field: string, value: string) => {
    let error = null;
    if (field === "phone") {
      const phoneRegex = /^\+504\d{4}-?\d{4}$/;
      if (!value.trim()) error = "Ingresa tu número de teléfono.";
      else if (!phoneRegex.test(value.trim())) error = "Formato: +504XXXX-XXXX";
    }
    if (field === "reference" && !value.trim()) error = "Danos una referencia.";
    setErrors((prev: any) => ({ ...prev, [field]: error }));
  };

  const calculateAge = (date: Date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
    return age;
  };

  // SOLUCIÓN PUNTO #2: Función que actualiza el picker y valida
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event.type === "set" && selectedDate) {
      setPickerDate(selectedDate); // Para que la próxima vez abra donde elegimos

      const age = calculateAge(selectedDate);

      if (age < 18) {
        setIsAdult(false);
        Alert.alert(
          "Edad mínima",
          "Debes ser mayor de 18 años para usar Nani.",
        );
        setFormData((prev: any) => ({ ...prev, birthDate: "" }));
      } else {
        setIsAdult(true);
        setFormData((prev: any) => ({
          ...prev,
          birthDate: selectedDate.toISOString().split("T")[0],
        }));
      }
    }
  };

  // SOLUCIÓN PUNTO #3: El componente visual con maximumDate
 const memoizedDatePicker = useMemo(() => {
  if (!showDatePicker) return null;

  // --- SOLUCIÓN PARA WEB (Input nativo de HTML5) ---
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webPickerContainer}>
        <input
          type="date"
          style={styles.webDateInput}
          max={new Date().toISOString().split("T")[0]} // Bloquea fechas futuras
          onChange={(e) => {
            const date = new Date(e.target.value);
            // Agregamos un pequeño fix de zona horaria para que no se reste un día
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
            handleDateChange({ type: "set" }, date);
          }}
        />
        <TouchableOpacity 
          style={styles.closeWebPicker} 
          onPress={() => setShowDatePicker(false)}
        >
          <Text style={{color: '#886BC1', fontWeight: 'bold'}}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- SOLUCIÓN PARA MÓVIL (Componente Nativo) ---
  return (
    <DateTimePicker
      value={pickerDate}
      mode="date"
      display="default"
      maximumDate={new Date()}
      onChange={handleDateChange}
    />
  );
}, [showDatePicker, pickerDate]);

 const searchLocation = async () => {
  if (!formData.addressSearch.trim()) return;

  try {
    if (Platform.OS === 'web') {
      // --- SOLUCIÓN PARA WEB (Nominatim) ---
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.addressSearch
        )}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        setRegion({
          ...region,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        });
      } else {
        Alert.alert("No encontrado", "Prueba especificando: Colonia, Ciudad, Honduras");
      }
    } else {
      // --- SOLUCIÓN PARA MÓVIL (Sigue usando Expo Location) ---
      let result = await Location.geocodeAsync(formData.addressSearch);
      if (result.length > 0) {
        setRegion({
          ...region,
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        });
      }
    }
  } catch (error) {
    console.error("Error en geocoding:", error);
    Alert.alert("Error", "No pudimos conectar con el servicio de mapas.");
  }
};

  const pickImage = async (field: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
    });
    if (!result.canceled)
      setFormData({ ...formData, [field]: result.assets[0] });
  };
const handleFinish = async () => {
  // --- 1. Validaciones Iniciales ---
  if (!formData.birthDate || !isAdult) {
    Alert.alert("Error", "Debes ser mayor de edad.");
    return;
  }
  if (!reference.trim()) {
    setErrors((prev: any) => ({ ...prev, reference: "Falta referencia" }));
    return;
  }
  if (!formData.profilePhoto || !formData.dniFront || !formData.dniBack) {
    Alert.alert("Fotos", "Sube todos los documentos.");
    return;
  }

  setIsSubmitting(true);

  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      Alert.alert("Error de sesión", "Inicia sesión de nuevo.");
      setIsSubmitting(false);
      return;
    }

    const uploadData = new FormData();

    // --- 2. FUNCIÓN PARA PROCESAR IMÁGENES (WEB vs MÓVIL) ---
    const processAndAppendImage = async (key: string, asset: any, fileName: string) => {
      if (!asset) return;

      if (Platform.OS === 'web') {
        // En Web, convertimos la URI del blob en un archivo real (File/Blob)
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        uploadData.append(key, blob, fileName);
      } else {
        // En móvil usamos el formato de objeto nativo
        uploadData.append(key, {
          uri: asset.uri,
          type: "image/jpeg",
          name: fileName,
        } as any);
      }
    };

    // --- 3. Ejecutar el procesamiento de las 3 imágenes ---
    await processAndAppendImage("foto_url", formData.profilePhoto, "perfil.jpg");
    await processAndAppendImage("DNI_frontal_url", formData.dniFront, "dni_f.jpg");
    await processAndAppendImage("DNI_reverso_url", formData.dniBack, "dni_r.jpg");

    // --- 4. Agregar el resto de campos de Nani ---
    uploadData.append("telefono", formData.phone);
    uploadData.append("fecha_nacimiento", formData.birthDate);
    uploadData.append("direccion", formData.addressSearch || "Ubicación en mapa");
    uploadData.append("punto_referencia", reference);
    uploadData.append("ubicacion", `${region.latitude},${region.longitude}`);
    uploadData.append("ninos", JSON.stringify(ninos));

    console.log("Enviando datos procesados a:", ENDPOINTS.complete_perfil_cliente);

    // --- 5. Petición al Servidor ---
    const response = await fetch(ENDPOINTS.complete_perfil_cliente, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // RECUERDA: No pongas 'Content-Type' manualmente aquí
      },
      body: uploadData,
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { message: responseText };
    }

    if (response.ok) {
      console.log("✅ Registro exitoso en DB:", responseData);
      Alert.alert("¡Éxito!", "Perfil de Nani completado con éxito.", [
        { text: "Entrar", onPress: () => router.replace("/register/client/home") },
      ]);
      
      // Fix extra para navegación en Web
      if (Platform.OS === 'web') {
        setTimeout(() => router.replace("/register/client/home"), 1000);
      }
    } else {
      console.error("❌ Error del servidor:", response.status, responseData);
      Alert.alert("Error", responseData.message || "No se pudo completar el perfil.");
    }

  } catch (error: any) {
    console.error("❌ Error en la petición:", error);
    Alert.alert("Error de Conexión", "Verifica tu internet o el estado del servidor.");
  } finally {
    setIsSubmitting(false);
  }
};
  const ProgressBar = () => (
    <View style={styles.progressWrapper}>
      <View style={styles.progressBackground}>
        <View
          style={[styles.progressFill, { width: step === 1 ? "50%" : "100%" }]}
        />
      </View>
      <View style={styles.progressTextRow}>
        <Text
          style={[styles.progressStepText, step === 1 && styles.activeStepText]}
        >
          1. Ubicación
        </Text>
        <Text
          style={[styles.progressStepText, step === 2 && styles.activeStepText]}
        >
          2. Información
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      <ProgressBar />

      {step === 1 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Marca tu casa en el mapa</Text>
          <View style={styles.searchBar}>
            <TextInput
              placeholder="Buscar colonia o calle..."
              style={styles.searchInput}
              value={formData.addressSearch}
              onChangeText={(v) =>
                setFormData({ ...formData, addressSearch: v })
              }
              onSubmitEditing={searchLocation}
            />
            <TouchableOpacity
              onPress={searchLocation}
              style={styles.searchIcon}
            >
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
              <CustomMap
                style={styles.map}
                region={region}
                onRegionChangeComplete={(r:any) => setRegion(r)}
                showsUserLocation={true}
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
            Mueve el mapa hasta que el pin apunte a tu hogar.
          </Text>

          <TouchableOpacity
            style={[
              styles.mainBtn,
              !isLocationSelected && { backgroundColor: "#D1D5DB" },
              { marginTop: 25 },
            ]}
            onPress={() =>
              isLocationSelected
                ? setStep(2)
                : Alert.alert(
                    "Aviso",
                    "Mueve el mapa para marcar tu ubicación.",
                  )
            }
          >
            <Text style={styles.mainBtnText}>Confirmar Ubicación</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Detalles de domicilio</Text>
            <Text style={styles.label}>
              Referencia (Ej: Casa de esquina portón verde)
            </Text>
            <View
              style={[
                styles.inputContainer,
                errors.reference && styles.inputError,
              ]}
            >
              <Ionicons name="map-outline" size={18} color="#886BC1" />
              <TextInput
                placeholder="Indica señas de tu casa..."
                style={styles.input}
                value={reference}
                onChangeText={(v) => {
                  setReference(v);
                  setErrors({ ...errors, reference: null });
                }}
                onBlur={() => validateField("reference", reference)}
              />
            </View>
            {errors.reference && (
              <Text style={styles.errorText}>{errors.reference}</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datos Personales</Text>
            <Text style={styles.label}>Fecha de Nacimiento</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#886BC1" />
              <Text style={styles.dateText}>
                {formData.birthDate || "Seleccionar fecha"}
              </Text>
            </TouchableOpacity>
            {memoizedDatePicker}

            <Text style={[styles.label, { marginTop: 15 }]}>
              Teléfono (+504)
            </Text>
            <View
              style={[styles.inputContainer, errors.phone && styles.inputError]}
            >
              <Ionicons name="call-outline" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="+504 9988-7766"
                style={styles.input}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(v) => setFormData({ ...formData, phone: v })}
                onBlur={() => validateField("phone", formData.phone)}
              />
            </View>
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tus Niños</Text>
            {ninos.map((nino, index) => (
              <View key={index} style={styles.ninoItem}>
                <View style={styles.row}>
                  <Text style={styles.ninoSubtitle}>Niño #{index + 1}</Text>
                  {ninos.length > 1 && (
                    <TouchableOpacity
                      onPress={() => {
                        const newNinos = [...ninos];
                        newNinos.splice(index, 1);
                        setNinos(newNinos);
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  placeholder="Nombre"
                  style={[styles.inputContainer, { marginBottom: 8 }]}
                  value={nino.nombre}
                  onChangeText={(v) => {
                    const n = [...ninos];
                    n[index].nombre = v;
                    setNinos(n);
                  }}
                />
                <View style={styles.row}>
                  <TextInput
                    placeholder="Edad"
                    style={[
                      styles.inputContainer,
                      { flex: 0.3, marginRight: 8 },
                    ]}
                    keyboardType="numeric"
                    value={nino.edad}
                    onChangeText={(v) => {
                      const n = [...ninos];
                      n[index].edad = v;
                      setNinos(n);
                    }}
                  />
                  <TextInput
                    placeholder="Notas/Alergias"
                    style={[styles.inputContainer, { flex: 1 }]}
                    value={nino.nota}
                    onChangeText={(v) => {
                      const n = [...ninos];
                      n[index].nota = v;
                      setNinos(n);
                    }}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addNinoBtn}
              onPress={() =>
                setNinos([...ninos, { nombre: "", edad: "", nota: "" }])
              }
            >
              <Ionicons name="add-circle-outline" size={20} color="#886BC1" />
              <Text style={styles.addNinoText}>Agregar otro niño</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Documentación</Text>
            <TouchableOpacity
              style={styles.photoBtn}
              onPress={() => pickImage("profilePhoto")}
            >
              <Text>
                {formData.profilePhoto
                  ? "✅ Perfil Listo"
                  : "📸 Foto de Perfil"}
              </Text>
            </TouchableOpacity>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.photoBtn, { flex: 1, marginRight: 5 }]}
                onPress={() => pickImage("dniFront")}
              >
                <Text style={styles.smallText}>
                  {formData.dniFront ? "✅ Frontal" : "DNI Frontal"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoBtn, { flex: 1, marginLeft: 5 }]}
                onPress={() => pickImage("dniBack")}
              >
                <Text style={styles.smallText}>
                  {formData.dniBack ? "✅ Reverso" : "DNI Reverso"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Ionicons name="arrow-back" size={20} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mainBtn,
                { flex: 1 },
                (!isAdult || issubmitting) && { backgroundColor: "#D1D5DB" },
              ]}
              disabled={!isAdult || issubmitting}
              onPress={handleFinish}
            >
              {issubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.mainBtnText}>Finalizar Registro</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 20 },
  progressWrapper: { marginBottom: 25, marginTop: 10 },
  progressBackground: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#886BC1" },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressStepText: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  activeStepText: { color: "#886BC1" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 15,
    color: "#2E2E2E",
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
    height: 250,
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
  hint: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  label: { fontSize: 13, color: "#6B7280", marginBottom: 6, fontWeight: "500" },
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
    marginBottom: 4,
  },
  input: { flex: 1, color: "#374151" },
  photoBtn: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#F9FAFB",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  backBtn: {
    backgroundColor: "#E5E7EB",
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  mainBtn: {
    backgroundColor: "#FF768A",
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  smallText: { fontSize: 12, color: "#4B5563" },
  ninoItem: {
    marginBottom: 15,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 12,
  },
  ninoSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#886BC1",
    marginBottom: 8,
  },
  addNinoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  addNinoText: { color: "#886BC1", fontWeight: "bold" },
  errorText: { color: "#EF4444", fontSize: 11, marginBottom: 8, marginLeft: 4 },
  inputError: { borderColor: "#EF4444", borderWidth: 1 },
  webPickerContainer: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#886BC1',
  },
  webDateInput: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    // --- CAMBIO AQUÍ: Separamos el border de CSS ---
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
    // -----------------------------------------------
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  closeWebPicker: {
    marginTop: 10,
    padding: 5,
  }
});
