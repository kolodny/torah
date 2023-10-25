import { letters, punctuation, vowels } from './mappings';

type Sound = { phone: string; prob: number };
export type Heard = { start: string; end: string; sounds: Sound[] };
export type ApiResult = Heard[];

export type Grapheme = Record<
  (typeof punctuation)[keyof typeof punctuation],
  boolean
> & {
  consonant?: string;
  letter?: LetterKey;
  sound?: string;
  unknowns?: string[];
};

type Punctuation = typeof punctuation;
export type PunctuationKey = keyof Punctuation;

export type Letter = typeof letters;
type LetterKey = keyof Letter;

type Vowel = typeof vowels;
export type VowelKey = keyof Vowel;
