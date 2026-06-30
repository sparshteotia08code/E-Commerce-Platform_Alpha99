const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelizeInstance = null;

const initDatabase = async () => {
  if (sequelizeInstance) return sequelizeInstance;

  const dbDialect = process.env.DB_DIALECT || 'postgres';

  if (dbDialect === 'postgres' && process.env.DB_HOST) {
    console.log(`[Database] Attempting connection to PostgreSQL at ${process.env.DB_HOST}...`);
    sequelizeInstance = new Sequelize(
      process.env.DB_NAME || 'alpha_db',
      process.env.DB_USER || 'alpha_user',
      process.env.DB_PASSWORD || 'alpha_password',
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 5000, // Timeout after 5s to trigger fallback quickly if offline
          idle: 10000
        }
      }
    );

    try {
      await sequelizeInstance.authenticate();
      console.log('[Database] PostgreSQL connection established successfully.');
      return sequelizeInstance;
    } catch (err) {
      console.warn(`[Database] PostgreSQL connection failed: ${err.message}. Falling back to SQLite...`);
    }
  }

  // SQLite fallback
  const storagePath = path.join(__dirname, '../../db.sqlite');
  console.log(`[Database] Initializing SQLite file-based database at: ${storagePath}`);
  sequelizeInstance = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });

  try {
    await sequelizeInstance.authenticate();
    console.log('[Database] SQLite connection established successfully.');
  } catch (err) {
    console.error('[Database] Failed to initialize SQLite database:', err);
    throw err;
  }

  return sequelizeInstance;
};

const getSequelize = () => {
  if (!sequelizeInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return sequelizeInstance;
};

module.exports = {
  initDatabase,
  getSequelize
};
