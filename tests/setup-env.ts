import fs from 'fs';
import os from 'os';
import path from 'path';

type TestGlobals = typeof globalThis & {
  __TEST_DB_DIR__?: string;
};

const globalWithDb = globalThis as TestGlobals;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-server-test-'));
globalWithDb.__TEST_DB_DIR__ = tmpDir;

const dbPath = path.join(tmpDir, 'test.sqlite');
fs.closeSync(fs.openSync(dbPath, 'w'));
process.env.SQLITE_DB_PATH = dbPath;
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'error';
