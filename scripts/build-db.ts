import { $ } from 'zx';
import _ from 'lodash';

import { basename, resolve } from 'node:path';

import { getDb } from '../orm/node.ts';
import * as schema from '../orm/schema.ts';

import Database from 'better-sqlite3';

const root = resolve(`${import.meta.dirname}/../`);
const tocPath = `${root}/otzaria-library/books lists/ספריא/table_of_contents.json`;

await $`mkdir ${root}/db`.catch(() => {});

import type { Toc, Content } from '../toc.ts';
import { MultiBar } from 'cli-progress';
import { sync } from 'glob';
import { readFileSync, statSync } from 'node:fs';
import { inArray } from 'drizzle-orm';

const sqlite = new Database(`${root}/db/master.sqlite`);
const db = getDb(sqlite);

const FORMAT =
  '[{bar}] {percentage}% | ETA: {eta}s elapsed {duration}s {message}';

const barStack = new MultiBar({ format: FORMAT });
const updater = _.throttle(() => barStack.update(), 100);
// const updater = () => barStack.update();

const GLOB = '*';
// const GLOB = '**בראשית**';

await buildToc();
await buildBooks();
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
    cb(values);
    values.length = 0;
  };

  return { insert, flush };
}

function reverseForTerminal(str: string) {
  return str.split('').reverse().join('');
}

async function buildToc() {
  const toc = JSON.parse(readFileSync(tocPath, 'utf8')) as Toc;

  const bar = barStack.create(toc.length, 0);
  bar.update({ message: 'Building toc' });
  // bar.start(toc.length, 0);
  const { insert, flush } = makeInsert<typeof schema.toc.$inferInsert>(
    (values) => {
      db.insert(schema.toc).values(values).run();
    }
  );

  const process = (content: Content, parentId: number | null = null) => {
    const value = {
      parentId,
      descriptionEnglish: 'enDesc' in content ? content.enDesc : null,
      descriptionHebrew: 'heDesc' in content ? content.heDesc : null,
      descriptionShortEnglish: content.enShortDesc,
      titleEnglish: 'title' in content ? content.title : null,
      titleHebrew: 'heTitle' in content ? content.heTitle : null,
      descriptionShortHebrew: content.heShortDesc,
      categories: 'categories' in content ? content.categories : null,
      mainOrder: 'order' in content ? content.order : null,
      categoryEnglish: 'category' in content ? content.category : null,
      categoryHebrew: 'heCategory' in content ? content.heCategory : null,
      completeEnglish: 'enComplete' in content ? content.enComplete : null,
      completeHebrew: 'heComplete' in content ? content.heComplete : null,
      baseTextOrder:
        'base_text_order' in content ? content.base_text_order : null,
      hidden: 'hidden' in content ? content.hidden : null,
      primaryCategory:
        'primary_category' in content ? content.primary_category : null,
      dependence: 'dependence' in content ? content.dependence : null,
      collectiveTitleEnglish:
        'collectiveTitle' in content ? content.collectiveTitle : null,
      collectiveTitleHebrew:
        'heCollectiveTitle' in content ? content.heCollectiveTitle : null,
      commentatorEnglish: 'commentator' in content ? content.commentator : null,
      commentatorHebrew:
        'heCommentator' in content ? content.heCommentator : null,
      corpus: 'corpus' in content ? content.corpus : null,
    } as typeof schema.toc.$inferInsert;

    if ('contents' in content) {
      const bigNextParentId = db
        .insert(schema.toc)
        .values(value)
        .run().lastInsertRowid;
      const nextParentId = bigNextParentId ? Number(bigNextParentId) : null;

      for (const subContent of content.contents) {
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
  const tocs = db
    .select({ id: schema.toc.id, title: schema.toc.titleHebrew })
    .from(schema.toc)
    .all();
  const titleToId = Object.fromEntries(tocs.map((toc) => [toc.title!, toc.id]));
  const files = sync(`${root}/otzaria-library/אוצריא/**/${GLOB}.txt`);
  const sizes = files.map((file) => statSync(file).size);
  let total = 0;
  for (const size of sizes) total += size;

  const { insert, flush } = makeInsert<typeof schema.content.$inferInsert>(
    (values) => db.insert(schema.content).values(values).run()
  );

  // console.log('Processing books');
  const bar = barStack.create(total, 0);
  bar.update({ message: 'Building books' });
  const idsWithContent: number[] = [];
  for (const [index, file] of Object.entries(files)) {
    const title = basename(file, '.txt');
    const data = readFileSync(file, 'utf-8');
    const actualTitle = data.match(/<h1>(.*)<\/h1>/)?.[1];
    const id = titleToId[actualTitle ?? title];
    if (!id) {
      const r1 = reverseForTerminal(actualTitle ?? '');
      const r2 = reverseForTerminal(title);
      barStack.log(`Could not find id for title: ${r1} or ${r2}\n`);
    } else {
      idsWithContent.push(id);
      const path = [];
      for (const [index, fullLine] of Object.entries(data.split('\n'))) {
        const line = fullLine.trim();
        const matcher = /^<h(?<level>\d)>(?<path>.*)<\/h\k<level>>$/;
        const heading = line.match(matcher)?.groups;
        if (heading) {
          path.length = +heading.level;
          path[heading.level] = heading.path;
        } else if (line) {
          insert({
            tocId: id,
            text: line,
            line: +index,
            sectionPath: path.filter(Boolean),
          });
        }
      }
    }

    bar.increment(sizes[index]);
    updater();
  }
  flush();

  db.update(schema.toc)
    .set({ hasContent: true })
    .where(inArray(schema.toc.id, idsWithContent))
    .run();

  bar.stop();
}

async function buildLinks() {
  const files = sync(`${root}/links/**/${GLOB}.json`);
  const sizes = files.map((file) => statSync(file).size);
  let total = 0;
  for (const size of sizes) total += size;

  const { insert, flush } = makeInsert<typeof schema.links.$inferInsert>(
    (values) => db.insert(schema.links).values(values).run()
  );

  const bar = barStack.create(total, 0, null, {
    format: `${FORMAT} {files}/{totalFiles} files    {processed}/{totalBytes} bytes`,
  });
  bar.update({
    message: 'Processing links',
    files: 0,
    totalFiles: files.length,
    processed: 0,
    totalBytes: total,
  });
  const subBar = barStack.create(100, 0);
  let processed = 0;

  for (const [index, file] of Object.entries(files)) {
    type Link = {
      line_index_1: number;
      heRef_2: string;
      path_2: string;
      line_index_2: number;
      'Conection Type': string;
    };

    const data: Link[] = JSON.parse(readFileSync(file, 'utf-8'));
    const base = reverseForTerminal(basename(file, '_links.json'));
    subBar.start(data.length, 0, { message: `Processing links for ${base}` });
    for (const link of data) {
      const type = link['Connection Type'] ?? link['Conection Type'];
      insert({
        fromId: link.line_index_1,
        fromLine: link.line_index_1,
        toId: link.line_index_2,
        toLine: link.line_index_2,
        connectionType: type,
      });
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
}
