import { Platform } from 'react-native';

const DEV_IP = '192.168.0.6'; 
const PORT = '3000';

export const API_URL = `http://${DEV_IP}:${PORT}`;

export const ENDPOINTS = {
  login: `${API_URL}/auth/login`,
  register: `${API_URL}/auth/register/ninera`,
  register_cliente: `${API_URL}/auth/register/cliente`,

  get_nineras: `${API_URL}/nineras`,
  
};