import { execSync } from 'child_process';

if (process.argv.length < 3) {
  console.log('Usage: node process.js <command>');
  process.exit(1);
}

const file = process.argv[2];

const output = execSync(
  `python -m allosaurus.run -e 1.2 --lang heb -k 3 -i ${file}`
).toString('utf8');

const parts = output.split(' | ');
const matches = parts.map((part) => {
  const matched = part.matchAll(/(?<phone>.|<blk>) \((?<prob>[^)]*)\)/g);
  return Array.from(matched)
    .map((m) => m.groups!)
    .filter(Boolean)
    .map(({ phone, prob }) => ({ phone, prob: +prob }));
});

console.log(matches);
