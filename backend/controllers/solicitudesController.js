import pool from '../config/database.js';

const normalizarPlaca = (valor) => String(valor ?? '')
  .trim()
  .replace(/^QR[-_\s]*/i, '')
  .replace(/\s+/g, '')
  .toUpperCase();

const normalizarEstadoVehiculo = (estado) => {
  const valor = String(estado ?? '').trim().toLowerCase();
  const equivalencias = {
    disponible: 'disponible',
    'en uso': 'en_uso',
    'en_uso': 'en_uso',
    reservado: 'reservado',
    ocupado: 'en_uso',
    mantenimiento: 'mantenimiento',
    baja: 'baja',
    'fuera de servicio': 'mantenimiento',
    'fuera_de_servicio': 'mantenimiento',
  };

  return equivalencias[valor] || valor || 'disponible';
};

const obtenerVehiculoPorReferencia = async (referencia) => {
  const valor = normalizarPlaca(referencia);

  if (!valor) {
    return null;
  }

  const result = await pool.query(
    `SELECT id, brand, model, license_plate, qr_code, image_url
     FROM cars
     WHERE UPPER(COALESCE(license_plate, '')) = $1
        OR UPPER(COALESCE(qr_code, '')) = $1
        OR UPPER(REPLACE(COALESCE(qr_code, ''), 'QR-', '')) = $1
        OR UPPER(REPLACE(COALESCE(qr_code, ''), 'QR_', '')) = $1
     ORDER BY id
     LIMIT 1`,
    [valor]
  );

  return result.rows[0] || null;
};

const asegurarEstadoVehiculo = async (connection, idCar) => {
  if (!idCar) return null;

  const existente = await connection.query(
    'SELECT id, id_car, id_rol, status FROM cars_status WHERE id_car = $1 ORDER BY id LIMIT 1',
    [idCar]
  );

  if (existente.rows.length > 0) {
    return existente.rows[0];
  }

  const rol = await connection.query('SELECT id FROM rol ORDER BY id LIMIT 1');
  if (!rol.rows.length) {
    return null;
  }

  const insertado = await connection.query(
    'INSERT INTO cars_status (id_car, id_rol, status) VALUES ($1, $2, $3) RETURNING id, id_car, id_rol, status',
    [idCar, rol.rows[0].id, 'disponible']
  );

  return insertado.rows[0];
};

export const actualizarEstadoVehiculo = async (connection, idCar, estado) => {
  if (!idCar) return null;

  const valor = normalizarEstadoVehiculo(estado);
  if (!valor) return null;

  const existente = await asegurarEstadoVehiculo(connection, idCar);
  if (!existente) return null;

  await connection.query(
    'UPDATE cars_status SET status = $1 WHERE id_car = $2',
    [valor, idCar]
  );

  return valor;
};

const sincronizarEstadoVehiculo = async (connection, idCar) => {
  if (!idCar) return 'disponible';

  const solicitudActiva = await connection.query(
    `SELECT id
     FROM exit_request
     WHERE id_car = $1 AND end_date IS NULL
     ORDER BY start_date DESC NULLS LAST
     LIMIT 1`,
    [idCar]
  );

  const estado = solicitudActiva.rows.length > 0 ? 'en_uso' : 'disponible';
  await actualizarEstadoVehiculo(connection, idCar, estado);
  return estado;
};

const validarDisponibilidadVehiculo = async (connection, idCar, fecha_salida) => {
  if (!idCar || !fecha_salida) {
    return {
      disponible: false,
      mensaje: 'La fecha de salida y el vehículo son requeridos.',
    };
  }

  const fecha = new Date(fecha_salida);
  const fechaIso = Number.isNaN(fecha.getTime())
    ? new Date().toISOString().slice(0, 10)
    : fecha.toISOString().slice(0, 10);

  const mismoDia = await connection.query(
    `SELECT id
     FROM exit_request
     WHERE id_car = $1
       AND start_date = $2
       AND end_date IS NULL
     LIMIT 1`,
    [idCar, fechaIso]
  );

  if (mismoDia.rows.length > 0) {
    await sincronizarEstadoVehiculo(connection, idCar);
    return {
      disponible: false,
      mensaje: 'El vehículo ya tiene una solicitud activa para ese mismo día.',
    };
  }

  await sincronizarEstadoVehiculo(connection, idCar);
  return {
    disponible: true,
    mensaje: 'Disponibilidad correcta.',
  };
};

export const verificarDisponibilidadVehiculo = async (req, res) => {
  try {
    const { matricula, id_car, fecha_salida } = req.query;

    if (!fecha_salida || (!matricula && !id_car)) {
      return res.status(400).json({
        success: false,
        message: 'La placa o ID del vehículo y la fecha de salida son requeridas.',
      });
    }

    const referencia = matricula || id_car;
    const carro = Number.isFinite(Number(referencia))
      ? (await pool.query('SELECT id, license_plate, brand, model FROM cars WHERE id = $1 LIMIT 1', [Number(referencia)])).rows[0]
      : await obtenerVehiculoPorReferencia(referencia);

    if (!carro) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el vehículo solicitado.',
      });
    }

    const resultado = await validarDisponibilidadVehiculo(pool, carro.id, String(fecha_salida).trim());

    return res.json({
      success: true,
      disponible: resultado.disponible,
      message: resultado.mensaje,
      vehiculo: {
        id: carro.id,
        placa: carro.license_plate,
        marca: carro.brand,
        modelo: carro.model,
      },
    });
  } catch (error) {
    console.error('Error verificando disponibilidad del vehículo:', error);
    return res.status(500).json({
      success: false,
      message: 'No fue posible verificar la disponibilidad del vehículo.',
    });
  }
};

export const registrarDevolucionVehiculo = async (req, res) => {
  try {
    const { kilometraje_final, gasolina_restante, comentarios, fotos } = req.body;
    const usuario_id = req.user.id;

    if (kilometraje_final === undefined || gasolina_restante === undefined) {
      return res.status(400).json({
        success: false,
        message: 'El kilometraje final y la gasolina restante son requeridos.',
      });
    }

    const kilometrajeNumero = Number(kilometraje_final);
    const gasolinaNumero = Number(gasolina_restante);

    if (Number.isNaN(kilometrajeNumero) || Number.isNaN(gasolinaNumero)) {
      return res.status(400).json({
        success: false,
        message: 'Los valores de kilometraje y gasolina no son válidos.',
      });
    }

    const solicitudActiva = await pool.query(
      `SELECT er.id, er.id_car, c.license_plate
       FROM exit_request er
       JOIN cars c ON c.id = er.id_car
       WHERE er.id_user = $1 AND er.end_date IS NULL
       ORDER BY er.start_date DESC NULLS LAST
       LIMIT 1`,
      [usuario_id]
    );

    if (!solicitudActiva.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'No tienes un vehículo activo para devolver.',
      });
    }

    const solicitud = solicitudActiva.rows[0];

    const entrada = await pool.query(
      `INSERT INTO entrance_request (
         id_user,
         id_exit_request,
         comment,
         oil,
         end_mileage,
         front_image,
         side_image,
         back_image
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        usuario_id,
        solicitud.id,
        comentarios || '',
        gasolinaNumero,
        kilometrajeNumero,
        fotos?.frente || '',
        fotos?.lateral || '',
        fotos?.trasera || '',
      ]
    );

    await pool.query(
      'UPDATE exit_request SET end_date = CURRENT_DATE WHERE id = $1',
      [solicitud.id]
    );

    await actualizarEstadoVehiculo(pool, solicitud.id_car, 'disponible');

    return res.json({
      success: true,
      message: 'Devolución registrada correctamente.',
      matricula: solicitud.license_plate,
      entrada_id: entrada.rows[0]?.id,
    });
  } catch (error) {
    console.error('Error registrando devolución del vehículo:', error);
    return res.status(500).json({
      success: false,
      message: 'No fue posible registrar la devolución del vehículo.',
      error: error.message,
    });
  }
};

export const crearSolicitud = async (req, res) => {
  try {
    const { matricula, id_car, motivo, destino, kilometraje_inicial, fecha_salida } = req.body;
    const usuario_id = req.user.id;

    if ((!matricula && !id_car) || !motivo || !destino || !kilometraje_inicial || !fecha_salida) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
      });
    }

    const solicitudActiva = await pool.query(
      'SELECT id, id_car FROM exit_request WHERE id_user = $1 AND end_date IS NULL LIMIT 1',
      [usuario_id]
    );

    if (solicitudActiva.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'No puedes solicitar otro vehículo porque ya tienes uno activo pendiente de devolución.',
      });
    }

    const carro = id_car
      ? (await pool.query('SELECT id, brand, model, license_plate FROM cars WHERE id = $1 LIMIT 1', [id_car])).rows[0]
      : await obtenerVehiculoPorReferencia(matricula);

    if (!carro) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el vehículo solicitado.',
      });
    }

    const disponibilidad = await validarDisponibilidadVehiculo(pool, carro.id, fecha_salida);
    if (!disponibilidad.disponible) {
      return res.status(409).json({
        success: false,
        message: disponibilidad.mensaje,
      });
    }

    const fechaSalida = new Date(fecha_salida);
    const startDate = Number.isNaN(fechaSalida.getTime())
      ? new Date().toISOString().slice(0, 10)
      : fechaSalida.toISOString().slice(0, 10);

    const insert = await pool.query(
      `INSERT INTO exit_request (
         id_user,
         id_car,
         reason,
         destiny,
         start_mileage,
         start_date,
         create_date
       ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
       RETURNING id`,
      [usuario_id, carro.id, motivo, destino, Number(kilometraje_inicial), startDate]
    );

    await sincronizarEstadoVehiculo(pool, carro.id);

    return res.json({
      success: true,
      message: 'Solicitud creada exitosamente',
      solicitud_id: insert.rows[0].id,
      vehiculo: {
        id: carro.id,
        placa: carro.license_plate,
      },
    });
  } catch (error) {
    console.error('Error creando solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear la solicitud',
      error: error.message,
    });
  }
};

export const obtenerVehiculosPorDevolver = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT er.id,
              er.id_user,
              er.id_car,
              c.license_plate AS matricula,
              u.user_name AS usuario,
              er.reason AS motivo,
              er.destiny AS destino,
              er.start_mileage AS kilometraje_inicial,
              er.start_date AS fecha_salida,
              CASE WHEN er.end_date IS NULL THEN 'pendiente' ELSE 'devuelto' END AS estado
       FROM exit_request er
       JOIN cars c ON c.id = er.id_car
       JOIN users u ON u.id = er.id_user
       WHERE er.end_date IS NULL
       ORDER BY er.start_date DESC`
    );

    return res.json({
      success: true,
      data: (result.rows || []).map((vehiculo) => ({
        id: vehiculo.id,
        usuario_id: vehiculo.id_user,
        usuario: vehiculo.usuario || `Usuario ${vehiculo.id_user}`,
        matricula: vehiculo.matricula,
        motivo: vehiculo.motivo,
        destino: vehiculo.destino,
        kilometraje_inicial: vehiculo.kilometraje_inicial,
        fecha_salida: vehiculo.fecha_salida,
        estado: vehiculo.estado,
      })),
    });
  } catch (error) {
    console.error('Error obteniendo vehículos por devolver:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los vehículos pendientes de devolución',
    });
  }
};

export const obtenerSolicitudes = async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const result = await pool.query(
      `SELECT er.id,
              er.id_user,
              er.id_car,
              c.license_plate AS matricula,
              er.reason AS motivo,
              er.destiny AS destino,
              er.start_mileage AS kilometraje_inicial,
              er.start_date AS fecha_salida,
              er.end_date AS fecha_retorno,
              CASE WHEN er.end_date IS NULL THEN 'pendiente' ELSE 'devuelto' END AS estado,
              er.create_date AS fecha_creacion
       FROM exit_request er
       JOIN cars c ON c.id = er.id_car
       WHERE er.id_user = $1
       ORDER BY er.create_date DESC`,
      [usuario_id]
    );

    return res.json({
      success: true,
      solicitudes: result.rows,
    });
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes',
    });
  }
};
