import fs from 'node:fs';
import path from 'node:path';
import pool from './config/database.js';

const sqlFilePath = path.resolve(process.cwd(), '../setup_database.sql');

const loadSqlStatements = () => {
  const sql = fs.readFileSync(sqlFilePath, 'utf8');

  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement && !statement.startsWith('--'));
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
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

initDatabase();
