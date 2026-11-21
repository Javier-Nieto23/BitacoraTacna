import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const requiredFields = ['DATABASE_URL'];
const fallbackFields = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

const redactUrl = (url) => {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.username ? 'postgres:***@' : ''}${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`;
  } catch {
    return 'URL inválida';
  }
};

const connectionString = process.env.DATABASE_URL || (
  process.env.DB_HOST
    ? `postgresql://${process.env.DB_USER || 'postgres'}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'railway'}`
    : undefined
);

const missingFields = !connectionString
  ? [
      ...requiredFields.filter((field) => !process.env[field]),
      ...fallbackFields.filter((field) => !process.env[field]),
    ]
  : [];

if (missingFields.length > 0) {
  console.error('[DB] Faltan variables de conexión PostgreSQL:', missingFields);
}

const connectionTarget = process.env.DATABASE_URL
  ? `DATABASE_URL=${redactUrl(process.env.DATABASE_URL)}`
  : `DB_HOST=${process.env.DB_HOST || 'N/A'}, DB_PORT=${process.env.DB_PORT || 'N/A'}, DB_NAME=${process.env.DB_NAME || 'N/A'}, DB_USER=${process.env.DB_USER || 'N/A'}`;

console.log(`[DB] Intentando conectar a PostgreSQL usando: ${connectionTarget}`);

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL || process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

pool.on('error', (err) => {
  console.error('[DB] Error en el pool de conexiones PostgreSQL:', {
    message: err.message,
    code: err.code,
    severity: err.severity,
    detail: err.detail,
  });
});

pool.query('SELECT 1')
  .then(() => {
    console.log('[DB] Conexión a PostgreSQL establecida correctamente.');
  })
  .catch((err) => {
    console.error('[DB] No se pudo establecer la conexión a PostgreSQL:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      target: connectionTarget,
    });
  });

export default pool;
