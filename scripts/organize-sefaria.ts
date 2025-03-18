/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolve } from 'path';
import { writeFileSync, createReadStream, mkdirSync } from 'fs';
import { parse } from '@fast-csv/parse';
import { sync } from 'glob';
import {
  createRefPath,
  extractMinimalSchema,
  readJson,
  writeJson,
} from './utils.ts';
import { skips } from './skips.ts';

type RefFile = { title: string; refs: string[] };
export type ContentFile = { title: string; content: Record<string, string> };

const sefaria = resolve(`${import.meta.dirname}/../Sefaria-Export/`);

export const linkFiles = sync(`${sefaria}/links/links[0-9]*.csv`);

const merged = sync(`${sefaria}/json/**/merged.json`);

const organizedDir = resolve(`${import.meta.dirname}/../organized`);
const refsByTitleDir = `${organizedDir}/refs`;
const linksByTitleDir = `${organizedDir}/links`;
export const schemasDir = `${organizedDir}/schemas`;
export const contentDir = `${organizedDir}/content`;
export const badRefsLocation = `${organizedDir}/bad-refs.json`;

// Build schema cache
console.time('\nbuilding schema cache');
export const metaByTitle: Record<string, any> = {};
for (const file of sync(`${sefaria}/schemas/*.json`)) {
  const json = readJson<any>(file);
  if (!json?.title) continue;
  metaByTitle[json.title?.toLowerCase()] = json;

  const minimalSchema = extractMinimalSchema(json.schema);
  writeJson(`${schemasDir}/${json.title}.json`, minimalSchema);
}
console.timeEnd('\nbuilding schema cache');
const base = (file: string) => file.split('/').pop()?.split('.')[0];

export const organize = async () => {
  mkdirSync(refsByTitleDir, { recursive: true });
  mkdirSync(linksByTitleDir, { recursive: true });
  mkdirSync(schemasDir, { recursive: true });
  mkdirSync(contentDir, { recursive: true });

  // Build up index of all refs by title
  console.time('\norganizing refs by title');
  organizeTitleRefs();
  console.timeEnd('\norganizing refs by title');
  console.log();

  // Build up index of all links by title
  console.time('\ngrouping links by title');
  await groupLinksByTitle();
  console.timeEnd('\ngrouping links by title');
  console.log();

  // Check that title links are valid
  console.time('\nchecking title links');
  checkTitleLinks();
  console.timeEnd('\nchecking title links');
  console.log();
};

if (base(process.argv[1]) === base(import.meta.url)) {
  await organize();
}

// #region Functions

function organizeTitleRefs() {
  console.log(`Organizing ${merged.length} texts by title`);
  let index = 0;

  for (const file of merged) {
    if (++index % 1000 === 0) console.log(`Processed ${index} texts`);
    const { title, text } = readJson<any>(file)!;

    const schema = metaByTitle[title.toLowerCase()]?.schema;
    if (!schema) {
      console.log(`No schema for ${title}`);
      continue;
    }

    const location = `${refsByTitleDir}/${title}.json`;
    const refsFile = readJson<RefFile>(location) || { title, refs: [] };
    const contents: ContentFile = { title, content: {} };

    const allRefs = new Set<string>(refsFile.refs);
    const process = (section: any, path: string[] = []) => {
      if (Array.isArray(section)) {
        for (const [index, item] of Object.entries(section)) {
          process(item, [...path, `${index}`]);
        }
      } else if (typeof section === 'object') {
        for (const [key, value] of Object.entries(section)) {
          process(value, [...path, key]);
        }
      } else {
        const refPath = createRefPath(schema, path);
        allRefs.add(refPath);
        contents.content[refPath] = section;
      }
    };

    process(text);

    const language = file.includes('/English/') ? 'English' : 'Hebrew';
    const flattenedFile = `${contentDir}/${title}_${language}.json`;
    writeJson(flattenedFile, contents);

    const updateFile: RefFile = { title, refs: Array.from(allRefs) };
    writeJson(location, updateFile);
  }
}

async function groupLinksByTitle() {
  const linksByTitle: Record<string, string[]> = {};
  for (const file of linkFiles) {
    console.log(`Processing ${file}`);
    const stream = createReadStream(file).pipe(parse({ headers: true }));
    for await (const row of stream) {
      processCitation(row[`Citation 1`], linksByTitle);
      processCitation(row[`Citation 2`], linksByTitle);
    }
  }
  for (const [title, refs] of Object.entries(linksByTitle)) {
    const uniqueRefs = Array.from(new Set(refs));
    writeJson(`${linksByTitleDir}/${title}.json`, { title, refs: uniqueRefs });
  }
}

function processCitation(
  citation: string,
  linksByTitle: Record<string, string[]>
) {
  const parts = citation.split(/( |(?:, ))/);
  for (let stop = parts.length; stop > 0; stop -= 2) {
    const work = parts.slice(0, stop).join('');
    if (metaByTitle[work.toLowerCase()]) {
      const ref = parts.slice(stop + 1).join('');
      linksByTitle[work] = linksByTitle[work] || [];
      linksByTitle[work].push(ref);
      return;
    }
  }

  console.log(`No title found for ${citation}`);
}

function checkTitleLinks() {
  const linkFiles = sync(`${linksByTitleDir}/*.json`);
  const badRefsByTitle: Record<string, string[]> = {};
  console.log(`Checking ${linkFiles.length} texts for bad links`);
  let index = 0;

  const noRefs: string[] = [];

  for (const file of linkFiles) {
    if (++index % 1000 === 0) {
      const found = Object.values(badRefsByTitle).flat().length;
      console.log(`Checked ${index} texts, found ${found} bad refs so far`);
    }
    const { title, refs: links } = readJson<RefFile>(file)!;

    if (skips.has(title)) continue;

    const refsByTitleLocation = `${refsByTitleDir}/${title}.json`;
    const refsFile = readJson<RefFile>(refsByTitleLocation)!;
    if (!refsFile) {
      noRefs.push(title);
      // console.log(`No link refs found for ${title}`);
      continue;
    }

    const allRefs = new Set(refsFile.refs);

    for (const link of links) {
      const firstRange = link.split('-')[0];
      let found = false;
      found ||= allRefs.has(link);
      found ||= allRefs.has(firstRange);
      found ||= [...allRefs].some((ref) => ref.startsWith(firstRange));
      if (!found) {
        badRefsByTitle[title] = badRefsByTitle[title] || [];
        badRefsByTitle[title].push(link);
      }
    }
  }

  const lines = Object.entries(badRefsByTitle).map(([title, refs]) => {
    const actualTitle = metaByTitle[title]?.title || title;
    const bads = Array.from(new Set(refs));
    return `  ${JSON.stringify(actualTitle)}: ${JSON.stringify(bads)}`;
  });
  const nicerBadRefString = `{\n${lines.join(',\n')}\n}`;
  writeFileSync(badRefsLocation, nicerBadRefString);

  console.log(`No texts found for ${JSON.stringify(noRefs)}`);

  const found = Object.values(badRefsByTitle).flat().length;
  console.log(`Finished checking ${index} texts, found ${found} bad refs`);
}

// #endregion
