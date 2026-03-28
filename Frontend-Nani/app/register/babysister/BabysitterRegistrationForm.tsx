import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [certificateInput, setCertificateInput] = useState("");

  // ESTADO NUEVO: Mensajes de error
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

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

  // ACTUALIZADO: Limpia el error cuando el usuario edita el campo
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // NUEVO: Validación en tiempo real (OnBlur)
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
  if (field === "password") {
      // Nueva regla: 8 caracteres, Mayúscula, Minúscula, Número y Símbolo
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;
      if (!passwordRegex.test(value)) {
        error = "Mín. 8 caracteres, 1 mayúscula, 1 número y 1 símbolo.";
      }
    }

    if (field === "confirmPassword") {
      if (value !== formData.password) {
        error = "Las contraseñas no coinciden.";
      } else if (value === "") {
        error = "Debes confirmar tu contraseña.";
      }
    }

if (field === "phone") {
      // Regex: ^\+504 (empieza con +504) 
      // \d{4} (4 números) -? (guion opcional) \d{4}$ (otros 4 números al final)
      const phoneRegex = /^\+504\d{4}-?\d{4}$/;
      
      if (!value.trim()) {
        error = "Ingresa tu número de teléfono.";
      } else if (!phoneRegex.test(value.trim())) {
        error = "Formato: +504XXXXXXXX o +504XXXX-XXXX";
      }
    }

    if (field === "location") {
      if (!value.trim()) error = "Ingresa tu ubicación (Ciudad, País).";
    }

    if (field === "password") {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;
      if (!passwordRegex.test(value)) {
        error = "Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo.";
      }
    }

    if (field === "confirmPassword") {
      if (value !== formData.password) {
        error = "Las contraseñas no coinciden.";
      }
    }

    setErrors((prev: any) => ({ ...prev, [field]: error }));
  };

  const calculateAge = (date: Date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
    return age;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate) {
      const age = calculateAge(selectedDate);
      setFormData({
        ...formData,
        birthDate: selectedDate.toISOString().split('T')[0],
        age: age.toString(),
      });
    }
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
    // --- PASO 1: VALIDACIONES COMPUESTAS ---
    if (step === 1) {
      let isValid = true;
      let newErrors: any = {};

      const nombres = formData.firstName.trim().split(/\s+/);
      if (nombres.length < 2 || nombres[0] === "" || !nombres.every(n => /^[A-ZÁÉÍÓÚÑ]/.test(n))) {
        newErrors.firstName = "Revisa tus nombres.";
        isValid = false;
      }

      const apellidos = formData.lastName.trim().split(/\s+/);
      if (apellidos.length < 2 || apellidos[0] === "" || !apellidos.every(a => /^[A-ZÁÉÍÓÚÑ]/.test(a))) {
        newErrors.lastName = "Revisa tus apellidos.";
        isValid = false;
      }

      if (!formData.birthDate) {
        Alert.alert("Dato faltante", "Por favor selecciona tu fecha de nacimiento.");
        isValid = false;
      } else if (Number(formData.age) < 18) {
        Alert.alert("Edad mínima", "Debes ser mayor de 18 años para registrarte como niñera.");
        isValid = false;
      }

      const emailLimpio = formData.email.trim().toLowerCase();
      if (!emailLimpio.endsWith("@gmail.com") && !emailLimpio.endsWith("@icloud.com")) {
        newErrors.email = "Correo inválido.";
        isValid = false;
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Requerido.";
        isValid = false;
      }

      if (!formData.location.trim()) {
        newErrors.location = "Requerido.";
        isValid = false;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        newErrors.password = "Contraseña débil.";
        isValid = false;
      }

      if (formData.password !== formData.confirmPassword || formData.confirmPassword === "") {
        newErrors.confirmPassword = "Las contraseñas no coinciden.";
        isValid = false;
      }

      setErrors(newErrors);

      if (!isValid) {
        Alert.alert("Campos incompletos", "Por favor corrige los errores en rojo antes de avanzar.");
        return;
      }

      setStep(2);
      return;
    }

    // --- PASO 2: AVANZAR ---
    if (step === 2) {
      setStep(3);
      return;
    }

    // --- PASO 3: ENVÍO AL BACKEND ---
    if (step === 3) {
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
        //data.append("edad", formData.age);
        data.append("presentacion", formData.presentation);
        data.append("experiencia", formData.experience);
        data.append("tarifa", formData.rate);

        data.append("habilidades", formData.skills.join(","));
        data.append("certificaciones", formData.certificates.join(","));

        // ✅ FOTO DE PERFIL (selfie)
        if (formData.facePhoto) {
          data.append("foto_url", {
            uri: formData.facePhoto.uri,
            type: "image/jpeg",
            name: "foto_perfil.jpg",
          } as any);
        }

        // ✅ DNI FRONTAL
        if (formData.idPhoto) {
          data.append("DNI_frontal_url", {
            uri: formData.idPhoto.uri,
            type: "image/jpeg",
            name: "dni_frontal.jpg",
          } as any);
        }

        // ✅ DNI REVERSO (no se usa aún)
        //data.append("DNI_reverso_url", "null");

        // ✅ ANTECEDENTES
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
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Error al registrar niñera");
        }

        Alert.alert("¡Éxito!", "Tu registro ha sido enviado correctamente.", [
          { text: "OK", onPress: () => router.replace("/login") }
        ]);

      } catch (error: any) {
        Alert.alert("Error", error.message || "No se pudo conectar con el servidor");
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
            <Text style={styles.headerSubtitle}>
              Paso {step} de {totalSteps}
            </Text>
          </View>
        </View>

        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${(step / totalSteps) * 100}%` },
            ]}
          />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Información Personal</Text>

              <Text style={styles.label}>Nombres</Text>
              <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                <Ionicons name="person-outline" size={18} color={errors.firstName ? "#EF4444" : "#9CA3AF"} />
                <TextInput
                  placeholder="Ej: Ana María"
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("firstName", v)}
                  onBlur={() => validateField("firstName", formData.firstName)}
                />
              </View>
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

              <Text style={styles.label}>Apellidos</Text>
              <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                <Ionicons name="person-outline" size={18} color={errors.lastName ? "#EF4444" : "#9CA3AF"} />
                <TextInput
                  placeholder="Ej: Pérez López"
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("lastName", v)}
                  onBlur={() => validateField("lastName", formData.lastName)}
                />
              </View>
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

              <Text style={styles.label}>Fecha de nacimiento</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="Seleccionar fecha"
                  style={styles.input}
                  value={formData.birthDate}
                  editable={false}
                />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}

              <Text style={styles.label}>Edad</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={formData.age}
                  editable={false}
                />
              </View>

              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={18} color={errors.email ? "#EF4444" : "#9CA3AF"} />
                <TextInput
                  placeholder="tu@gmail.com o @icloud.com"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(v) => handleInputChange("email", v)}
                  onBlur={() => validateField("email", formData.email)}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
<Text style={styles.label}>Teléfono</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={18} color={errors.phone ? "#EF4444" : "#9CA3AF"} />
                <TextInput
                  placeholder="+504 9988-7766"
                  style={styles.input}
                  keyboardType="phone-pad"
                  maxLength={13} // Para que no escriban de más
                  onChangeText={(v) => handleInputChange("phone", v)}
                  onBlur={() => validateField("phone", formData.phone)}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              
              <Text style={styles.label}>Ubicación</Text>
              <View style={[styles.inputContainer, errors.location && styles.inputError]}>
                <Ionicons name="location-outline" size={18} color={errors.location ? "#EF4444" : "#9CA3AF"} />
                <TextInput
                  placeholder="Ciudad, País"
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("location", v)}
                  onBlur={() => validateField("location", formData.location)}
                />
              </View>
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

              <Text style={styles.label}>Contraseña</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={errors.password ? "#EF4444" : "#9CA3AF"} />
                <TextInput
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("password", v)}
                  onBlur={() => validateField("password", formData.password)}
                />
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={errors.confirmPassword ? "#EF4444" : "#9CA3AF"} />
                <TextInput
                  placeholder="Repite tu contraseña"
                  secureTextEntry
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("confirmPassword", v)}
                  onBlur={() => validateField("confirmPassword", formData.confirmPassword)}
                />
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Verificación biométrica y documentos
              </Text>

              <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
                <Ionicons name="document-outline" size={26} color="#999" />
                <Text style={styles.uploadText}>
                  {formData.criminalRecordPhoto
                    ? formData.criminalRecordPhoto.name
                    : "Antecedentes penales"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadBox}
                onPress={() => pickImage("idPhoto")}
              >
                <Ionicons name="image-outline" size={26} color="#999" />
                <Text style={styles.uploadText}>
                  {formData.idPhoto ? "Documento cargado" : "Foto de identidad"}
                </Text>
                {formData.idPhoto && (
                  <Image
                    source={{ uri: formData.idPhoto.uri }}
                    style={{ width: 80, height: 80, marginTop: 10, borderRadius: 10 }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadBox} onPress={takeSelfie}>
                <Ionicons name="camera-outline" size={26} color="#999" />
                <Text style={styles.uploadText}>
                  {formData.facePhoto ? "Selfie cargada" : "Tomar selfie"}
                </Text>
                {formData.facePhoto && (
                  <Image
                    source={{ uri: formData.facePhoto.uri }}
                    style={{ width: 80, height: 80, marginTop: 10, borderRadius: 10 }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Presentación</Text>
              <TextInput
                placeholder="Cuéntanos sobre ti..."
                multiline
                style={styles.textArea}
                onChangeText={(v) => handleInputChange("presentation", v)}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Experiencia</Text>
              <TextInput
                placeholder="Describe tu experiencia profesional..."
                multiline
                style={styles.textArea}
                onChangeText={(v) => handleInputChange("experience", v)}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Habilidades</Text>
              <View style={styles.row}>
                <TextInput
                  placeholder="Ej: Primeros auxilios"
                  style={styles.input}
                  value={skillInput}
                  onChangeText={setSkillInput}
                />
                <TouchableOpacity style={styles.addBtn} onPress={addSkill}>
                  <Text style={styles.addBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>

              {formData.skills.map((skill, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.tag}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const updated = [...formData.skills]
                      updated.splice(i, 1)
                      setFormData({ ...formData, skills: updated })
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF768A" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Certificados</Text>
              <View style={styles.row}>
                <TextInput
                  placeholder="Ej: Certificado en RCP"
                  style={styles.input}
                  value={certificateInput}
                  onChangeText={setCertificateInput}
                />
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={addCertificate}
                >
                  <Text style={styles.addBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>

              {formData.certificates.map((c, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.tag}>{c}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const updated = [...formData.certificates]
                      updated.splice(i, 1)
                      setFormData({ ...formData, certificates: updated })
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF768A" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tarifa por hora</Text>
              <TextInput
                placeholder="Ej: 200 LPS"
                keyboardType="numeric"
                style={styles.input}
                onChangeText={(v) => handleInputChange("rate", v)}
              />
            </View>

            <View style={styles.finishCard}>
              <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                ¡Casi listo!
              </Text>
              <Text style={{ color: "#555" }}>
                Tu perfil será revisado por nuestro equipo. Recibirás una
                notificación cuando sea aprobado.
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[styles.mainBtn, loading && { opacity: 0.7 }]} 
          onPress={handleNext}
          disabled={loading}
        >
          {loading && step === 3 ? (
             <ActivityIndicator color="white" />
          ) : (
             <Text style={styles.mainBtnText}>
               {step === totalSteps ? "Completar registro" : "Continuar"}
             </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },

  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 15 },

  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: { color: "white", fontWeight: "bold", fontSize: 18 },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 14 },

  progressBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    marginTop: 20,
  },

  progressFill: {
    height: 6,
    backgroundColor: "white",
    borderRadius: 10,
  },

  content: { padding: 20 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },

  finishCard: {
    backgroundColor: "#F5D5E1",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  cardTitle: { fontWeight: "bold", marginBottom: 15, fontSize: 15, color: "#2E2E2E" },

  label: { fontSize: 13, color: "#6B7280", marginTop: 10, marginBottom: 6 },

  row: { flexDirection: "row", gap: 10, alignItems: "center" },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
  },

  input: { flex: 1, fontSize: 14, color: "#111827" },

  textArea: {
    backgroundColor: "#F3F4F6",
    borderRadius: 15,
    padding: 15,
    height: 120,
    textAlignVertical: "top",
  },

  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDD",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginTop: 15,
  },

  uploadText: { marginTop: 10, color: "#666" },

  addBtn: {
    backgroundColor: "#FF768A",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },

  addBtnText: { color: "white", fontWeight: "bold" },

  tag: {
    marginTop: 8,
    backgroundColor: "#FFE4EA",
    padding: 8,
    borderRadius: 10,
    overflow: "hidden", // Para que no se salga el color de fondo en iOS
  },

  mainBtn: {
    backgroundColor: "#FF768A",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 40,
  },

  mainBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },

  // NUEVOS ESTILOS PARA ERRORES
  errorText: {
    color: "#EF4444", 
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 1,
  },
});