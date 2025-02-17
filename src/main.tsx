import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';

import { getOrm } from './orm/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';

const { db, schema, worker } = await getOrm();

export { db, schema, worker };

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
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
