import sqlite3InitModule, { Database, SqlValue } from '@sqlite.org/sqlite-wasm';
import { expose } from 'comlink';

const sqlite3 = await sqlite3InitModule({
  print: console.log,
  printErr: console.error,
});

const opfs = 'opfs' in sqlite3;
const sqliteVersion = sqlite3.version.libVersion;

const Db = sqlite3.oo1[opfs ? 'OpfsDb' : 'DB'];

let db: Database | undefined = undefined;

const getDir = async (path: string) => {
  const parts = path.split('/').slice(1);
  const fileName = parts.pop()!;
  let dir = await navigator.storage.getDirectory();
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  return { dir, fileName };
};

export type UploadInfo = {
  total: number;
  processed: number;
};

const api = {
  open: (dbName: string) => {
    if (db) throw new Error('Database already open');
    db = new Db(dbName);
  },
  close: () => {
    db!.close();
    db = undefined;
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
  exists: async (path: string) => {
    try {
      const { dir, fileName } = await getDir(path);
      if (fileName) await dir.getFileHandle(fileName);

      return true;
    } catch {
      return false;
    }
  },
  ls: async (path: string) => {
    const { dir } = await getDir(path);
    const entries: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const entry of (dir as any).keys()) {
      entries.push(entry);
    }

    return entries;
  },
  remove: async (filePath: string) => {
    const { dir, fileName } = await getDir(filePath);
    await dir.removeEntry(fileName);
  },
  upload: async (
    url: string,
    localPath = url,
    progress?: (info: UploadInfo) => void
  ) => {
    const { dir, fileName } = await getDir(localPath);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const reader = response.body?.getReader();
    const total = Number(response.headers.get('content-length') ?? 0);
    let processed = 0;

    const file = await dir.getFileHandle(fileName, { create: true });
    const writable = await file.createWritable();

    while (true) {
      const { done, value } = (await reader?.read()) ?? {};
      if (!value || done !== false) break;
      await writable.write(value);
      processed += value.length;
      progress?.({ total, processed });
    }

    await writable.close();
  },
};

expose(api);

const ready = { type: 'ready', sqliteVersion, opfs };
export type Ready = typeof ready;
postMessage(ready);

export type Api = typeof api;
