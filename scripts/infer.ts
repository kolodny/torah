import {
  quicktype,
  InputData,
  jsonInputForTargetLanguage,
} from 'quicktype-core';
import { sync } from 'glob';
import { readFileSync } from 'fs';

const glob = process.argv[2];

if (!glob) throw new Error('No glob provided');

const files = sync(glob);

const samples = files
  .slice(0, 4000)
  .map((file) => {
    const data = readFileSync(file, 'utf8');
    if (!data) return null;
    try {
      JSON.parse(data);
    } catch {
      console.warn(`Failed to parse ${file}`);
      return null;
    }
    return data;
  })
  .filter((f) => f !== null);

const jsonInput = jsonInputForTargetLanguage('typescript');

await jsonInput.addSource({
  name: 'Schema',
  samples,
});

const inputData = new InputData();
inputData.addInput(jsonInput);

const result = await quicktype({
  inputData,
  lang: 'typescript',
  alphabetizeProperties: true,
  combineClasses: true,
  rendererOptions: {
    'just-types': true,
    // 'prefer-unions': true,
    // 'prefer-const-values': true,
  },
});

console.log(result.lines.join('\n'));
