# Backend - Bitácora de Vehículos

Backend API REST desarrollado con Node.js + Express para la plataforma de bitácora de vehículos.

## 📋 Requisitos

- Node.js v16+
- npm v8+
- MySQL 8.0+
- Conexión a base de datos Railway

## 🚀 Instalación

```bash
npm install
```

## ⚙️ Configuración

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Variables necesarias:
```env
DB_HOST=tu_host
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=tu_base_datos
JWT_SECRET=tu_clave_secreta
PORT=3000
```

## 🎯 Ejecutar en Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 🎯 Ejecutar en Producción

```bash
npm start
```

## 📚 Endpoints

### Autenticación
- `POST /api/auth/login` - Login de usuarios
- `GET /api/auth/verify` - Verificar token

### Solicitudes
- `POST /api/solicitudes/crear` - Crear solicitud
- `GET /api/solicitudes/mis-solicitudes` - Listar solicitudes

## 🔒 Seguridad

- Contraseñas hasheadas con bcryptjs
- Autenticación JWT
- CORS configurado
- Variables sensibles en .env

## 📞 Soporte

Para más información, consulta DOCUMENTACION_COMPLETA.md
