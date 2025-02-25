import { proxy, wrap } from 'comlink';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

import * as schema from '../../orm/schema';

// import Worker from './worker?worker';
import { Api, UploadInfo, Ready } from './worker';
import { eq } from 'drizzle-orm';

const getWorker = async () => {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, ...info } = await new Promise<Ready>((resolve) => {
    worker.onmessage = (event) => {
      const data = event.data as Ready;
      if (data.type === 'ready') {
        resolve(data);
      }
    };
  });
  const wrapped = wrap<Api>(worker);
  type Picked = Pick<typeof wrapped, keyof typeof wrapped & string>;
  const picked = wrapped as Picked;

  return { worker: picked, info };
};
const { worker, info } = await getWorker();

const getSqliteProxy = async (file: string) => {
  await worker.open(file);

  type DrizzleHandler = Parameters<typeof drizzle>[0];
  const sqliteProxy: DrizzleHandler = async (sql, params, method) => {
    const rows = await worker.exec(sql, params, method);

    return { rows };
  };

  return sqliteProxy;
};

export const getOrm = async () => {
  const path = '/db.sqlite';
  const badFiles = (await worker.ls()).filter((f) => f !== '/db.sqlite');
  for (const badFile of badFiles) {
    console.log(`Removing bad file ${badFile}`);
    await worker.remove(badFile);
  }
  if (!(await worker.exists(path))) {
    await worker.upload(`/torah-app/db${path}`, path);
  }
  const sqliteProxy = await getSqliteProxy('/db.sqlite');
  const db = drizzle<typeof schema>(sqliteProxy, { schema });

  type Fn = (...args: never[]) => unknown;

  const workerApi = {
    open: worker.open,
    close: worker.close,
    exec: worker.exec,
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

  return { db, schema, worker: workerApi, info };
};
