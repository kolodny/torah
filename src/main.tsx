import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';

import { getOrm } from './orm/index';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouterAdapter } from './query-param-adapter';

const { db, schema, worker, info } = await getOrm();

export { db, schema, worker };

console.log('Running SQLite3 version', info.sqliteVersion);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const windowAny = window as any;
windowAny.db = db;
windowAny.go = (id: number) => {
  worker.merge(id, (info) => {
    console.log(info);
  });
};
windowAny.wipe = () => worker.wipe();
windowAny.list = () => worker.ls();

const queryCache = new QueryCache();
queryCache.subscribe((event) => {
  if (event.type === 'added') {
    console.time(`Query ${event.query.queryKey}`);
  } else if (
    event.type === 'observerResultsUpdated' &&
    event.query.state.status !== 'pending'
  ) {
    console.timeEnd(`Query ${event.query.queryKey}`);
  }
});
const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 0,
    },
  },
});

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
