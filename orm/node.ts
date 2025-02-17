import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { spawnSync } from 'child_process';

import type { Database } from 'better-sqlite3';

import * as schema from './schema.ts';
import { existsSync } from 'node:fs';

const drizzlePath = new URL(import.meta.resolve('../drizzle')).pathname;
const configPath = new URL(import.meta.resolve('./drizzle-kit.ts')).pathname;

export const getDb = (sqlite: Database) => {
  const db = drizzle({ client: sqlite, schema });

  if (!existsSync(drizzlePath)) {
    spawnSync('npx', ['drizzle-kit', 'generate', `--config=${configPath}`], {
      stdio: 'inherit',
    });
  }

  try {
    // This fails on existing DBs since we removed the migrations table
    // We really only care about this for new DBs.
    migrate(db, { migrationsFolder: drizzlePath });
  } catch {
    // ignore
  }

  db.run(`DROP TABLE IF EXISTS __drizzle_migrations`);

  return db;
};
