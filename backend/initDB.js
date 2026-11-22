import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidatePaths = [
  process.env.DB_INIT_SQL_PATH,
  path.resolve(__dirname, '../setup_database.sql'),
  path.resolve(__dirname, 'setup_database.sql'),
  path.resolve(process.cwd(), 'setup_database.sql'),
  path.resolve(process.cwd(), '../setup_database.sql'),
  path.resolve(process.cwd(), 'backend/setup_database.sql'),
];

const resolveSqlFilePath = () => {
  const uniqueCandidates = [...new Set(candidatePaths.filter(Boolean))];

  for (const candidate of uniqueCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return uniqueCandidates[0] || 'setup_database.sql';
};

const sqlFilePath = resolveSqlFilePath();

const loadSqlStatements = () => {
  if (!fs.existsSync(sqlFilePath)) {
    throw new Error(`No se encontró el archivo SQL en ninguna de estas rutas: ${candidatePaths.join(' | ')}`);
  }

  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  const withoutComments = sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  return withoutComments
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
};

const initDatabase = async () => {
  try {
    const statements = loadSqlStatements();

    if (!statements.length) {
      console.log('No se encontraron instrucciones SQL para inicializar la base de datos.');
      return;
    }

    for (const statement of statements) {
      await pool.query(statement);
    }

    console.log(`Base de datos inicializada correctamente desde ${sqlFilePath}`);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
    console.error('Revisa si la base está parcialmente creada o si la tabla rol todavía no existe.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

initDatabase();
