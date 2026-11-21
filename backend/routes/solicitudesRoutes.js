import express from 'express';
import {
  crearSolicitud,
  obtenerSolicitudes,
  obtenerVehiculosPorDevolver,
  registrarDevolucionVehiculo,
  verificarDisponibilidadVehiculo,
} from '../controllers/solicitudesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/disponibilidad', authMiddleware, verificarDisponibilidadVehiculo);
router.get('/por-devolver', authMiddleware, obtenerVehiculosPorDevolver);
router.post('/crear', authMiddleware, crearSolicitud);
router.post('/devolucion', authMiddleware, registrarDevolucionVehiculo);
router.get('/mis-solicitudes', authMiddleware, obtenerSolicitudes);

export default router;
