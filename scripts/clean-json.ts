import { sync } from 'glob';
import { Bar } from 'cli-progress';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(`${import.meta.dirname}/../`);

const files = sync(`${root}/otzaria-library/**/*.json`);

const bar = new Bar({});
bar.start(files.length, 0);
for (const file of files) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  writeFileSync(file, JSON.stringify(data, null, 2));
  bar.increment();
}
bar.stop();
