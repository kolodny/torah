import { $ } from 'zx';
import _ from 'lodash';

import { basename, resolve } from 'node:path';

import { getDb } from '../orm/node.ts';
import * as schema from '../orm/schema.ts';

import Database from 'better-sqlite3';
import { parse } from '@fast-csv/parse';

const root = resolve(`${import.meta.dirname}/../`);
const tocPath = `${root}/Sefaria-Export/table_of_contents.json`;

await $`mkdir ${root}/db`.catch(() => {});
await $`rm -rf ${root}/drizzle`.catch(() => {});
await $`rm -rf ${root}/db/master.sqlite`.catch(() => {});

import { MultiBar } from 'cli-progress';
import { sync } from 'glob';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { inArray } from 'drizzle-orm';
import type { Content, Toc } from '../types/toc.ts';
import type { Meta } from '../types/meta.ts';

import { skips } from './skips.ts';
import {
  contentDir,
  badRefsLocation,
  linkFiles,
  organize,
  metaByTitle,
} from './organize-sefaria.ts';

import type { ContentFile } from './organize-sefaria.ts';
import { readJson } from './utils.ts';

const sqlite = new Database(`${root}/db/master.sqlite`);
const db = getDb(sqlite);

const FORMAT =
  '[{bar}] {percentage}% | ETA: {eta}s elapsed {duration}s {message}';

const barStack = new MultiBar({ format: FORMAT });
const updater = _.throttle(() => barStack.update(), 100);

const logged = new Set<string>();
const log = (message: string) => {
  if (!logged.has(message)) {
    barStack.log(message);
    logged.add(message);
  }
};

console.time('organizing');
await organize();
console.timeEnd('organizing');

await buildToc();
const tocs = db
  .select({ id: schema.toc.id, title: schema.toc.titleEnglish })
  .from(schema.toc)
  .all();
const titleToId = Object.fromEntries(
  tocs.map((toc) => [toc.title?.toLowerCase(), toc.id])
);
await buildBooks();
await buildSchema();
await buildLinks();

updater.flush();
barStack.update();
barStack.stop();

function makeInsert<Insert>(cb: (values: Insert[]) => void) {
  const values: Insert[] = [];
  const insert = (value: Insert) => {
    values.push(value);
    if (values.length === 100) flush();
  };
  const flush = () => {
    if (values.length) cb(values);
    values.length = 0;
  };

  return { insert, flush };
}

async function buildToc() {
  const toc = readJson<Toc[]>(tocPath)!;

  const bar = barStack.create(toc.length, 0);
  bar.update({ message: 'Building toc' });
  // bar.start(toc.length, 0);
  type TocInsert = typeof schema.toc.$inferInsert;
  const { insert, flush } = makeInsert<TocInsert>((values) => {
    db.insert(schema.toc).values(values).run();
  });

  const process = (content: Content, parentId: number | null = null) => {
    const title = content.title ?? content.category;

    const meta: Meta = metaByTitle[title?.toLowerCase() ?? ''];
    const skip = skips.has(title ?? '');

    // const meta = metadata[title!];
    const value: TocInsert = {
      parentId,
      descriptionEnglish: content.enDesc,
      descriptionHebrew: content.heDesc,
      descriptionShortEnglish: content.enShortDesc,
      titleEnglish: content.title,
      titleHebrew: content.heTitle,
      sectionNames: meta?.sectionNames,
      authorEnglish: meta?.authors?.[0]?.en,
      authorHebrew: meta?.authors?.[0]?.he,
      publishedDate: meta?.pubDateString?.en,
      publishedPlace: meta?.pubPlace,
      composedDate: meta?.compDateString?.en,
      composedPlace: meta?.compPlaceString?.en,
      descriptionShortHebrew: content.heShortDesc,
      categories: content.categories,
      mainOrder: content.order,
      categoryEnglish: content.category,
      categoryHebrew: content.heCategory,
      completeEnglish: content.enComplete,
      completeHebrew: content.heComplete,
      baseTextOrder: content.base_text_order,
      hidden: content.hidden,
      primaryCategory: content.primary_category,
      dependence: content.dependence,
      collectiveTitleEnglish: content.collectiveTitle,
      collectiveTitleHebrew: content.heCollectiveTitle,
      commentatorEnglish: content.commentator,
      commentatorHebrew: content.heCommentator,
      corpus: content.corpus,
      skip,
    };

    if ('contents' in content) {
      const bigNextParentId = db
        .insert(schema.toc)
        .values(value)
        .run().lastInsertRowid;
      const nextParentId = bigNextParentId ? Number(bigNextParentId) : null;

      for (const subContent of content.contents ?? []) {
        process(subContent, nextParentId);
      }
    } else {
      insert(value);
    }
  };

  for (const content of toc) {
    for (const subContent of content.contents) {
      process(subContent);
    }
    bar.increment();
    updater();
  }
  flush();
  bar.stop();
}

async function buildBooks() {
  const files = sync(`${contentDir}/*.json`);
  const sizes = files.map((file) => statSync(file).size);
  let total = 0;
  for (const size of sizes) if (size) total += size;

  const { insert, flush } = makeInsert<typeof schema.content.$inferInsert>(
    (values) => db.insert(schema.content).values(values).run()
  );

  // console.log('Processing books');
  const bar = barStack.create(total, 0);
  bar.update({ message: 'Building books' });
  const idsWithContent = new Set<number>();

  for (const [fileIndex, file] of Object.entries(files)) {
    const isEnglish = file.endsWith('_english.json');
    const book = readJson<ContentFile>(file)!;
    const tocId = titleToId[book.title.toLowerCase()];
    if (!tocId) {
      if (!skips.has(book.title)) log(`Error: ${book.title} not found\n`);
      continue;
    }
    const entries = Object.entries(book.content);
    if (!entries.length) {
      log(`Error: ${book.title} has no content\n`);
      continue;
    }

    for (const [ref, text] of Object.entries(book.content)) {
      if (typeof text === 'string') {
        idsWithContent.add(tocId);
        insert({
          tocId,
          ref,
          isEnglish,
          text,
        });
      }
    }

    bar.increment(sizes[fileIndex]);
    updater();
  }
  flush();

  db.update(schema.toc)
    .set({ hasContent: true })
    .where(inArray(schema.toc.id, [...idsWithContent]))
    .run();

  bar.stop();
}

async function buildSchema() {
  type Insert = typeof schema.meta.$inferInsert;
  const { insert, flush } = makeInsert<Insert>((values) => {
    db.insert(schema.meta).values(values).run();
  });

  for (const schema of Object.values(metaByTitle)) {
    const title = schema?.title.toLowerCase();
    const tocId = titleToId[title!];
    if (tocId) {
      insert({ tocId, schema });
    }
  }
  flush();
}

async function buildLinks() {
  const sizes = linkFiles.map((file) => statSync(file).size);
  let total = 0;
  for (const size of sizes) total += size;

  const { insert, flush } = makeInsert<typeof schema.links.$inferInsert>(
    (values) =>
      db.insert(schema.links).values(values).onConflictDoNothing().run()
  );

  const bar = barStack.create(total, 0, null, {
    format: `${FORMAT} {files}/{totalFiles} files    {processed}/{totalBytes} bytes`,
  });
  bar.update({
    message: 'Processing links',
    files: 0,
    totalFiles: linkFiles.length,
    processed: 0,
    totalBytes: total,
  });
  const subBar = barStack.create(100, 0);
  let processed = 0;
  let missingTitle = 0;

  for (const [index, file] of Object.entries(linkFiles)) {
    const totalLinks = readFileSync(file, 'utf8').split('\n').length;

    subBar.start(totalLinks, 0, {
      message: `Processing links for ${basename(file)}`,
    });

    const badRefs = readJson<Record<string, string[]>>(badRefsLocation);

    const split = (citation: string) => {
      const parts = citation.split(/( |(?:, ))/);
      for (let stop = parts.length; stop > 0; stop -= 2) {
        const work = parts.slice(0, stop).join('');
        if (skips.has(work)) return;
        const tocId = titleToId[work.toLowerCase()];
        if (tocId) {
          const ref = parts.slice(stop + 1).join('');
          const isBadRef = badRefs?.[work]?.includes(ref);
          if (isBadRef) return;

          return { tocId, ref };
        }
      }

      missingTitle++;
    };

    const stream = createReadStream(file).pipe(parse({ headers: true }));
    for await (const row of stream) {
      const citation1 = split(row['Citation 1']);
      const citation2 = split(row['Citation 2']);
      if (citation1 && citation2) {
        insert(
          schema.sortLinkRow({
            fromId: citation1.tocId,
            fromRef: citation1.ref,
            toId: citation2.tocId,
            toRef: citation2.ref,
            connectionType: row['Conection Type'],
          })
        );
      }
      subBar.increment();
      updater();
    }

    processed += sizes[index];
    const processedFiles = +index + 1;
    bar.update(processed, { files: processedFiles, processed });

    updater();
  }
  flush();
  bar.stop();
  log(`Titles not found for ${missingTitle} links\n`);
}
