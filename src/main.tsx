import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { App } from './app';

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouterAdapter } from './query-param-adapter';
import { getOrm } from './orm';

const { db, dbReadonly, info, worker } = await getOrm();

console.log('Running SQLite3 version', info.sqliteVersion);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const windowAny = window as any;
windowAny.db = db;
windowAny.dbReadonly = dbReadonly;
windowAny.go = (id: number) => {
  worker.merge(id, (info) => {
    console.log(info);
  });
};
windowAny.wipe = () => worker.wipe();
windowAny.list = () => worker.ls();

const queryCache = new QueryCache();
queryCache.subscribe((event) => {
  // const timeKey = `Query ${event.query.queryKey}`;
  // if (timeKey === 'Query grouped') return;
  // console.log(timeKey, event.type, event);
  if (event.type === 'added') {
    // console.time(timeKey);
  } else if (event.type === 'updated' && event.action.type !== 'invalidate') {
    // console.time(timeKey);
  } else if (
    event.type === 'observerResultsUpdated' &&
    event.query.state.status !== 'pending'
  ) {
    // console.timeEnd(timeKey);
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
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
          <CssBaseline />
          <App />
        </QueryClientProvider>
      </QueryParamProvider>
    </BrowserRouter>
  </StrictMode>
);
