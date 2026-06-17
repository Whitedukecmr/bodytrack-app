const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'bodytrack',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'bodytrack',
});

pool.on('error', (err) => {
  console.error('Erreur pool PostgreSQL:', err.message);
});

module.exports = pool;
