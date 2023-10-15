import json from './text.json';
import sounds from './sounds.json';

const vowels = sounds.vowels;
const consonants = sounds.consonants;

// const vowelSounds: string[] = [];
// for (const v of Object.values(vowels)) vowelSounds.push(...v);

// const consonantSounds: string[] = [];
// for (const c of Object.values(consonants)) consonantSounds.push(...c);

const text = json[130].normalize('NFC');

const verses = text.split('\u05c3');
const converted = {
  verses: verses.map((verse) => {
    const words = verse.trim().split(/\s|\u05be/g);
    return {
      words: words.map((word) => {
        const segmenterOptions = { granularity: 'grapheme' } as const;
        const segmenter = new Intl.Segmenter('he', segmenterOptions);
        const graphemeSegments = segmenter.segment(word.trim());
        const segments = [...graphemeSegments].map((g) => g.segment);
        const phones: string[] = [];
        // Convert hebrew graphemes to phones
        for (const segment of segments) {
          for (const code of segment.split('')) {
            if (vowels[code]) {
              phones.push(`<vowel:${vowels[code]}>`);
            } else if (consonants[code]) {
              phones.push(`<consonant:${consonants[code]}>`);
            } else {
              const charCode = code.charCodeAt(0).toString(16);
              const padded = charCode.padStart(4, '0').slice(-4);
              phones.push(`<unknown code \\u${padded} ת${code}`);
            }
          }
        }
        return { segments, phones };
      }),
    };
  }),
};

console.log(JSON.stringify(converted, null, 2));
