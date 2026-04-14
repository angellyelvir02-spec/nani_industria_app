const DEV_IP = "192.168.0.13";
const PORT = "3000";

export const API_URL = `http://${DEV_IP}:${PORT}`;

const buildUrl = (path: string) => `${API_URL}${path}`;

export const ENDPOINTS = {
  login: buildUrl("/auth/login"),
  register_ninera: buildUrl("/auth/register/ninera"),
  register_cliente: buildUrl("/auth/register/cliente"),
  me: buildUrl("/auth/me"),
  complete_perfil_cliente: buildUrl("/auth/complete-profile"),

  get_nineras: buildUrl("/nineras"),
  get_perfil_ninera: buildUrl("/nineras/usuario"),
  get_detalle_ninera: (id: number | string) => buildUrl(`/nineras/${id}`),
  update_foto_ninera: (usuarioId: string) =>
    buildUrl(`/nineras/foto/${usuarioId}`),

  get_disponibilidad: (id: string, fecha: string) =>
    buildUrl(`/nineras/${id}/availability?fecha=${encodeURIComponent(fecha)}`),

  save_disponibilidad_ninera: buildUrl("/disponibilidad/ninera"),

  get_direcciones_cliente: (clienteId: string) =>
    buildUrl(`/clientes/${clienteId}/direcciones`),

  get_mis_ninos: buildUrl("/clientes/mis-ninos"),

  crear_reserva: buildUrl("/reservas"),

  get_reservas_cliente: (clienteId: string) =>
    buildUrl(`/reservas/cliente/${clienteId}`),

  get_reservas_ninera: (usuarioId: string) =>
    buildUrl(`/reservas/ninera/${usuarioId}`),

  get_mis_reservas_detalle: (usuarioId: string) =>
    buildUrl(`/reservas/mis-reservas/${usuarioId}`),

  get_detalle_reserva: (reservaId: string | number) =>
    buildUrl(`/reservas/detalle/${reservaId}`),

  get_metodo_pago: buildUrl("/reservas/metodos-pago"),

  procesar_checkin: (reservaId: string | number) =>
    buildUrl(`/reservas/${reservaId}/checkin`),

  procesar_checkout: (reservaId: string | number) =>
    buildUrl(`/reservas/${reservaId}/checkout`),

  confirmar_finalizacion: (reservaId: string | number) =>
    buildUrl(`/reservas/${reservaId}/confirmar-finalizacion`),

  update_estado_reserva: (reservaId: string | number) =>
    buildUrl(`/reservas/${reservaId}`),

  rechazar_reserva: (reservaId: string | number) =>
    buildUrl(`/reservas/${reservaId}/rechazar`),

  get_resenas_ninera: (id: string) => `${API_URL}/nineras/${id}/resenas`,

  crear_resena: `${API_URL}/reservas/calificar`,

  cancelar_reserva: (reservaId: string | number) =>
    buildUrl(`/reservas/${reservaId}/cancelar`),
};
