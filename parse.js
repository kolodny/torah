import fs from 'fs';

const output = fs.readFileSync('output').toString();
// console.log({ output });
const parts = output.split(' | ').map((part) => {
  return [...part.matchAll(/(?<phone>.) \((?<prob>[^)]*)\)/g)].map(
    ({ groups: { phone, prob } }) => ({ phone, prob: +prob })
  );
});
console.log(JSON.parse(JSON.stringify(parts)));
