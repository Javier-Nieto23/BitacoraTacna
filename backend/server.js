import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import solicitudesRoutes from './routes/solicitudesRoutes.js';
import vehiculosRoutes from './routes/vehiculosRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://tudominio-frontend.vercel.app'],
  credentials: true,
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/vehiculos', vehiculosRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend activo', timestamp: new Date() });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📦 Base de datos: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});
