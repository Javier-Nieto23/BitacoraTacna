// Funciones de utilidad general
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getUsuario = () => {
  return localStorage.getItem('usuario');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const setUsuario = (usuario) => {
  localStorage.setItem('usuario', usuario);
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};

export const isAuthenticated = () => {
  return !!getToken();
};

// Validaciones
export const validarUsuario = (usuario) => {
  if (!usuario || usuario.trim().length < 3) {
    return 'El usuario debe tener al menos 3 caracteres';
  }
  return null;
};

export const validarPassword = (password) => {
  if (!password || password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  return null;
};

export const validarMatricula = (matricula) => {
  if (!matricula || matricula.trim().length === 0) {
    return 'La matrícula es requerida';
  }
  return null;
};

export const validarMotivo = (motivo) => {
  const motivosValidos = ['viaje_trabajo', 'transporte_carga', 'entrega', 'mantenimiento'];
  if (!motivo || !motivosValidos.includes(motivo)) {
    return 'Selecciona un motivo válido';
  }
  return null;
};

// Formateo
export const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatearEstado = (estado) => {
  const estados = {
    pendiente: 'Pendiente',
    aprobado: 'Aprobado',
    en_viaje: 'En Viaje',
    completado: 'Completado',
    cancelado: 'Cancelado',
    disponible: 'Disponible',
    en_uso: 'En Uso',
    mantenimiento: 'Mantenimiento',
  };
  return estados[estado] || estado;
};

// Manejo de errores
export const handleApiError = (error) => {
  if (error.response) {
    return error.response.data?.message || 'Error en la solicitud';
  } else if (error.request) {
    return 'Sin respuesta del servidor';
  } else {
    return 'Error en la configuración de la solicitud';
  }
};
