import { dotted, namedLetters, vowels } from './mappings';
import { Grapheme, VowelKey } from './types';

interface ProcessedGrapheme extends Grapheme {
  letters?: string[];
}

export const applyRules = (graphemes: Grapheme[]) => {
  const processed: ProcessedGrapheme[] = JSON.parse(JSON.stringify(graphemes));
  for (let index = 0; index < processed.length; index++) {
    for (const rule of rules) {
      rule(processed[index], processed[index - 1], processed, index);
    }
  }
  return processed;
};

type Rule = (
  grapheme: Grapheme,
  lastGrapheme: Grapheme | undefined,
  graphemes: Grapheme[],
  index: number
) => void;

export const hasVowel = (g: Grapheme) => {
  const keys = Object.keys(g) as VowelKey[];
  return keys.some((k) => !!vowels[k]);
};

const rules: Array<Rule> = [
  function shin(g) {
    if (g['POINT_SIN_DOT'] && g.letter === namedLetters['SHIN']) {
      g.sound = g.sound ? `s${g.sound.slice(1)}` : 's';
    }
  },
  function dot(g) {
    const letterWithDot = dotted[g.letter as keyof typeof dotted];
    if (letterWithDot && g['POINT_DAGESH']) {
      g.sound = letterWithDot;
    }
  },
  function holamVav(g, last) {
    if (
      last &&
      !hasVowel(last) &&
      g.letter === namedLetters['VAV'] &&
      g?.POINT_HOLAM
    ) {
      g.sound = '';
      last.sound += vowels['POINT_HOLAM'];
    }
  },
  // Sometimes a word like uvon (to sin) will have an incorrect holam vav instead of a vav with a cholem
  function vavWithHolam(g, last) {
    if (
      last &&
      hasVowel(last) &&
      g.letter === namedLetters['VAV'] &&
      g?.POINT_HOLAM
    ) {
      g.sound = '';
    }
  },
  function fullYudPoint(g, last) {
    const fulls = ['POINT_HIRIQ', 'POINT_SEGOL', 'POINT_TSERE'] as const;
    if (last && g.letter === namedLetters['YUD']) {
      if (fulls.some((p) => last[p])) g.sound = '';
    }
  },

  // TODO SHEVA logic
  // TODO NOACH logic
  // TODO DAGESH logic
  // TODO what are we missing?
];
