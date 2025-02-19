import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';

import { getOrm } from './orm/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouterAdapter } from './query-param-adapter';

const { db, schema, worker, info } = await getOrm();

export { db, schema, worker };

console.log('Running SQLite3 version', info.sqliteVersion);
if (info.opfs) console.log(`OPFS is available, using persisted databases`);
else console.log(`OPFS is not available, using transient databases`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const windowAny = window as any;
windowAny.db = db;
windowAny.go = (id: number) => {
  worker.merge(id, (info) => {
    console.log(info);
  });
};

console.log('toc', await db.select().from(schema.toc).limit(3));
console.log('content', await db.select().from(schema.content).limit(3));
console.log('links', await db.select().from(schema.links).limit(3));

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryParamProvider adapter={ReactRouterAdapter}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </QueryParamProvider>
    </BrowserRouter>
  </StrictMode>
);
