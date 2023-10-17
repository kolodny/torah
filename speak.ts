import { execSync } from 'child_process';
// Run with

const whatToSay = process.argv[2];
const converted = execSync(
  `python3 lexconvert.py --phones2phones unicode-ipa espeak "${whatToSay}"`
);
console.log(`converted: ${converted}`);
execSync(`echo '${converted}' | espeak`);
