
const DEV_IP = "192.168.0.13";const PORT = "3000";

export const API_URL = `http://${DEV_IP}:${PORT}`;

export const ENDPOINTS = {
  login: `${API_URL}/auth/login`,
  register: `${API_URL}/auth/register/ninera`,
  register_cliente: `${API_URL}/auth/register/cliente`,
  get_nineras: `${API_URL}/nineras`,
  get_perfil_ninera: `${API_URL}/nineras/usuario`,
  me: `${API_URL}/auth/me`,
  get_detalle_ninera: (id: number | string) => `${API_URL}/nineras/${id}`,
  get_reservas_ninera: (usuarioId: string) =>
    `${API_URL}/reservas/ninera/${usuarioId}`,
  update_foto_ninera: (usuarioId: string) =>
    `${API_URL}/nineras/foto/${usuarioId}`,
  // --- NUEVOS ENDPOINTS PARA RESERVAS ---
  // Consulta de disponibilidad (GET)
  get_disponibilidad: (id: string, fecha: string) =>
    `${API_URL}/nineras/${id}/availability?fecha=${fecha}`,

  // Obtener direcciones del cliente para el selector (GET)
  get_direcciones_cliente: (clienteId: string) =>
    `${API_URL}/clientes/${clienteId}/direcciones`,

  // Crear la reserva final (POST)
  crear_reserva: `${API_URL}/reservas`,

  // Historial de reservas para el padre (GET)
  get_reservas_cliente: (clienteId: string) =>
    `${API_URL}/reservas/cliente/${clienteId}`,

  complete_perfil_cliente: `${API_URL}/auth/complete-profile`,

  //llamado de niños en reserva
  get_mis_ninos: `${API_URL}/clientes/mis-ninos`,
  get_metodo_pago: `${API_URL}/reservas/metodos-pago`,
};
