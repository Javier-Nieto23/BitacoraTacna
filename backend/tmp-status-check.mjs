import pool from './config/database.js';
const conn = await pool.getConnection();
try {
  await conn.query("UPDATE carros SET estatus = 'en_uso' WHERE no_placa = 'B92NXM7'");
  const [rows] = await conn.query("SELECT no_placa, estatus FROM carros WHERE no_placa = 'B92NXM7'");
  console.log(JSON.stringify(rows, null, 2));
  await conn.query("UPDATE carros SET estatus = 'disponible' WHERE no_placa = 'B92NXM7'");
} catch (e) {
  console.error('ERR', e.code, e.message);
} finally { conn.release(); }
