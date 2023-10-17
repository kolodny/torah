import json from './text.json';
import sounds from './sounds.json';

declare global {
  interface Array<T> {
    findLastIndex(
      predicate: (value: T, index: number, obj: T[]) => unknown
    ): number;
  }
}

const vowels = sounds.vowels;
const consonants = sounds.consonants;

const text = json[130].normalize('NFC');

const Hashem = {
  segments: ['אֲ', 'דֹ', 'נָ', 'י֮'],
  graphemes: [
    {
      letter: 'א',
      HEBREW_POINT_HATAF_PATAH: true,
    },
    {
      letter: 'ד',
      HEBREW_POINT_HOLAM: true,
    },
    {
      letter: 'נ',
      HEBREW_POINT_QAMATS: true,
    },
    {
      letter: '\u05d9',
      HEBREW_ACCENT_ZINOR: true,
    },
  ],
  sounds: ['\u0294\u0251', 'do', 'nɤ', 'j'],
};

const dotSounds = {
  ב: 'v',
  כ: 'k',
  ך: 'k',
  פ: 'p',
  ף: 'p',
  ת: 't',
};

type Phone = Record<string, boolean> & {
  consonant?: string;
  letter?: string;
  unknowns?: string[];
};

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
        const graphemes = segments.map((segment) => {
          const codes = segment.split('');
          const phone = { letter: codes.shift() } as Phone;

          for (const code of codes) {
            const vowel = vowels[code];
            if (vowel) {
              phone[vowel] = true;
            } else {
              if (!phone['unknowns']) phone['unknowns'] = [];
              const charCode = code.charCodeAt(0).toString(16);
              const padded = charCode.padStart(4, '0').slice(-4);
              phone['unknowns'].push(`\\u${padded} ת${code}`);
            }
          }
          return phone;
        });

        let sounds = graphemes
          .map((grapheme) => {
            let sound = consonants[grapheme.letter!];
            if (!sound) return null;

            // if (vowel === 'HEBREW_POINT_SIN_DOT' && phone['letter'] === 'ש') {
            //   phone['consonant'] = 's';
            // }
            // if (vowel === 'HEBREW_POINT_DAGESH') {
            //   const newSound = dotSounds[phone['letter']!];
            //   if (newSound) phone['consonant'] = newSound;
            // }

            if (
              dotSounds[grapheme.letter!] &&
              grapheme['HEBREW_POINT_DAGESH']
            ) {
              sound = dotSounds[grapheme.letter!];
            }

            const vowelSounds = {
              HEBREW_POINT_HATAF_PATAH: '\u0251',
              HEBREW_POINT_PATAH: '\u0251',

              HEBREW_POINT_HATAF_SEGOL: '\u025B',
              HEBREW_POINT_SEGOL: '\u025B',

              HEBREW_POINT_QAMATS: '\u0264',
              HEBREW_POINT_HATAF_QAMATS: '\u0264',

              HEBREW_POINT_SHEVA: '\u0259\u032A',

              HEBREW_POINT_TSERE: '\u026A',

              HEBREW_POINT_HIRIQ: 'i',

              HEBREW_POINT_HOLAM: 'o',

              HEBREW_POINT_QUBUTS: 'u',
            };

            const keys = Object.keys(grapheme);
            for (const key of keys) {
              const vowelSound = vowelSounds[key];
              if (vowelSound) {
                sound += vowelSound;
              }
            }

            return sound;
          })
          .filter(Boolean);

        const prettyWord = [...segments].reverse().join('');

        if (graphemes.map((g) => g.letter).join('') === 'יהוה') {
          sounds = Hashem.sounds;
        }

        return { segments, graphemes, sounds, word: prettyWord };
      }),
    };
  }),
};

console.log(JSON.stringify(converted, null, 2));
console.log(
  JSON.stringify(
    converted.verses
      .map((v) => v.words.map((w) => w.sounds.join('.')).join(' '))
      .join('. '),
    null,
    2
  )
);
