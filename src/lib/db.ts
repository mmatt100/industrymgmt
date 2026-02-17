import Database from 'better-sqlite3';
import { config } from './config';

type DatabaseInstance = InstanceType<typeof Database>;

let dbInstance: DatabaseInstance | null = null;

export const getDb = () => {
  if (!dbInstance) {
    dbInstance = new Database(config.SQLITE_DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT
      );
    `);
  }

  return dbInstance;
};

export const closeDb = async () => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};
