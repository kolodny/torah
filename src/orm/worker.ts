import sqlite3InitModule, { Database, SqlValue } from '@sqlite.org/sqlite-wasm';
import { expose } from 'comlink';

if (typeof window !== 'undefined') {
  throw new Error('This file should only be run in a web worker');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).sqlite3ApiConfig = {
  warn: (...args: unknown[]) => {
    if (!`${args[0]}`.includes('Ignoring inability to install OPFS')) {
      console.warn(...args);
    }
  },
};

const sqlite3 = await sqlite3InitModule({
  print: console.log,
  printErr: console.error,
});

const sqliteVersion = sqlite3.version.libVersion;

const pool = await sqlite3.installOpfsSAHPoolVfs({}).catch((error) => {
  postMessage({ type: 'install-error' });
  throw error;
});

let db: Database | undefined = undefined;

export type UploadInfo = {
  total: number;
  processed: number;
};

const api = {
  open: (dbName: string) => {
    if (db) throw new Error('Database already open');
    db = new pool.OpfsSAHPoolDb(dbName);
  },
  close: () => {
    db!.close();
    db = undefined;
  },
  readonlyExec: (sql: string, params: SqlValue[], method: string) => {
    const pointer = db?.pointer;
    if (!pointer) throw new Error('No database open');
    const { SQLITE_READ, SQLITE_SELECT, SQLITE_OK, SQLITE_DENY } = sqlite3.capi;
    sqlite3.capi.sqlite3_set_authorizer(
      pointer,
      (_, code) => {
        const ok = code === SQLITE_READ || code === SQLITE_SELECT;
        if (ok) return SQLITE_OK;

        return SQLITE_DENY;
      },
      0
    );
    try {
      return api.exec(sql, params, method);
    } finally {
      sqlite3.capi.sqlite3_set_authorizer(pointer, () => SQLITE_OK, 0);
    }
  },
  exec: (sql: string, params: SqlValue[], method: string) => {
    if (!db) throw new Error('No database open');
    const rows: SqlValue[][] = [];
    const bind = params.length ? params : undefined;
    let callback: undefined | ((row: SqlValue[]) => void) = undefined;

    if (method === 'get') {
      callback = (row) => {
        rows.push(row);
        return false;
      };
    } else if (method === 'all') {
      callback = (row) => void rows.push(row);
    }
    db.exec({ sql, bind, callback });

    return method === 'get' ? rows[0] : rows;
  },
  exists: async (path: string) => pool.getFileNames().includes(path),
  ls: () => pool.getFileNames(),
  wipe: async () => {
    db?.close();
    db = undefined;
    pool.wipeFiles();
    pool.removeVfs();
  },
  remove: async (filePath: string) => pool.unlink(filePath),
  upload: async (
    url: string,
    localPath = url,
    progress?: (info: UploadInfo) => void
  ) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const reader = response.body?.getReader();
    const total = Number(response.headers.get('content-length') ?? 0);
    let processed = 0;

    await pool.importDb(localPath, async () => {
      const { done, value } = (await reader?.read()) ?? {};
      if (!value || done !== false) return;
      processed += value.length;
      progress?.({ total, processed });
      return value;
    });
  },
};

expose(api);

const ready = { type: 'ready', sqliteVersion };
export type Ready = typeof ready;
postMessage(ready);

export type Api = typeof api;
