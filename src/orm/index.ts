import { proxy, Remote, wrap } from 'comlink';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

import * as schema from '../../orm/schema';

import { Api, UploadInfo, Ready } from './worker';
import { eq } from 'drizzle-orm';

type Picked = Pick<Remote<Api>, keyof Remote<Api> & string>;

const channel = new BroadcastChannel('sqlite3_lock');

const getWorker = async () => {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module',
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, ...info } = await new Promise<Ready>((resolve, reject) => {
      worker.onmessage = (event) => {
        if (event.data.type === 'install-error') {
          reject();
        }
        const data = event.data as Ready;
        if (data.type === 'ready') {
          resolve(data);
        }
      };
    });
    const wrapped = wrap<Api>(worker);
    const picked = wrapped as Picked;

    return { worker: picked, terminate: () => worker.terminate(), info };
  } catch {
    console.log('error getting worker lock');
    worker.terminate();
    channel.postMessage({});
    await new Promise((r) => setTimeout(r, 1000));
    return getWorker();
  }
};

const getSqliteProxy = async (worker: Picked, file: string) => {
  await worker.open(file);

  type DrizzleHandler = Parameters<typeof drizzle>[0];
  const sqliteProxy: DrizzleHandler = async (sql, params, method) => {
    const rows = await worker.exec(sql, params, method);

    return { rows };
  };
  const readonlyProxy: DrizzleHandler = async (sql, params, method) => {
    const rows = await worker.readonlyExec(sql, params, method);

    return { rows };
  };

  return { sqliteProxy, readonlyProxy };
};

const getDb = async (worker: Picked) => {
  const path = '/db.sqlite';
  const badFiles = (await worker.ls()).filter((f) => f !== '/db.sqlite');
  for (const badFile of badFiles) {
    console.log(`Removing bad file ${badFile}`);
    await worker.remove(badFile);
  }
  if (!(await worker.exists(path))) {
    await worker.upload(`/torah-app/db${path}`, path);
  }
  const { sqliteProxy, readonlyProxy } = await getSqliteProxy(
    worker,
    '/db.sqlite'
  );
  const db = drizzle<typeof schema>(sqliteProxy, { schema });
  const dbReadonly = drizzle<typeof schema>(readonlyProxy, { schema });

  type Fn = (...args: never[]) => unknown;

  const workerApi = {
    open: worker.open,
    close: worker.close,
    exec: worker.exec,
    readonlyExec: worker.readonlyExec,
    exists: worker.exists,
    ls: worker.ls,
    wipe: worker.wipe,
    remove: worker.remove,
    merge: async (id: number, callback?: (info: UploadInfo) => void) => {
      const found = await db.query.content.findFirst({
        where: eq(schema.content.tocId, +id),
      });
      if (!found) {
        const path = `/db/toc_${id}.sqlite`;
        await worker.upload(
          `/torah-app${path}`,
          path,
          callback ? proxy(callback as never) : undefined
        );
        await db.run(
          `
            BEGIN TRANSACTION;
            ATTACH DATABASE '${path}' AS merge;
            INSERT OR IGNORE INTO content SELECT * FROM merge.content;
            INSERT OR IGNORE INTO links SELECT * FROM merge.links;
            INSERT OR IGNORE INTO meta SELECT * FROM merge.meta;
            COMMIT;
            DETACH DATABASE merge;
          `
        );

        await worker.remove(path);
      }
    },
    upload: async (
      ...[url, path, callback]: Parameters<typeof worker.upload>
    ) => {
      await worker.upload(url, path, callback ? proxy(callback) : undefined);
    },
  } satisfies Record<keyof typeof worker | 'merge', Fn>;

  return { db, dbReadonly, schema, worker: workerApi };
};

let cached: PromiseWithResolvers<never> = null!;
export const getOrm = async () => {
  if (cached) return cached.promise;

  cached = Promise.withResolvers<never>();
  channel.postMessage({});
  await new Promise((r) => setTimeout(r, 1000));
  const { worker, terminate, info } = await getWorker();
  channel.addEventListener(
    'message',
    () => {
      console.log(
        'sqlite3 usage detected in another tab, halting this session.'
      );
      cached = null!;
      terminate();
    },
    { once: true }
  );

  const { db, dbReadonly, worker: workerApi } = await getDb(worker);

  const returns = {
    db,
    dbReadonly,
    info,
    worker: workerApi,
    schema,
  };

  cached.resolve(returns as never);

  return cached.promise as Promise<typeof returns>;
};
