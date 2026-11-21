import pool from '../config/database.js';

const normalizarPlaca = (valor) => String(valor ?? '')
  .trim()
  .replace(/^QR[-_\s]*/i, '')
  .replace(/\s+/g, '')
  .toUpperCase();

export const buscarVehiculoPorPlaca = async (req, res) => {
  try {
    const placa = String(req.query.placa || '').trim();

    if (!placa) {
      return res.status(400).json({
        success: false,
        message: 'La placa es requerida',
      });
    }

    const plate = normalizarPlaca(placa);
    const sql = `
      SELECT
        c.id,
        c.model,
        c.brand,
        c.license_plate AS placa,
        c.qr_code,
        c.image_url,
        COALESCE(cs.status, 'disponible') AS status
      FROM cars c
      LEFT JOIN cars_status cs ON cs.id_car = c.id
      WHERE UPPER(COALESCE(c.license_plate, '')) = $1
         OR UPPER(COALESCE(c.qr_code, '')) = $1
         OR UPPER(REPLACE(COALESCE(c.qr_code, ''), 'QR-', '')) = $1
         OR UPPER(REPLACE(COALESCE(c.qr_code, ''), 'QR_', '')) = $1
      ORDER BY cs.id DESC NULLS LAST
      LIMIT 1
    `;

    const result = await pool.query(sql, [plate]);
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el vehículo para la placa escaneada',
        placa,
      });
    }

    return res.json({
      success: true,
      data: {
        id: row.id,
        placa: row.placa || placa,
        marca: row.brand || 'Sin marca',
        modelo: row.model || 'Sin modelo',
        color: 'Sin color',
        estado: row.status || 'disponible',
      },
    });
  } catch (error) {
    console.error('Error buscando vehículo por placa:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar la información del vehículo',
      error: error.message,
    });
  }
};

export const listarVehiculosDisponibles = async (req, res) => {
  try {
    const sql = `
      SELECT
        c.id,
        c.brand,
        c.model,
        c.year,
        c.license_plate AS placa,
        c.qr_code,
        COALESCE(cs.status, 'disponible') AS status
      FROM cars c
      LEFT JOIN cars_status cs ON cs.id_car = c.id
      WHERE LOWER(COALESCE(cs.status, 'disponible')) = 'disponible'
      ORDER BY c.license_plate ASC
    `;

    const result = await pool.query(sql);

    return res.json({
      success: true,
      data: (result.rows || []).map((vehicle) => ({
        id: vehicle.id,
        placa: vehicle.placa,
        marca: vehicle.brand || 'Sin marca',
        modelo: vehicle.model || 'Sin modelo',
        anio: vehicle.year || 'Sin año',
        color: 'Sin color',
        codigo_qr: vehicle.qr_code || '',
        estado: String(vehicle.status || 'disponible').trim() || 'disponible',
      })),
    });
  } catch (error) {
    console.error('Error listando vehículos disponibles:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar vehículos disponibles',
      error: error.message,
    });
  }
};
