import { getDb } from '../../lib/db';

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt: string;
};

export type CreateProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
};

type DecreaseStockResult =
  | { status: 'updated'; product: Product }
  | { status: 'not_found' }
  | { status: 'insufficient'; available: number };

const COLUMNS = 'id, name, description, price, stock, category, created_at AS createdAt';

const listProducts = async (): Promise<Product[]> => {
  const db = getDb();
  return db
    .prepare(`SELECT ${COLUMNS} FROM products ORDER BY id ASC`)
    .all() as Product[];
};

const getProductById = async (id: number): Promise<Product | null> => {
  const db = getDb();
  const row = db
    .prepare(`SELECT ${COLUMNS} FROM products WHERE id = ?`)
    .get(id) as Product | undefined;
  return row ?? null;
};

const createProduct = async (
  input: CreateProductInput,
): Promise<Product | null> => {
  const db = getDb();
  const result = db
    .prepare(
      'INSERT INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)',
    )
    .run(input.name, input.description, input.price, input.stock, input.category);

  const id = Number(result.lastInsertRowid);
  const row = db
    .prepare(`SELECT ${COLUMNS} FROM products WHERE id = ?`)
    .get(id) as Product | undefined;

  return row ?? null;
};

const updateStock = async (
  id: number,
  newStock: number,
): Promise<Product | null> => {
  const db = getDb();
  const result = db
    .prepare('UPDATE products SET stock = ? WHERE id = ?')
    .run(newStock, id);

  if (result.changes === 0) {
    return null;
  }

  const row = db
    .prepare(`SELECT ${COLUMNS} FROM products WHERE id = ?`)
    .get(id) as Product | undefined;

  return row ?? null;
};

const increaseStock = async (
  id: number,
  quantity: number,
): Promise<Product | null> => {
  const db = getDb();
  const result = db
    .prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
    .run(quantity, id);

  if (result.changes === 0) {
    return null;
  }

  const row = db
    .prepare(`SELECT ${COLUMNS} FROM products WHERE id = ?`)
    .get(id) as Product | undefined;

  return row ?? null;
};

const decreaseStock = async (
  id: number,
  quantity: number,
): Promise<DecreaseStockResult> => {
  const db = getDb();
  const result = db
    .prepare(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
    )
    .run(quantity, id, quantity);

  if (result.changes > 0) {
    const row = db
      .prepare(`SELECT ${COLUMNS} FROM products WHERE id = ?`)
      .get(id) as Product | undefined;
    if (!row) {
      return { status: 'not_found' };
    }
    return { status: 'updated', product: row };
  }

  const stockRow = db
    .prepare('SELECT stock FROM products WHERE id = ?')
    .get(id) as { stock: number } | undefined;

  if (!stockRow) {
    return { status: 'not_found' };
  }

  return { status: 'insufficient', available: stockRow.stock };
};

const deductStock = (id: number, quantity: number): number => {
  const db = getDb();
  const result = db
    .prepare(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
    )
    .run(quantity, id, quantity);
  return result.changes;
};

export const productRepository = {
  listProducts,
  getProductById,
  createProduct,
  updateStock,
  increaseStock,
  decreaseStock,
  deductStock,
};
