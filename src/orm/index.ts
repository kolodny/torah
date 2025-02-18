import { proxy, wrap } from 'comlink';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

import * as schema from '../../orm/schema';

import Worker from './worker?worker';
import { Api, UploadInfo, Ready } from './worker';
import { eq } from 'drizzle-orm';

const getWorker = async () => {
  const worker = new Worker();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, ...info } = await new Promise<Ready>((resolve) => {
    worker.onmessage = (event) => {
      const data = event.data as Ready;
      if (data.type === 'ready') {
        resolve(data);
      }
    };
  });
  return { worker: wrap<Api>(worker), info };
};

const getSqliteProxy = async (file: string) => {
  const { worker, info } = await getWorker();

  await worker.open(file);

  type DrizzleHandler = Parameters<typeof drizzle>[0];
  const sqliteProxy: DrizzleHandler = async (sql, params, method) => {
    const rows = await worker.exec(sql, params, method);

    return { rows };
  };

  type Picked = Pick<typeof worker, keyof typeof worker & string>;

  return { sqliteProxy, worker: worker as Picked, info };
};

export const getOrm = async () => {
  const path = '/db.sqlite';
  const { worker: linked } = await getWorker();
  if (!(await linked.exists(path))) {
    await linked.upload(`/db${path}`, path);
  }
  const { sqliteProxy, worker, info } = await getSqliteProxy('/db.sqlite');
  const db = drizzle<typeof schema>(sqliteProxy, { schema });

  type Fn = (...args: never[]) => unknown;

  const workerApi = {
    ls: worker.ls,
    open: worker.open,
    close: worker.close,
    exec: worker.exec,
    exists: worker.exists,
    remove: worker.remove,
    merge: async (id: number, callback?: (info: UploadInfo) => void) => {
      const found = await db.query.content.findFirst({
        where: eq(schema.content.tocId, +id),
      });
      if (!found) {
        const path = `/db/toc_${id}.sqlite`;
        await worker.upload(
          path,
          path,
          callback ? proxy(callback as never) : undefined
        );
        await db.run(
          `
            ATTACH DATABASE '${path}' AS merge;
            INSERT OR IGNORE INTO content SELECT * FROM merge.content;
            INSERT OR IGNORE INTO links SELECT * FROM merge.links;
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
