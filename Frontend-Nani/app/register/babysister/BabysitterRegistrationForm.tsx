import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker"; // Asegúrate de tener esta librería instalada
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { ENDPOINTS } from '../../../constants/apiConfig';

export default function BabysitterRegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [skillInput, setSkillInput] = useState("");
  const [certificateInput, setCertificateInput] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // --- ESTADO PARA EL CALENDARIO DE TRES SELECTORES ---
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    age: "",
    email: "",
    phone: "",
    location: "",
    password: "",
    confirmPassword: "",
    presentation: "",
    experience: "",
    skills: [] as string[],
    certificates: [] as string[],
    rate: "",
    criminalRecordPhoto: null as any,
    idPhoto: null as any,
    facePhoto: null as any,
  });

  // Generar opciones para los selectores
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { label: "Enero", value: "01" }, { label: "Febrero", value: "02" },
    { label: "Marzo", value: "03" }, { label: "Abril", value: "04" },
    { label: "Mayo", value: "05" }, { label: "Junio", value: "06" },
    { label: "Julio", value: "07" }, { label: "Agosto", value: "08" },
    { label: "Septiembre", value: "09" }, { label: "Octubre", value: "10" },
    { label: "Noviembre", value: "11" }, { label: "Diciembre", value: "12" },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  // Efecto para actualizar birthDate y edad cuando cambian los selectores
  useEffect(() => {
    if (day && month && year) {
      const dateString = `${year}-${month}-${day.padStart(2, '0')}`;
      const birthDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDateObj.getFullYear();
      const m = today.getMonth() - birthDateObj.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        calculatedAge--;
      }

      setFormData(prev => ({
        ...prev,
        birthDate: dateString,
        age: calculatedAge.toString()
      }));
    }
  }, [day, month, year]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateField = (field: string, value: string) => {
    let error = null;

    if (field === "firstName") {
      const nombres = value.trim().split(/\s+/);
      if (nombres.length < 2 || nombres[0] === "") {
        error = "Ingresa tus dos nombres.";
      } else if (!nombres.every(nombre => /^[A-ZÁÉÍÓÚÑ]/.test(nombre))) {
        error = "Cada nombre debe iniciar con mayúscula.";
      }
    }

    if (field === "lastName") {
      const apellidos = value.trim().split(/\s+/);
      if (apellidos.length < 2 || apellidos[0] === "") {
        error = "Ingresa tus dos apellidos.";
      } else if (!apellidos.every(apellido => /^[A-ZÁÉÍÓÚÑ]/.test(apellido))) {
        error = "Cada apellido debe iniciar con mayúscula.";
      }
    }

    if (field === "email") {
      const emailLimpio = value.trim().toLowerCase();
      if (!emailLimpio.endsWith("@gmail.com") && !emailLimpio.endsWith("@icloud.com")) {
        error = "Solo aceptamos correos @gmail.com o @icloud.com.";
      }
    }

    if (field === "phone") {
      const phoneRegex = /^\+504\d{4}-?\d{4}$/;
      if (!value.trim()) {
        error = "Ingresa tu número de teléfono.";
      } else if (!phoneRegex.test(value.trim())) {
        error = "Formato: +504XXXXXXXX o +504XXXX-XXXX";
      }
    }

    if (field === "password") {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;
      if (!passwordRegex.test(value)) {
        error = "Mín. 8 caracteres, 1 mayúscula, 1 número y 1 símbolo.";
      }
    }

    if (field === "confirmPassword") {
      if (value !== formData.password) {
        error = "Las contraseñas no coinciden.";
      }
    }

    setErrors((prev: any) => ({ ...prev, [field]: error }));
  };

  const pickImage = async (field: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setFormData({ ...formData, [field]: result.assets[0] });
    }
  };

  const takeSelfie = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert("Se necesita permiso para usar la cámara");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.7,
    });
    if (!result.canceled) {
      setFormData({ ...formData, facePhoto: result.assets[0] });
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.assets) {
      setFormData({ ...formData, criminalRecordPhoto: result.assets[0] });
    }
  };

  const addSkill = () => {
    if (!skillInput) return;
    setFormData({ ...formData, skills: [...formData.skills, skillInput] });
    setSkillInput("");
  };

  const addCertificate = () => {
    if (!certificateInput) return;
    setFormData({ ...formData, certificates: [...formData.certificates, certificateInput] });
    setCertificateInput("");
  };

  const handleNext = async () => {
    if (step === 1) {
      let isValid = true;
      let newErrors: any = {};

      if (!day || !month || !year) {
        Alert.alert("Fecha incompleta", "Por favor selecciona tu fecha de nacimiento completa.");
        return;
      }

      if (Number(formData.age) < 18) {
        Alert.alert("Edad mínima", "Debes ser mayor de 18 años para registrarte.");
        return;
      }

      // Validaciones de texto...
      const nombres = formData.firstName.trim().split(/\s+/);
      if (nombres.length < 2 || !nombres.every(n => /^[A-ZÁÉÍÓÚÑ]/.test(n))) {
        newErrors.firstName = "Revisa tus nombres.";
        isValid = false;
      }

      const emailLimpio = formData.email.trim().toLowerCase();
      if (!emailLimpio.endsWith("@gmail.com") && !emailLimpio.endsWith("@icloud.com")) {
        newErrors.email = "Correo inválido.";
        isValid = false;
      }

      if (!formData.password || formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden.";
        isValid = false;
      }

      setErrors(newErrors);
      if (!isValid) return;

      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!formData.rate.trim()) {
        Alert.alert("Falta información", "Ingresa tu tarifa por hora.");
        return;
      }
      try {
        setLoading(true);
        const data = new FormData();
        data.append("nombre", formData.firstName);
        data.append("apellido", formData.lastName);
        data.append("correo", formData.email);
        data.append("password", formData.password);
        data.append("telefono", formData.phone);
        data.append("ubicacion", formData.location);
        data.append("fecha_nacimiento", formData.birthDate);
        data.append("presentacion", formData.presentation);
        data.append("experiencia", formData.experience);
        data.append("tarifa", formData.rate);
        data.append("habilidades", formData.skills.join(","));
        data.append("certificaciones", formData.certificates.join(","));

        if (formData.facePhoto) {
          data.append("foto_url", {
            uri: formData.facePhoto.uri,
            type: "image/jpeg",
            name: "foto_perfil.jpg",
          } as any);
        }

        if (formData.idPhoto) {
          data.append("DNI_frontal_url", {
            uri: formData.idPhoto.uri,
            type: "image/jpeg",
            name: "dni_frontal.jpg",
          } as any);
        }

        if (formData.criminalRecordPhoto) {
          data.append("Antecedentes_penales_url", {
            uri: formData.criminalRecordPhoto.uri,
            type: formData.criminalRecordPhoto.mimeType || "application/pdf",
            name: formData.criminalRecordPhoto.name || "antecedentes.pdf",
          } as any);
        }

        const response = await fetch(ENDPOINTS.register, {
          method: "POST",
          body: data,
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          if (Platform.OS === 'web') {
            window.alert("¡Registro Recibido!\nTu perfil está en revisión.");
            router.replace("/login");
          } else {
            Alert.alert("¡Registro Recibido!", "Tu perfil está en revisión.", [
              { text: "Entendido", onPress: () => router.replace("/login") }
            ]);
          }
        }
      } catch (error) {
        Alert.alert("Error", "No se pudo completar el registro.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#886BC1", "#FF768A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Registro de Niñera</Text>
            <Text style={styles.headerSubtitle}>Paso {step} de {totalSteps}</Text>
          </View>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Información Personal</Text>

              <Text style={styles.label}>Nombres</Text>
              <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                <Ionicons name="person-outline" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="Ej: Ana María"
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("firstName", v)}
                />
              </View>

              <Text style={styles.label}>Apellidos</Text>
              <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                <Ionicons name="person-outline" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="Ej: Pérez López"
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("lastName", v)}
                />
              </View>

              {/* --- EL CALENDARIO SOLICITADO --- */}
              <Text style={styles.label}>Fecha de Nacimiento</Text>
              <View style={styles.datePickerRow}>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={day}
                    onValueChange={(itemValue) => setDay(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Día" value="" color="#9CA3AF" />
                    {days.map((d) => (
                      <Picker.Item key={d} label={d} value={d} />
                    ))}
                  </Picker>
                </View>

                <View style={[styles.pickerWrapper, { flex: 1.5 }]}>
                  <Picker
                    selectedValue={month}
                    onValueChange={(itemValue) => setMonth(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Mes" value="" color="#9CA3AF" />
                    {months.map((m) => (
                      <Picker.Item key={m.value} label={m.label} value={m.value} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={year}
                    onValueChange={(itemValue) => setYear(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Año" value="" color="#9CA3AF" />
                    {years.map((y) => (
                      <Picker.Item key={y} label={y} value={y} />
                    ))}
                  </Picker>
                </View>
              </View>

              <Text style={styles.label}>Edad: {formData.age ? `${formData.age} años` : "---"}</Text>

              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="tu@gmail.com"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(v) => handleInputChange("email", v)}
                />
              </View>

              <Text style={styles.label}>Teléfono</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="+504 9988-7766"
                  style={styles.input}
                  keyboardType="phone-pad"
                  onChangeText={(v) => handleInputChange("phone", v)}
                />
              </View>

              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("password", v)}
                />
              </View>

              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="Repite tu contraseña"
                  secureTextEntry
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("confirmPassword", v)}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Verificación</Text>
              <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
                <Ionicons name="document-outline" size={26} color="#999" />
                <Text style={styles.uploadText}>{formData.criminalRecordPhoto ? "Documento cargado" : "Antecedentes Penales"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage("idPhoto")}>
                <Ionicons name="image-outline" size={26} color="#999" />
                <Text style={styles.uploadText}>{formData.idPhoto ? "ID cargado" : "Foto de Identidad"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBox} onPress={takeSelfie}>
                <Ionicons name="camera-outline" size={26} color="#999" />
                <Text style={styles.uploadText}>{formData.facePhoto ? "Selfie cargada" : "Tomar Selfie"}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Pasos 2 y 3 se mantienen igual... */}
        {step === 2 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Presentación y Experiencia</Text>
              <TextInput
                placeholder="Cuéntanos sobre ti..."
                multiline
                style={styles.textArea}
                onChangeText={(v) => handleInputChange("presentation", v)}
              />
              <Text style={styles.label}>Experiencia</Text>
              <TextInput
                placeholder="Describe tu trayectoria..."
                multiline
                style={styles.textArea}
                onChangeText={(v) => handleInputChange("experience", v)}
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Habilidades</Text>
              <View style={styles.row}>
                <TextInput
                  placeholder="Ej: RCP"
                  style={styles.input}
                  value={skillInput}
                  onChangeText={setSkillInput}
                />
                <TouchableOpacity style={styles.addBtn} onPress={addSkill}>
                  <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={{flexDirection:'row', flexWrap:'wrap'}}>
                {formData.skills.map((s, i) => <Text key={i} style={styles.tag}>{s}</Text>)}
              </View>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Certificados y Tarifa</Text>
              <View style={styles.row}>
                <TextInput
                  placeholder="Ej: Certificado Niñera"
                  style={styles.input}
                  value={certificateInput}
                  onChangeText={setCertificateInput}
                />
                <TouchableOpacity style={styles.addBtn} onPress={addCertificate}>
                  <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tarifa por hora</Text>
              <TextInput
                placeholder="LPS"
                keyboardType="numeric"
                style={styles.input}
                onChangeText={(v) => handleInputChange("rate", v)}
              />
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[styles.mainBtn, loading && { opacity: 0.7 }]} 
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : (
            <Text style={styles.mainBtnText}>{step === totalSteps ? "Finalizar" : "Siguiente"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  backBtn: { width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: "white", fontWeight: "bold", fontSize: 18 },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  progressBg: { height: 6, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 10, marginTop: 20 },
  progressFill: { height: 6, backgroundColor: "white", borderRadius: 10 },
  content: { padding: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 24, padding: 20, marginBottom: 20 },
  cardTitle: { fontWeight: "bold", marginBottom: 15, fontSize: 15, color: "#2E2E2E" },
  label: { fontSize: 13, color: "#6B7280", marginTop: 10, marginBottom: 6 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 15, paddingHorizontal: 12, paddingVertical: 14, gap: 8 },
  input: { flex: 1, fontSize: 14, color: "#111827" },
  datePickerRow: { flexDirection: "row", gap: 10, marginTop: 5 },
  pickerWrapper: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 15, height: 55, justifyContent: "center", overflow: "hidden" },
  picker: { width: "100%", height: "100%" },
  textArea: { backgroundColor: "#F3F4F6", borderRadius: 15, padding: 15, height: 100, textAlignVertical: "top", marginBottom: 10 },
  uploadBox: { borderWidth: 2, borderStyle: "dashed", borderColor: "#DDD", borderRadius: 20, padding: 20, alignItems: "center", marginTop: 10 },
  uploadText: { marginTop: 8, color: "#666", fontSize: 12 },
  addBtn: { backgroundColor: "#FF768A", width: 45, height: 45, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  addBtnText: { color: "white", fontWeight: "bold", fontSize: 20 },
  tag: { backgroundColor: "#FFE4EA", padding: 8, borderRadius: 10, marginRight: 5, marginTop: 5, fontSize: 12 },
  mainBtn: { backgroundColor: "#FF768A", padding: 18, borderRadius: 20, alignItems: "center", marginBottom: 40 },
  mainBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10, 
    marginBottom: 10 
  },
  inputError: { borderColor: "#EF4444", borderWidth: 1 }
});