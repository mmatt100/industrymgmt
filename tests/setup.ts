import fs from 'fs';
import { getDb } from '../src/lib/db';

type TestGlobals = typeof globalThis & {
  __TEST_DB_DIR__?: string;
};

const globalWithDb = globalThis as TestGlobals;

beforeEach(() => {
  const db = getDb();
  db.exec('DELETE FROM contacts;');
});

afterAll(() => {
  const dir = globalWithDb.__TEST_DB_DIR__;
  if (dir) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
