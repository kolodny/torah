// import json from './text.json';
import './types.d';

import { letters, dotted, punctuation, Hashem, vowels } from './mappings';
import { Grapheme, PunctuationKey, VowelKey } from './types';
import { applyRules } from './applyRules';

declare global {
  interface Array<T> {
    findLastIndex(
      predicate: (value: T, index: number, obj: T[]) => unknown
    ): number;
  }
}

export const toPhones = (text: string) => {
  const verses = text.split('\u05c3');
  const converted = {
    verses: verses.slice(0, 1).map((verse) => {
      const words = verse.trim().split(/\s|\u05be/g);
      return {
        words: words.slice(0, -1).map((word) => {
          const segmenterOptions = { granularity: 'grapheme' } as const;
          const segmenter = new Intl.Segmenter('he', segmenterOptions);
          const graphemeSegments = segmenter.segment(word.trim());
          const segments = [...graphemeSegments].map((g) => g.segment);
          let graphemes = segments.map((segment) => {
            const codes = segment.split('') as PunctuationKey[];
            const phone = { letter: codes.shift() } as Grapheme;

            for (const code of codes) {
              const vowel = punctuation[code];
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

          graphemes.forEach((grapheme) => {
            let sound: string = letters[grapheme.letter!];
            if (!sound) return null;

            const letterWithDot = dotted[grapheme.letter as 'ב'];
            if (letterWithDot && grapheme['POINT_DAGESH']) {
              sound = letterWithDot;
            }

            for (const key of Object.keys(grapheme) as VowelKey[]) {
              const vowelSound = vowels[key];
              if (vowelSound) {
                sound += vowelSound;
              }
            }

            grapheme.sound = sound;
          });

          graphemes = applyRules(graphemes);

          const prettyWord = segments.join('');

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
  return converted;
};
