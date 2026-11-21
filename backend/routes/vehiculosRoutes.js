import express from 'express';
import { buscarVehiculoPorPlaca, listarVehiculosDisponibles } from '../controllers/vehiculosController.js';

const router = express.Router();

router.get('/lookup', buscarVehiculoPorPlaca);
router.get('/disponibles', listarVehiculosDisponibles);

export default router;
