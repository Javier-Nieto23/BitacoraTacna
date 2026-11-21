import fs from 'node:fs';
import path from 'node:path';
import pool from './config/database.js';

const sqlFilePath = path.resolve(process.cwd(), '../setup_database.sql');

const loadSqlStatements = () => {
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
