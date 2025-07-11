// scripts/init-db.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const DB_FILE_NAME = 'budgetbuddy.db';

async function initializeDatabase() {
  let db;
  try {
    console.log(`Attempting to open/create database at: ${path.join(process.cwd(), DB_FILE_NAME)}`);
    db = await open({
      filename: path.join(process.cwd(), DB_FILE_NAME),
      driver: sqlite3.Database,
    });

    console.log('Database connected.');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
    `);

    console.log('Table "transactions" created or already exists.');

    // You can add more initialization logic here, like creating indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_userId_date ON transactions (userId, date);`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);`);
    console.log('Indexes created or already exist.');

  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1); // Exit with error code
  } finally {
    if (db) {
      await db.close();
      console.log('Database connection closed.');
    }
  }
}

initializeDatabase()
  .then(() => {
    console.log('Database initialization complete.');
    process.exit(0); // Exit successfully
  })
  .catch((err) => {
    console.error('Unhandled error during database initialization:', err);
    process.exit(1);
  });
