import './env.js';
import mysql from 'mysql2/promise';

const mode = process.env.DB_MODE || (process.env.DB_HOST ? 'mysql' : 'demo');
export const isMysql = mode === 'mysql';

export const pool = isMysql
  ? mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || 'pure_aqua',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
      dateStrings: false,
      enableKeepAlive: true,
    })
  : null;

export async function checkDatabase() {
  if (!pool) return { mode: 'demo' };
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
  return { mode: 'mysql' };
}
