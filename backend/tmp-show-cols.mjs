import pool from './config/database.js';
const conn = await pool.getConnection();
try {
  const [cols] = await conn.query("SHOW COLUMNS FROM carros");
  console.log(JSON.stringify(cols, null, 2));
} catch (e) {
  console.error(e);
} finally {
  conn.release();
}
