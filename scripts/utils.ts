import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function format(number: number, type: string) {
  if (type === 'Daf') {
    const offset = Math.floor((number - 2) / 2);
    const side = number % 2 === 0 ? 'a' : 'b';
    return `${2 + offset}${side}`;
  }
  return `${number + 1}`;
}

export function createRefPath(schema: any, path: string[]): string {
  if (!schema) {
    console.warn(`No schema or nodes found for path: ${path}`);
    return '';
  }

  const { sectionNames, index_offsets_by_depth, nodes } = schema;

  if (index_offsets_by_depth) {
    for (let i = 0; i < path.length; i++) {
      const offset = index_offsets_by_depth[i + 1];
      if (offset) {
        path[i] = `${+path[i] + 1 + offset[path[i - 1]]}`;
      }
    }
  }

  if (sectionNames) {
    // Simple schema with direct sectionNames (e.g., Chapter and Verse)
    return path.map((num, i) => format(+num, sectionNames[i])).join(':');
  } else {
    // Complex schema with nodes, find the node for this path
    const node = nodes.find((node: any) => path[0] === node.title);
    if (!node) {
      console.warn(`No node found for ${schema.title} - ${path.join(' > ')}`);
      return '';
    }

    const rest = createRefPath(node, path.slice(1));
    const title = node.title;

    const comma = /^\d/.test(rest) ? '' : ',';
    return !title ? rest : `${title}${comma} ${rest}`;
  }
}

export function extractMinimalSchema(schema: any): any {
  if (!schema) return null;

  const minimalSchema: any = {};

  if (schema.title) minimalSchema.title = schema.title;

  if (schema.sectionNames) minimalSchema.sectionNames = schema.sectionNames;

  // For complex schemas with nodes
  if (schema.nodes) {
    minimalSchema.nodes = schema.nodes.map((node: any) => ({
      key: node.key,
      depth: node.depth,
      sectionNames: node.sectionNames,
      heSectionNames: node.heSectionNames,
      title: node.title,
      heTitle: node.heTitle,
      // Include any titles array if it exists (for matching by title)
      ...(node.titles && { titles: node.titles }),
    }));
  }

  // Include nodeType for completeness
  // if (schema.nodeType) {
  //   minimalSchema.nodeType = schema.nodeType;
  // }

  return minimalSchema;
}

export function readJson<T>(file: string) {
  if (!file || !existsSync(file.toLowerCase())) return null;
  const contents = readFileSync(file.toLowerCase(), 'utf8');
  return contents ? (JSON.parse(contents) as T) : null;
}

export function writeJson(file: string, data: any) {
  writeFileSync(file.toLowerCase(), JSON.stringify(data, null, 2));
}
