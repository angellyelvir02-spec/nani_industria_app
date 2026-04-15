import React, { useCallback, useState } from "react";

import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect, useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../../../constants/apiConfig";

import {
  Bell,
  Calendar,
  Clock,
  MessageCircle,
  QrCode,
  Star,
  TrendingUp,
  User,
  X,
} from "lucide-react-native";

export default function BabysitterDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("home");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [userName, setUserName] = useState("Usuario");
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [bookingToAccept, setBookingToAccept] = useState<any>(null);
  const [updatingBooking, setUpdatingBooking] = useState(false);

  const [availabilityForm, setAvailabilityForm] = useState({
    dia: "",
    hora_inicio: "",
    hora_fin: "",
  });

  const [availabilityList, setAvailabilityList] = useState<any[]>([]);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingBooking, setRejectingBooking] = useState(false);

  const stats = {
    monthEarnings: 2450,
    rating: 4.9,
    newMessages: 3,
  };

  const DAYS = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const HOURS = [
    "00:00",
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
    "23:59",
  ];

  const normalizeBookingStatus = (status: string) => {
    const normalized = (status || "").toLowerCase().trim();

    if (normalized === "confirmado") return "confirmada";
    if (normalized === "confirmada") return "confirmada";

    if (normalized === "finalizado") return "completada";
    if (normalized === "completado") return "completada";
    if (normalized === "completada") return "completada";

    if (normalized === "cancelado") return "cancelada";
    if (normalized === "cancelada") return "cancelada";

    if (normalized === "en_progreso") return "en_progreso";
    if (normalized === "pendiente") return "pendiente";

    return normalized || "pendiente";
  };

  const getActionLabel = (status: string) => {
    const normalizedStatus = normalizeBookingStatus(status);

    if (normalizedStatus === "pendiente") return "Aceptar";
    if (normalizedStatus === "confirmada") return "Confirmar llegada";
    if (normalizedStatus === "en_progreso") return "Confirmar salida";

    return "Seguimiento";
  };

  const getScanMode = (status: string) => {
    const normalizedStatus = normalizeBookingStatus(status);

    if (normalizedStatus === "confirmada") return "checkin";
    if (normalizedStatus === "en_progreso") return "checkout";

    return "view";
  };

  const handleShowDetails = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const fetchLoggedUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        console.log("No hay token guardado");
        return;
      }

      const response = await fetch(ENDPOINTS.me, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Error trayendo usuario:", data);
        return;
      }

      const nombre = data?.persona?.nombre || "Usuario";
      setUserName(nombre);
    } catch (error) {
      console.log("Error fetchLoggedUser:", error);
    }
  }, []);

  const fetchPendingBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);

      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        console.log("No se encontró userId");
        return;
      }

      const response = await fetch(ENDPOINTS.get_reservas_ninera(userId));
      const data = await response.json();

      if (!response.ok) {
        console.log("Error obteniendo reservas:", data);
        return;
      }

      const mappedBookings = data.map((item: any) => {
        const clientePersona = item.cliente?.persona;
        const fecha = item.fecha_servicio || "";
        const horaInicio = item.hora_inicio || "";
        const horaFin = item.hora_fin || "";
        const normalizedStatus = normalizeBookingStatus(
          item.estado || "pendiente",
        );

        const direccionObj =
          item.direccion ||
          item.direccion_servicio ||
          item.cliente?.direccion ||
          item.cliente?.persona?.direccion ||
          null;

        const address =
          direccionObj?.direccion_completa ||
          direccionObj?.direccion ||
          direccionObj?.ubicacion ||
          direccionObj?.punto_referencia ||
          item.ubicacion ||
          "Dirección no disponible";

        const latitude =
          direccionObj?.latitud ??
          direccionObj?.latitude ??
          item.latitud ??
          item.latitude ??
          "";

        const longitude =
          direccionObj?.longitud ??
          direccionObj?.longitude ??
          item.longitud ??
          item.longitude ??
          "";

        return {
          id: item.id,
          codigo_reserva: item.codigo_reserva || "",
          clientName: clientePersona
            ? `${clientePersona.nombre} ${clientePersona.apellido}`
            : "Cliente",
          clientPhoto:
            clientePersona?.foto_url || "https://via.placeholder.com/150",
          date: fecha,
          time: `${horaInicio} - ${horaFin}`,
          scheduledStart: horaInicio,
          scheduledEnd: horaFin,
          duration: item.duracion_horas || 0,
          children: item.reserva_nino?.length || 0,
          payment: item.monto_total || 0,
          status: normalizedStatus,
          address,
          paymentMethod: item.metodo_pago?.nombre || "No especificado",
          childrenDetails: "Pendiente",
          notes: item.notas_importantes || "Sin notas",
          latitude,
          longitude,
        };
      });

      const activeBookings = mappedBookings.filter((booking: any) =>
        ["pendiente", "confirmada", "en_progreso"].includes(
          normalizeBookingStatus(booking.status),
        ),
      );

      setPendingBookings(activeBookings);
    } catch (error) {
      console.log("Error fetchPendingBookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLoggedUser();
      fetchPendingBookings();
    }, [fetchLoggedUser, fetchPendingBookings]),
  );

  const handleAvailabilityInputChange = (
    field: "dia" | "hora_inicio" | "hora_fin",
    value: string,
  ) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpenAcceptModal = (booking: any) => {
    setBookingToAccept(booking);
    setIsAcceptModalOpen(true);
  };

  const handleAcceptBooking = async () => {
    try {
      if (!bookingToAccept) return;

      setUpdatingBooking(true);

      const response = await fetch(
        ENDPOINTS.update_estado_reserva(bookingToAccept.id),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado: "confirmada",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo aceptar la reserva");
      }

      setPendingBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingToAccept.id
            ? { ...booking, status: "confirmada" }
            : booking,
        ),
      );

      setIsAcceptModalOpen(false);
      setBookingToAccept(null);

      Alert.alert("Éxito", "Reserva aceptada correctamente");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo aceptar la reserva");
    } finally {
      setUpdatingBooking(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!bookingToReject) return;
    try {
      setRejectingBooking(true);
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(
        ENDPOINTS.rechazar_reserva(bookingToReject.id),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ motivo_rechazo: rejectReason.trim() || null }),
        },
      );
      if (!response.ok) throw new Error("No se pudo rechazar");
      Alert.alert("Listo", "Reserva rechazada.");
      setIsRejectModalOpen(false);
      setRejectReason("");
      fetchPendingBookings();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setRejectingBooking(false);
    }
  };

  const openTrackingForBooking = (booking: any) => {
    const normalizedStatus = normalizeBookingStatus(booking.status);
    const scanMode = getScanMode(normalizedStatus);

    router.push({
      pathname: "./JobTracking",
      params: {
        bookingId: booking.id,
        bookingCode: booking.codigo_reserva || "",
        clientName: booking.clientName,
        clientPhoto: booking.clientPhoto,
        date: booking.date,
        time: booking.time,
        scheduledStart: booking.scheduledStart,
        scheduledEnd: booking.scheduledEnd,
        duration: booking.duration,
        children: booking.children,
        address: booking.address,
        payment: booking.payment,
        paymentMethod: booking.paymentMethod,
        childrenDetails: booking.childrenDetails,
        notes: booking.notes,
        latitude: booking.latitude ?? "",
        longitude: booking.longitude ?? "",
        bookingStatus: normalizedStatus,
        scanMode,
      },
    });
  };

  const addAvailabilityItem = () => {
    const { dia, hora_inicio, hora_fin } = availabilityForm;

    if (!dia || !hora_inicio || !hora_fin) {
      Alert.alert(
        "Campos incompletos",
        "Selecciona día, hora inicio y hora fin.",
      );
      return;
    }

    if (!DAYS.includes(dia)) {
      Alert.alert("Día inválido", "Selecciona un día válido.");
      return;
    }

    if (!HOURS.includes(hora_inicio) || !HOURS.includes(hora_fin)) {
      Alert.alert("Hora inválida", "Selecciona horas válidas.");
      return;
    }

    if (hora_inicio >= hora_fin) {
      Alert.alert(
        "Horario inválido",
        "La hora fin debe ser mayor que la hora inicio.",
      );
      return;
    }

    const alreadyExists = availabilityList.some(
      (item) =>
        item.dia_semana === dia &&
        item.hora_inicio === hora_inicio &&
        item.hora_fin === hora_fin,
    );

    if (alreadyExists) {
      Alert.alert("Duplicado", "Ese horario ya fue agregado.");
      return;
    }

    setAvailabilityList((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        dia_semana: dia,
        hora_inicio,
        hora_fin,
      },
    ]);

    setAvailabilityForm({
      dia: "",
      hora_inicio: "",
      hora_fin: "",
    });
  };

  const removeAvailabilityItem = (id: string) => {
    setAvailabilityList((prev) => prev.filter((item) => item.id !== id));
  };

  const closeAvailabilityModal = () => {
    setIsAvailabilityOpen(false);
    setAvailabilityForm({
      dia: "",
      hora_inicio: "",
      hora_fin: "",
    });
  };

  const saveAvailability = async () => {
    try {
      if (availabilityList.length === 0) {
        Alert.alert("Sin registros", "Agrega al menos un horario.");
        return;
      }

      setSavingAvailability(true);

      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        Alert.alert("Error", "No se encontró el userId.");
        return;
      }

      const response = await fetch(ENDPOINTS.save_disponibilidad_ninera, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_id: userId,
          disponibilidad: availabilityList.map(({ id, ...rest }) => rest),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar la disponibilidad");
      }

      Alert.alert("Éxito", "Disponibilidad guardada correctamente");
      setAvailabilityList([]);
      setAvailabilityForm({
        dia: "",
        hora_inicio: "",
        hora_fin: "",
      });
      setIsAvailabilityOpen(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error guardando disponibilidad");
    } finally {
      setSavingAvailability(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.hello}>Hola, {userName} 👋</Text>
            <Text style={styles.sub}>
              Tienes {pendingBookings.length} reservas activas
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notification}
            onPress={() => router.push("./BabysitterNotifications")}
          >
            <Bell color="white" size={22} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.newMessages}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <TrendingUp color="white" size={20} />
            <Text style={styles.statValue}>${stats.monthEarnings}</Text>
            <Text style={styles.statLabel}>Este mes</Text>
          </View>

          <View style={styles.statCard}>
            <Star color="white" size={20} />
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>

          <View style={styles.statCard}>
            <MessageCircle color="white" size={20} />
            <Text style={styles.statValue}>{stats.newMessages}</Text>
            <Text style={styles.statLabel}>Mensajes</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Reservas activas</Text>

        {loadingBookings ? (
          <Text style={{ color: "#666", marginBottom: 12 }}>
            Cargando reservas...
          </Text>
        ) : pendingBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No tienes reservas activas por ahora.
            </Text>
          </View>
        ) : (
          pendingBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingRow}>
                <Image
                  source={{ uri: booking.clientPhoto }}
                  style={styles.avatar}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>{booking.clientName}</Text>

                  <View style={styles.row}>
                    <Clock size={14} color="#666" />
                    <Text style={styles.timeText}>
                      {booking.date} | {booking.time}
                    </Text>
                  </View>

                  <Text style={styles.address}>{booking.address}</Text>

                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Estado:</Text>
                    <Text style={styles.statusValue}>{booking.status}</Text>
                  </View>

                  <View style={styles.buttonRow}>
                    {normalizeBookingStatus(booking.status) === "pendiente" && (
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => {
                          setBookingToReject(booking);
                          setIsRejectModalOpen(true);
                        }}
                      >
                        <Text style={styles.rejectText}>Rechazar</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => {
                        const normalizedStatus = normalizeBookingStatus(
                          booking.status,
                        );

                        if (normalizedStatus === "pendiente") {
                          handleOpenAcceptModal(booking);
                          return;
                        }

                        if (
                          normalizedStatus === "confirmada" ||
                          normalizedStatus === "en_progreso"
                        ) {
                          openTrackingForBooking(booking);
                        }
                      }}
                    >
                      <QrCode size={14} color="white" />
                      <Text style={styles.acceptText}>
                        {getActionLabel(booking.status)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => handleShowDetails(booking)}
                    >
                      <Text>Detalles</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.paymentBox}>
                  <Text style={styles.payment}>${booking.payment}</Text>
                  <Text style={styles.children}>{booking.children} niños</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>

        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => setIsAvailabilityOpen(true)}
          >
            <Clock color="#886BC1" />
            <Text style={styles.quickTitle}>Disponibilidad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("./BabysitterOwnProfile")}
          >
            <User color="#886BC1" />
            <Text style={styles.quickTitle}>Mi perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("./Babysitterchats")}
          >
            <MessageCircle color="#886BC1" />
            <Text style={styles.quickTitle}>Mensajes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("./BabysitterBookingHistory")}
          >
            <Calendar color="#886BC1" />
            <Text style={styles.quickTitle}>Reservas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push("./BabysitterNotifications")}
          >
            <Bell color="#886BC1" />
            <Text style={styles.quickTitle}>Notificaciones</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("home")}
        >
          <Calendar color={activeTab === "home" ? "#FF768A" : "#999"} />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("./BabysitterBookingHistory")}
        >
          <Clock color="#999" />
          <Text style={styles.navText}>Reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("./Babysitterchats")}
        >
          <MessageCircle color="#999" />
          <Text style={styles.navText}>Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("./BabysitterOwnProfile")}
        >
          <User color="#999" />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isDetailsOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.close}
              onPress={() => setIsDetailsOpen(false)}
            >
              <X />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Detalles de la reserva</Text>

            {selectedBooking && (
              <View>
                <Text style={styles.modalText}>
                  Cliente: {selectedBooking.clientName}
                </Text>

                <Text style={styles.modalText}>
                  Fecha: {selectedBooking.date}
                </Text>

                <Text style={styles.modalText}>
                  Hora: {selectedBooking.time}
                </Text>

                <Text style={styles.modalText}>
                  Estado: {selectedBooking.status}
                </Text>

                <Text style={styles.modalText}>
                  Dirección: {selectedBooking.address}
                </Text>

                <Text style={styles.modalText}>
                  Pago: ${selectedBooking.payment}
                </Text>

                <Text style={styles.modalText}>
                  Método de pago: {selectedBooking.paymentMethod}
                </Text>

                <Text style={styles.modalText}>
                  Notas: {selectedBooking.notes}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.okBtn}
              onPress={() => setIsDetailsOpen(false)}
            >
              <Text style={{ color: "white" }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isAcceptModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.close}
              onPress={() => {
                setIsAcceptModalOpen(false);
                setBookingToAccept(null);
              }}
            >
              <X />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Aceptar reserva</Text>

            {bookingToAccept && (
              <View>
                <Text style={styles.modalText}>
                  ¿Deseas aceptar la reserva de {bookingToAccept.clientName}?
                </Text>

                <Text style={styles.modalText}>
                  Fecha: {bookingToAccept.date}
                </Text>

                <Text style={styles.modalText}>
                  Hora: {bookingToAccept.time}
                </Text>

                <Text style={styles.modalText}>
                  Dirección: {bookingToAccept.address}
                </Text>
              </View>
            )}

            <View style={styles.confirmButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setIsAcceptModalOpen(false);
                  setBookingToAccept(null);
                }}
                disabled={updatingBooking}
              >
                <Text style={styles.cancelBtnText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.okBtn,
                  { flex: 1 },
                  updatingBooking && { opacity: 0.7 },
                ]}
                onPress={handleAcceptBooking}
                disabled={updatingBooking}
              >
                <Text style={{ color: "white" }}>
                  {updatingBooking ? "Aceptando..." : "Sí, aceptar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isRejectModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Rechazar reserva</Text>
            <Text style={styles.modalText}>
              ¿Por qué rechazas la solicitud de {bookingToReject?.clientName}?
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Escribe el motivo (opcional)"
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason("");
                }}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmRejectBtn}
                onPress={handleRejectBooking}
                disabled={rejectingBooking}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>
                  {rejectingBooking ? "Rechazando..." : "Confirmar rechazo"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isAvailabilityOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.close}
              onPress={closeAvailabilityModal}
            >
              <X />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
            >
              <Text style={styles.modalTitle}>Gestionar disponibilidad</Text>

              <Text style={styles.inputLabel}>Día</Text>
              <View style={styles.optionsWrap}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.optionChip,
                      availabilityForm.dia === day && styles.optionChipActive,
                    ]}
                    onPress={() => handleAvailabilityInputChange("dia", day)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        availabilityForm.dia === day &&
                          styles.optionChipTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Hora inicio</Text>
              <View style={styles.optionsWrap}>
                {HOURS.map((hour) => (
                  <TouchableOpacity
                    key={`start-${hour}`}
                    style={[
                      styles.optionChip,
                      availabilityForm.hora_inicio === hour &&
                        styles.optionChipActive,
                    ]}
                    onPress={() =>
                      handleAvailabilityInputChange("hora_inicio", hour)
                    }
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        availabilityForm.hora_inicio === hour &&
                          styles.optionChipTextActive,
                      ]}
                    >
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Hora fin</Text>
              <View style={styles.optionsWrap}>
                {HOURS.map((hour) => (
                  <TouchableOpacity
                    key={`end-${hour}`}
                    style={[
                      styles.optionChip,
                      availabilityForm.hora_fin === hour &&
                        styles.optionChipActive,
                    ]}
                    onPress={() =>
                      handleAvailabilityInputChange("hora_fin", hour)
                    }
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        availabilityForm.hora_fin === hour &&
                          styles.optionChipTextActive,
                      ]}
                    >
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.addAvailabilityBtn}
                onPress={addAvailabilityItem}
              >
                <Text style={styles.addAvailabilityBtnText}>
                  Agregar horario
                </Text>
              </TouchableOpacity>

              <ScrollView style={{ maxHeight: 180, marginTop: 12 }}>
                {availabilityList.map((item) => (
                  <View key={item.id} style={styles.availabilityItem}>
                    <View>
                      <Text style={styles.availabilityText}>
                        {item.dia_semana}
                      </Text>
                      <Text style={styles.availabilitySubText}>
                        {item.hora_inicio} - {item.hora_fin}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => removeAvailabilityItem(item.id)}
                    >
                      <Text style={styles.removeText}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.okBtn, savingAvailability && { opacity: 0.7 }]}
                onPress={saveAvailability}
                disabled={savingAvailability}
              >
                <Text style={{ color: "white" }}>
                  {savingAvailability
                    ? "Guardando..."
                    : "Guardar disponibilidad"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#886BC1",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  hello: { color: "white", fontSize: 20 },

  sub: { color: "white", opacity: 0.8 },

  notification: {
    width: 45,
    height: 45,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 4,
  },

  badgeText: { color: "#FF768A", fontSize: 10 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 15,
    width: "30%",
  },

  statValue: { color: "white", fontSize: 18 },

  statLabel: { color: "white", fontSize: 11, opacity: 0.8 },

  content: { padding: 20 },

  sectionTitle: { fontSize: 18, marginBottom: 10 },

  bookingCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },

  emptyCard: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
  },

  emptyText: {
    color: "#666",
    textAlign: "center",
  },

  bookingRow: { flexDirection: "row", gap: 10 },

  avatar: { width: 55, height: 55, borderRadius: 30 },

  clientName: { fontSize: 16, marginBottom: 4 },

  row: { flexDirection: "row", alignItems: "center", gap: 5 },

  timeText: { color: "#666", fontSize: 12 },

  address: { color: "#999", fontSize: 12 },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },

  statusLabel: {
    color: "#666",
    fontSize: 12,
  },

  statusValue: {
    color: "#886BC1",
    fontSize: 12,
    fontWeight: "600",
  },

  buttonRow: { flexDirection: "row", marginTop: 8, gap: 8 },

  acceptBtn: {
    flexDirection: "row",
    backgroundColor: "#FF768A",
    padding: 6,
    borderRadius: 10,
    alignItems: "center",
    gap: 4,
  },

  acceptText: { color: "white" },

  detailsBtn: { backgroundColor: "#eee", padding: 6, borderRadius: 10 },

  paymentBox: { alignItems: "flex-end" },

  payment: { color: "#886BC1", fontSize: 18 },

  children: { fontSize: 12, color: "#777" },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  quickCard: {
    backgroundColor: "white",
    width: "48%",
    padding: 20,
    borderRadius: 20,
    marginBottom: 10,
  },

  quickTitle: { marginTop: 5 },

  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  navItem: { alignItems: "center" },

  navText: { fontSize: 11 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    backgroundColor: "white",
    width: "85%",
    maxHeight: "80%",
    borderRadius: 20,
    padding: 20,
  },

  modalTitle: { fontSize: 18, marginBottom: 10 },

  modalText: { marginBottom: 5 },

  okBtn: {
    backgroundColor: "#FF768A",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },

  inputLabel: {
    marginTop: 10,
    marginBottom: 6,
    color: "#555",
    fontSize: 13,
  },

  addAvailabilityBtn: {
    backgroundColor: "#886BC1",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },

  addAvailabilityBtnText: {
    color: "white",
    fontWeight: "bold",
  },

  availabilityItem: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  availabilityText: {
    fontSize: 15,
    fontWeight: "600",
  },

  availabilitySubText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  removeText: {
    color: "#FF768A",
    fontWeight: "bold",
  },

  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  optionChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  optionChipActive: {
    backgroundColor: "#886BC1",
  },

  optionChipText: {
    color: "#555",
    fontSize: 13,
  },

  optionChipTextActive: {
    color: "white",
    fontWeight: "bold",
  },

  close: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 10,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 4,
  },

  confirmButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#EDEDED",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelBtnText: {
    color: "#444",
    fontWeight: "600",
  },
  rejectBtn: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rejectText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },
  reasonInput: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    height: 90,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginVertical: 12,
  },
  confirmRejectBtn: {
    flex: 2,
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
});
