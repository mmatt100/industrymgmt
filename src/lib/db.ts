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

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price INTEGER NOT NULL CHECK(price > 0),
        stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
        category TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL CHECK(location IN ('US', 'Europe', 'Asia'))
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        total_price INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        discount_applied REAL NOT NULL DEFAULT 0,
        line_total INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        discount_percent INTEGER NOT NULL CHECK(discount_percent > 0 AND discount_percent <= 100),
        categories TEXT NOT NULL
      );

      INSERT OR IGNORE INTO customers (id, name, location) VALUES
        (1, 'Alice', 'US'),
        (2, 'Bob', 'Europe'),
        (3, 'Charlie', 'Asia');

      INSERT OR IGNORE INTO holidays (date, name, discount_percent, categories) VALUES
        ('2026-01-01', 'New Year''s Day', 15, '["electronics","clothing"]'),
        ('2026-01-06', 'Epiphany', 15, '["electronics","clothing"]'),
        ('2026-04-05', 'Easter Sunday', 15, '["electronics","clothing"]'),
        ('2026-04-06', 'Easter Monday', 15, '["electronics","clothing"]'),
        ('2026-05-01', 'Labour Day', 15, '["electronics","clothing"]'),
        ('2026-05-03', 'Constitution Day', 15, '["electronics","clothing"]'),
        ('2026-05-24', 'Whitsunday', 15, '["electronics","clothing"]'),
        ('2026-06-04', 'Corpus Christi', 15, '["electronics","clothing"]'),
        ('2026-08-15', 'Assumption of Mary', 15, '["electronics","clothing"]'),
        ('2026-11-01', 'All Saints'' Day', 15, '["electronics","clothing"]'),
        ('2026-11-11', 'Independence Day', 15, '["electronics","clothing"]'),
        ('2026-11-27', 'Black Friday', 25, '*'),
        ('2026-12-25', 'Christmas Day', 15, '["electronics","clothing"]'),
        ('2026-12-26', 'Second Day of Christmas', 15, '["electronics","clothing"]');
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
