import json from './text.json';
import {
  letters,
  namedLetters,
  dotted,
  punctuation,
  vowels,
  Hashem,
} from './mappings';

declare global {
  interface Array<T> {
    findLastIndex(
      predicate: (value: T, index: number, obj: T[]) => unknown
    ): number;
  }
}

const text = json[130].normalize('NFC');

type Phone = Record<(typeof punctuation)[keyof typeof punctuation], boolean> & {
  consonant?: string;
  letter?: string;
  sound?: string;
  unknowns?: string[];
  isVavWithHolam?: boolean;
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
            const vowel = punctuation[code];
            if (vowel) {
              phone[vowel] = true;
            } else {
              if (!phone['unknowns']) phone['unknowns'] = [];
              const charCode = code.charCodeAt(0).toString(16);
              const padded = charCode.padStart(4, '0').slice(-4);
              phone['unknowns'].push(`\\u${padded} ת${code}`);
              phone[''];
            }
          }
          return phone;
        });

        const isHolamVav = (g?: Phone) =>
          g?.letter === namedLetters['VAV'] && g?.POINT_HOLAM;

        graphemes.forEach((grapheme, index) => {
          if (isHolamVav(grapheme) && !grapheme.isVavWithHolam) return null;
          let sound: string = letters[grapheme.letter!];
          if (!sound) return null;

          if (grapheme['POINT_SIN_DOT'] && grapheme.letter === 'ש') {
            sound = 's';
          }

          if (dotted[grapheme.letter!] && grapheme['POINT_DAGESH']) {
            sound = dotted[grapheme.letter!];
          }

          let hasVowel = false;
          const keys = Object.keys(grapheme);
          for (const key of keys) {
            const vowelSound = vowels[key];
            if (vowelSound) {
              sound += vowelSound;
              hasVowel = true;
            }
          }

          if (isHolamVav(graphemes[index + 1])) {
            if (hasVowel) {
              graphemes[index + 1].isVavWithHolam = true;
            } else {
              sound += vowels['POINT_HOLAM'];
            }
          }

          grapheme.sound = sound;
        });

        const prettyWord = [...segments].reverse().join('');

        if (graphemes.map((g) => g.letter).join('') === 'יהוה') {
          graphemes[0].sound = Hashem.sounds[0];
          graphemes[1].sound = Hashem.sounds[1];
          graphemes[2].sound = Hashem.sounds[2];
          graphemes[3].sound = Hashem.sounds[3];
        }

        return { segments, graphemes, word: prettyWord };
      }),
    };
  }),
};

console.log(JSON.stringify(converted, null, 2));
console.error(
  JSON.stringify(
    converted.verses
      .map((v) =>
        v.words.map((w) => w.graphemes.map((s) => s.sound).join('.')).join(' ')
      )
      .join('. '),
    null,
    2
  )
);
