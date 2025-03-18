import { $ } from 'zx';
import _ from 'lodash';

import { eq, isNotNull, or, sql } from 'drizzle-orm';

import { resolve } from 'node:path';

import { getDb } from '../orm/node.ts';
import * as schema from '../orm/schema.ts';

import Database from 'better-sqlite3';
import { MultiBar } from 'cli-progress';
import { statSync } from 'node:fs';

const root = resolve(`${import.meta.dirname}/../`);
await $`rm -rf ${root}/public/db`.catch(() => {});
await $`mkdir ${root}/public/db`.catch(() => {});

const sqlite = new Database(`${root}/db/master.sqlite`);
const db = getDb(sqlite);

const barStack = new MultiBar({});
const updater = _.throttle(() => barStack.update(), 100);

let current = '';

await sliceDb();
await createTocSlice();

async function createTocSlice() {
  const tocSqlite = new Database(`${root}/public/db/db.sqlite`);
  const tocs = getDb(tocSqlite);

  const tocSlice = db.select().from(schema.toc);

  const tocInsert = makeInsert<typeof schema.toc.$inferInsert>((values) =>
    tocs.insert(schema.toc).values(values).run()
  );

  for (const toc of await tocSlice) tocInsert.insert(toc);
  tocInsert.flush();
}

async function sliceDb() {
  const tocs = Object.fromEntries(
    Object.entries(
      await db
        .select({ id: schema.toc.id, title: schema.toc.titleEnglish })
        .from(schema.toc)
        .where(isNotNull(schema.toc.titleEnglish))
    ).map(([, { id, title }]) => [id, title])
  );

  const contents = db
    .select({ tocId: schema.content.tocId, count: sql`COUNT(*)` })
    .from(schema.content)
    .groupBy(schema.content.tocId)
    .all()
    .map((row) => ({ ...row, name: tocs[row.tocId!] }));

  const links = db
    .select({ tocId: schema.links.fromId, count: sql`COUNT(*)` })
    .from(schema.links)
    .groupBy(schema.links.fromId)
    .all()
    .map((row) => ({ ...row, name: tocs[row.tocId!] }));

  let total = 0;
  for (const row of contents) {
    if (tocs[row.tocId!]) total += +row.count!;
  }
  for (const row of links) {
    if (tocs[row.tocId!]) total += +row.count!;
  }
  const bar = barStack.create(total, 0);

  for (const [toc, title] of Object.entries(tocs)) {
    if (title) await sliceTitle({ id: +toc, title });
    const processed =
      +(contents.find((row) => row.tocId === +toc)?.count ?? 0) +
      +(links.find((row) => row.tocId === +toc)?.count ?? 0);
    bar.increment(processed);
    updater();
  }
  updater.flush();
  bar.stop();

  barStack.stop();
}

async function sliceTitle({ id, title }: { id: number; title: string }) {
  current = `${id} - ${title}`;
  const dbPath = `${root}/public/db/toc_${id}.sqlite`;
  const slicedSqlite = new Database(dbPath);
  const sliced = getDb(slicedSqlite);

  const contentSlice = await db
    .select()
    .from(schema.content)
    .where(eq(schema.content.tocId, id));

  const contentInsert = makeInsert<typeof schema.content.$inferInsert>(
    (values) => sliced.insert(schema.content).values(values).run()
  );

  for (const content of contentSlice) contentInsert.insert(content);

  contentInsert.flush();

  const linkSlice = db
    .select()
    .from(schema.links)
    .where(or(eq(schema.links.fromId, id), eq(schema.links.toId, id)));

  const linkInsert = makeInsert<typeof schema.links.$inferInsert>((values) =>
    sliced.insert(schema.links).values(values).run()
  );

  for (const link of await linkSlice) linkInsert.insert(link);

  linkInsert.flush();

  const minSchemaSlice = await db
    .select()
    .from(schema.meta)
    .where(eq(schema.meta.tocId, id));

  const minSchemaInsert = makeInsert<typeof schema.meta.$inferInsert>(
    (values) => sliced.insert(schema.meta).values(values).run()
  );

  for (const content of minSchemaSlice) minSchemaInsert.insert(content);

  minSchemaInsert.flush();

  slicedSqlite.close();

  const fileSize = statSync(dbPath).size;
  const contentEntries = contentSlice.length;
  const setting = { fileSize, contentEntries };

  db.update(schema.toc).set(setting).where(eq(schema.toc.id, id)).run();
}

function makeInsert<Insert>(cb: (values: Insert[]) => void) {
  const values: Insert[] = [];
  let hasValues = false;
  const insert = (value: Insert) => {
    hasValues = true;
    values.push(value);
    if (values.length === 100) flush();
  };
  const flush = () => {
    if (!hasValues) barStack.log(`No values to flush for ${current}\n`);
    if (values.length) cb(values);
    values.length = 0;
  };

  return { insert, flush };
}
