// src/lib/db.ts
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';

// Define a global variable to cache the database connection
// This is to avoid reconnecting on every hot reload in development
declare global {
  // eslint-disable-next-line no-var
  var dbInstance: Database<sqlite3.Database, sqlite3.Statement> | undefined;
}

const DB_FILE_NAME = 'budgetbuddy.db';

let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function getDbConnection() {
  if (process.env.NODE_ENV === 'development') {
    if (!global.dbInstance) {
      global.dbInstance = await open({
        filename: path.join(process.cwd(), DB_FILE_NAME),
        driver: sqlite3.Database,
      });
      console.log('New DB connection established (development).');
    }
    db = global.dbInstance;
  } else {
    // Production environment
    if (!db) {
      db = await open({
        filename: path.join(process.cwd(), DB_FILE_NAME), // Adjust path as needed for production deployment
        driver: sqlite3.Database,
      });
      console.log('New DB connection established (production).');
    }
  }
  return db;
}

// Optional: Function to close the database connection if needed (e.g., during app shutdown)
export async function closeDbConnection() {
  if (process.env.NODE_ENV === 'development') {
    if (global.dbInstance) {
      await global.dbInstance.close();
      global.dbInstance = undefined;
      console.log('DB connection closed (development).');
    }
  } else {
    if (db) {
      await db.close();
      // db = undefined; // Not strictly necessary if app is shutting down
      console.log('DB connection closed (production).');
    }
  }
}
