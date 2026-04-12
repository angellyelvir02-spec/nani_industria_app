import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { API_URL, ENDPOINTS } from "../../../constants/apiConfig";

export default function BabysitterRegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [skillInput, setSkillInput] = useState("");
  const [certificateInput, setCertificateInput] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const experienceYears = [
    "1 año",
    "2 años",
    "3 años",
    "4 años",
    "5 años",
    "6 años",
    "7 años",
    "8 años",
    "9 años",
    "10+ años",
  ];

  // Generar opciones para los selectores (web)
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { label: "Enero", value: "01" },
    { label: "Febrero", value: "02" },
    { label: "Marzo", value: "03" },
    { label: "Abril", value: "04" },
    { label: "Mayo", value: "05" },
    { label: "Junio", value: "06" },
    { label: "Julio", value: "07" },
    { label: "Agosto", value: "08" },
    { label: "Septiembre", value: "09" },
    { label: "Octubre", value: "10" },
    { label: "Noviembre", value: "11" },
    { label: "Diciembre", value: "12" },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) =>
    (currentYear - i).toString(),
  );

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
    idPhotoBack: null as any,
    facePhoto: null as any,
  });

  // Efecto para web (selectores)
  useEffect(() => {
    if (Platform.OS === "web" && day && month && year) {
      const dateString = `${year}-${month}-${day.padStart(2, "0")}`;
      const birthDateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
      );

      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDateObj.getFullYear();
      const m = today.getMonth() - birthDateObj.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        calculatedAge--;
      }

      setFormData((prev) => ({
        ...prev,
        birthDate: dateString,
        age: calculatedAge.toString(),
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
      } else if (!nombres.every((nombre) => /^[A-ZÁÉÍÓÚÑ]/.test(nombre))) {
        error = "Cada nombre debe iniciar con mayúscula.";
      }
    }

    if (field === "lastName") {
      const apellidos = value.trim().split(/\s+/);
      if (apellidos.length < 2 || apellidos[0] === "") {
        error = "Ingresa tus dos apellidos.";
      } else if (
        !apellidos.every((apellido) => /^[A-ZÁÉÍÓÚÑ]/.test(apellido))
      ) {
        error = "Cada apellido debe iniciar con mayúscula.";
      }
    }

    if (field === "email") {
      const emailLimpio = value.trim().toLowerCase();
      if (
        !emailLimpio.endsWith("@gmail.com") &&
        !emailLimpio.endsWith("@icloud.com")
      ) {
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

    if (field === "location") {
      if (!value.trim()) error = "Ingresa tu ubicación (Ciudad, País).";
    }

    if (field === "password") {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;
      if (!passwordRegex.test(value)) {
        error =
          "Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo.";
      }
    }

    if (field === "confirmPassword") {
      if (value !== formData.password) {
        error = "Las contraseñas no coinciden.";
      } else if (value === "") {
        error = "Debes confirmar tu contraseña.";
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

  const handleDateChange = (selectedDate: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const age = calculateAge(selectedDate);
      setFormData({
        ...formData,
        birthDate: selectedDate.toISOString().split("T")[0],
        age: age.toString(),
      });
      if (errors.birthDate) {
        setErrors({ ...errors, birthDate: null });
      }
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
    if (!skillInput.trim()) return;
    setFormData({ ...formData, skills: [...formData.skills, skillInput] });
    setSkillInput("");
  };

  const addCertificate = () => {
    if (!certificateInput.trim()) return;
    setFormData({
      ...formData,
      certificates: [...formData.certificates, certificateInput],
    });
    setCertificateInput("");
  };

  const handleNext = async () => {
    if (step === 1) {
      let isValid = true;
      let newErrors: any = {};

      // Validación de fecha según plataforma
      if (Platform.OS === "web") {
        if (!day || !month || !year) {
          Alert.alert(
            "Fecha incompleta",
            "Por favor selecciona tu fecha de nacimiento completa.",
          );
          return;
        }
      } else {
        if (!formData.birthDate) {
          Alert.alert(
            "Dato faltante",
            "Por favor selecciona tu fecha de nacimiento.",
          );
          isValid = false;
        }
      }

      if (Number(formData.age) < 18) {
        Alert.alert(
          "Edad mínima",
          "Debes ser mayor de 18 años para registrarte.",
        );
        return;
      }

      const nombres = formData.firstName.trim().split(/\s+/);
      if (
        nombres.length < 2 ||
        nombres[0] === "" ||
        !nombres.every((n) => /^[A-ZÁÉÍÓÚÑ]/.test(n))
      ) {
        newErrors.firstName = "Revisa tus nombres.";
        isValid = false;
      }

      const apellidos = formData.lastName.trim().split(/\s+/);
      if (
        apellidos.length < 2 ||
        apellidos[0] === "" ||
        !apellidos.every((a) => /^[A-ZÁÉÍÓÚÑ]/.test(a))
      ) {
        newErrors.lastName = "Revisa tus apellidos.";
        isValid = false;
      }

      const emailLimpio = formData.email.trim().toLowerCase();
      if (
        !emailLimpio.endsWith("@gmail.com") &&
        !emailLimpio.endsWith("@icloud.com")
      ) {
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

      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        newErrors.password = "Contraseña débil.";
        isValid = false;
      }

      if (
        formData.password !== formData.confirmPassword ||
        formData.confirmPassword === ""
      ) {
        newErrors.confirmPassword = "Las contraseñas no coinciden.";
        isValid = false;
      }

      setErrors(newErrors);
      if (!isValid) {
        Alert.alert(
          "Campos incompletos",
          "Por favor corrige los errores en rojo antes de avanzar.",
        );
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (!formData.experience.trim()) {
        Alert.alert("Campo faltante", "Selecciona tus años de experiencia.");
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!formData.rate.trim()) {
        Alert.alert(
          "Falta información",
          "Por favor ingresa tu tarifa por hora.",
        );
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

        if (formData.idPhotoBack) {
          data.append("DNI_reverso_url", {
            uri: formData.idPhotoBack.uri,
            type: "image/jpeg",
            name: "dni_reverso.jpg",
          } as any);
        }

        if (formData.criminalRecordPhoto) {
          data.append("Antecedentes_penales_url", {
            uri: formData.criminalRecordPhoto.uri,
            type: formData.criminalRecordPhoto.mimeType || "application/pdf",
            name: formData.criminalRecordPhoto.name || "antecedentes.pdf",
          } as any);
        }

        const url = ENDPOINTS.register_ninera;
        console.log("Enviando datos a:", url);

        const response = await fetch(url, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });

        const result = await response.json().catch(() => ({}));
        console.log("Respuesta del servidor:", result);

        if (!response.ok) {
          throw new Error(result.message || "Error al registrar niñera");
        }

        if (Platform.OS === "web") {
          window.alert(
            "¡Registro Recibido!\nTu perfil de Nani ha sido creado y está en revisión. Te avisaremos pronto.",
          );
          router.replace("/login");
          setTimeout(() => {
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
          }, 500);
        } else {
          Alert.alert(
            "¡Registro Recibido!",
            "Tu perfil de Nani ha sido creado y está en revisión. Te avisaremos pronto.",
            [{ text: "Entendido", onPress: () => router.replace("/login") }],
            { cancelable: false },
          );
        }
      } catch (error: any) {
        console.error("Error en el registro:", error);
        Alert.alert(
          "Error de Registro",
          error.message || "No se pudo conectar con el servidor",
        );
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
              <View
                style={[
                  styles.inputContainer,
                  errors.firstName && styles.inputError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={errors.firstName ? "#EF4444" : "#9CA3AF"}
                />
                <TextInput
                  placeholder="Ej: Ana María"
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("firstName", v)}
                />
              </View>
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}

              <Text style={styles.label}>Apellidos</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.lastName && styles.inputError,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={errors.lastName ? "#EF4444" : "#9CA3AF"}
                />
                <TextInput
                  placeholder="Ej: Pérez López"
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("lastName", v)}
                />
              </View>
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}

              <Text style={styles.label}>Fecha de nacimiento</Text>
              {Platform.OS === "web" ? (
                <View style={styles.datePickerRow}>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={day}
                      onValueChange={setDay}
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
                      onValueChange={setMonth}
                      style={styles.picker}
                    >
                      <Picker.Item label="Mes" value="" color="#9CA3AF" />
                      {months.map((m) => (
                        <Picker.Item
                          key={m.value}
                          label={m.label}
                          value={m.value}
                        />
                      ))}
                    </Picker>
                  </View>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={year}
                      onValueChange={setYear}
                      style={styles.picker}
                    >
                      <Picker.Item label="Año" value="" color="#9CA3AF" />
                      {years.map((y) => (
                        <Picker.Item key={y} label={y} value={y} />
                      ))}
                    </Picker>
                  </View>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#9CA3AF"
                    />
                    <TextInput
                      placeholder="Seleccionar fecha"
                      style={styles.input}
                      value={formData.birthDate}
                      editable={false}
                    />
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={showDatePicker}
                    mode="date"
                    onConfirm={handleDateChange}
                    onCancel={() => setShowDatePicker(false)}
                    maximumDate={new Date()}
                    locale="es_ES"
                    confirmTextIOS="Confirmar"
                    cancelTextIOS="Cancelar"
                  />
                </>
              )}

              <Text style={styles.label}>
                Edad: {formData.age ? `${formData.age} años` : "---"}
              </Text>

              <Text style={styles.label}>Correo electrónico</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.email && styles.inputError,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={errors.email ? "#EF4444" : "#9CA3AF"}
                />
                <TextInput
                  placeholder="tu@gmail.com"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(v) => handleInputChange("email", v)}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              <Text style={styles.label}>Teléfono</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.phone && styles.inputError,
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={errors.phone ? "#EF4444" : "#9CA3AF"}
                />
                <TextInput
                  placeholder="+504 9988-7766"
                  style={styles.input}
                  keyboardType="phone-pad"
                  maxLength={13}
                  onChangeText={(v) => handleInputChange("phone", v)}
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}

              <Text style={styles.label}>Ubicación</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.location && styles.inputError,
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={errors.location ? "#EF4444" : "#9CA3AF"}
                />
                <TextInput
                  placeholder="Ciudad, País"
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("location", v)}
                  onBlur={() => validateField("location", formData.location)}
                />
              </View>
              {errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}

              <Text style={styles.label}>Contraseña</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.password && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={errors.password ? "#EF4444" : "#9CA3AF"}
                />
                <TextInput
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("password", v)}
                />
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <Text style={styles.label}>Confirmar contraseña</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.confirmPassword && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={errors.confirmPassword ? "#EF4444" : "#9CA3AF"}
                />
                <TextInput
                  placeholder="Repite tu contraseña"
                  secureTextEntry
                  style={styles.input}
                  onChangeText={(v) => handleInputChange("confirmPassword", v)}
                  onBlur={() =>
                    validateField("confirmPassword", formData.confirmPassword)
                  }
                />
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Verificación</Text>
              <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
                <Ionicons name="document-outline" size={26} color="#999" />
                <Text style={styles.uploadText}>
                  {formData.criminalRecordPhoto
                    ? "Documento cargado"
                    : "Antecedentes Penales"}
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
                    style={{
                      width: 80,
                      height: 80,
                      marginTop: 10,
                      borderRadius: 10,
                    }}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={() => pickImage("idPhotoBack")}
              >
                <Ionicons name="image-outline" size={26} color="#999" />
                <Text style={styles.uploadText}>
                  {formData.idPhotoBack
                    ? "Documento cargado"
                    : "Foto de identidad Reverso"}
                </Text>
                {formData.idPhotoBack && (
                  <Image
                    source={{ uri: formData.idPhotoBack.uri }}
                    style={{
                      width: 80,
                      height: 80,
                      marginTop: 10,
                      borderRadius: 10,
                    }}
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
                    style={{
                      width: 80,
                      height: 80,
                      marginTop: 10,
                      borderRadius: 10,
                    }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

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
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Experiencia</Text>
              <Text style={styles.helperText}>
                Selecciona cuántos años de experiencia tienes cuidando niños.
              </Text>
              <View style={{ marginTop: 10 }}>
                {experienceYears.map((year, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.experienceOption,
                      formData.experience === year &&
                        styles.experienceOptionActive,
                    ]}
                    onPress={() => handleInputChange("experience", year)}
                  >
                    <Text
                      style={[
                        styles.experienceOptionText,
                        formData.experience === year &&
                          styles.experienceOptionTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
              {formData.skills.map((skill, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.tag}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const updated = [...formData.skills];
                      updated.splice(i, 1);
                      setFormData({ ...formData, skills: updated });
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
              <Text style={styles.cardTitle}>Certificados y Tarifa</Text>
              <View style={styles.row}>
                <TextInput
                  placeholder="Ej: Certificado Niñera"
                  style={styles.input}
                  value={certificateInput}
                  onChangeText={setCertificateInput}
                />
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={addCertificate}
                >
                  <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              {formData.certificates.map((c, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.tag}>{c}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const updated = [...formData.certificates];
                      updated.splice(i, 1);
                      setFormData({ ...formData, certificates: updated });
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
  progressFill: { height: 6, backgroundColor: "white", borderRadius: 10 },
  content: { padding: 20 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 15,
    fontSize: 15,
    color: "#2E2E2E",
  },
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
  datePickerRow: { flexDirection: "row", gap: 10, marginTop: 5 },
  pickerWrapper: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 15,
    height: 55,
    justifyContent: "center",
    overflow: "hidden",
  },
  picker: { width: "100%", height: "100%" },
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
    overflow: "hidden",
  },
  mainBtn: {
    backgroundColor: "#FF768A",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 40,
  },
  mainBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4, marginLeft: 4 },
  inputError: { borderColor: "#EF4444", borderWidth: 1 },
  helperText: { color: "#6B7280", marginTop: 6, fontSize: 13 },
  experienceOption: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F3F4F6",
  },
  experienceOptionActive: { backgroundColor: "#FF768A" },
  experienceOptionText: { color: "#333", fontWeight: "500" },
  experienceOptionTextActive: { color: "white", fontWeight: "600" },
});
