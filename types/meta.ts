/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Meta {
  alts?: Alts;
  authors?: Author[];
  base_text_mapping?: BaseTextMapping | null;
  base_text_titles?: CollectiveTitle[];
  categories: string[];
  collective_title?: CollectiveTitle;
  compDate?: string;
  compDateString?: CollectiveTitle;
  compPlace?: string;
  compPlaceString?: CollectiveTitle;
  corpora?: Corpora[];
  dedication?: CollectiveTitle;
  default_struct?: string;
  dependence?: Dependence;
  depth?: number;
  enDesc?: string;
  enShortDesc?: string;
  era?: Era | null;
  errorMargin?: number | string;
  exclude_structs?: ExcludeStruct[];
  heCategories: string[];
  heDesc?: string;
  heShortDesc?: string;
  heTitle: string;
  heTitleVariants: string[];
  hidden?: boolean;
  is_cited?: boolean;
  lexiconName?: string;
  order?: number[];
  pubDate?: string;
  pubPlace?: string;
  schema: SchemaClass;
  sectionNames?: SchemaSectionName[];
  title: string;
  titleVariants: string[];
}

export interface Alts {
  '30 Day Cycle'?: The30_DayCycle;
  Book?: The30_DayCycle;
  Chamber?: The30_DayCycle;
  Chapter?: The30_DayCycle;
  Chapters?: The30_DayCycle;
  Contents?: The30_DayCycle;
  Daf?: The30_DayCycle;
  'Daf Yomi'?: DafYomi;
  Essay?: Essay;
  Gate?: The30_DayCycle;
  Hilchot?: The30_DayCycle;
  Letter?: The30_DayCycle;
  Pages?: DafYomi;
  Parasha?: Parasha;
  Pillars?: The30_DayCycle;
  Remez?: The30_DayCycle;
  Section?: Essay;
  Siman?: The30_DayCycle;
  Tikkunim?: The30_DayCycle;
  Topic?: Topic;
  'Vavim and Amudim'?: The30_DayCycle;
  Venice?: The30_DayCycle;
  Vilna?: The30_DayCycle;
}

export interface The30_DayCycle {
  heTitle: string;
  nodes: DafYomi[];
  title: string;
  titles: Title[];
}

export interface DafYomiNode {
  addressTypes?: AddressType[];
  addresses?: number[];
  default?: boolean;
  depth?: number;
  heTitle: string;
  includeSections?: boolean;
  nodeType?: DafYomiNodeType;
  nodes?: DafYomi[];
  offset?: number;
  refs?: string[];
  sectionNames?: DafYomiSectionName[];
  sharedTitle?: SharedTitle;
  skipped_addresses?: number[];
  startingAddress?: number | string;
  title: string;
  titles?: Title[];
  wholeRef?: string;
}

export interface DafYomi {
  addressTypes?: AddressType[];
  addresses?: number[];
  default?: boolean;
  depth?: number;
  heTitle: string;
  includeSections?: boolean | string;
  isSegmentLevelDiburHamatchil?: boolean;
  match_templates?: DafYomiMatchTemplate[];
  nodeType?: DafYomiNodeType;
  nodes?: DafYomiNode[];
  numeric_equivalent?: number;
  offset?: number;
  referenceableSections?: boolean[];
  refs?: string[];
  sectionNames?: DafYomiSectionName[];
  skipped_addresses?: number[];
  startingAddress?: number | string;
  title: string;
  titles?: Title[];
  wholeRef?: string;
}

type AddressType =
  | 'Aliyah'
  | 'Folio'
  | 'Halakhah'
  | 'Integer'
  | 'Mishnah'
  | 'Pasuk'
  | 'Perek'
  | 'Section'
  | 'Seif'
  | 'SeifKatan'
  | 'Siman'
  | 'Talmud'
  | 'Volume';

type DafYomiNodeType = 'ArrayMapNode';

type DafYomiSectionName =
  | 'Additional Tikkun'
  | 'Chapter'
  | 'Chapters'
  | 'Column'
  | 'Daf'
  | 'Halakhah'
  | 'Klal'
  | 'Line'
  | 'Pages'
  | 'Paragraph'
  | 'Room'
  | 'Seif'
  | 'Seif Katan'
  | 'Siman'
  | 'Tikkun'
  | 'Vav'
  | 'Verse';

type SharedTitle = 'Introduction';

export interface Title {
  lang: Lang;
  presentation?: Presentation;
  primary?: boolean;
  text: string;
}

type Lang = 'en' | 'he';

type Presentation = 'both';

export interface DafYomiMatchTemplate {
  scope?: Scope;
  term_slugs: string[];
}

type Scope = 'alone' | 'any';

export interface Essay {
  heTitle: string;
  nodes: The30_DayCycle[];
  title: string;
  titles: Title[];
}

export interface Parasha {
  heTitle: string;
  nodes: ParashaNode[];
  title: string;
  titles: Title[];
}

export interface ParashaNode {
  addressTypes?: AddressType[];
  depth?: number;
  heTitle: string;
  includeSections?: boolean;
  match_templates?: DafYomiMatchTemplate[];
  nodeType?: DafYomiNodeType;
  nodes?: PurpleNode[];
  offset?: number;
  refs?: string[];
  sectionNames?: PurpleSectionName[];
  sharedTitle?: string;
  startingAddress?: string;
  title: string;
  titles: Title[];
  wholeRef?: string;
}

export interface PurpleNode {
  depth?: number;
  heTitle: string;
  includeSections?: boolean;
  nodeType?: DafYomiNodeType;
  nodes?: DafYomi[];
  refs?: any[];
  sharedTitle?: string;
  title: string;
  titles: Title[];
  wholeRef?: string;
}

type PurpleSectionName =
  | 'Aliyah'
  | 'Chamber'
  | 'Chapter'
  | 'Comment'
  | 'Daf'
  | "'Epistle'"
  | 'Essay'
  | 'Gate'
  | 'Halakhah'
  | 'Klal'
  | 'Mishnah'
  | 'Mitzvah'
  | 'Nahar'
  | 'Negative Mitzvah'
  | 'Paragraph'
  | 'Parasha'
  | 'Positive Mitzvah'
  | 'Principle'
  | "'Paragraph'"
  | 'Section'
  | 'chapter'
  | "'Comment'"
  | 'paragraph'
  | 'siman'
  | 'Segment'
  | 'Seif'
  | 'Shaar'
  | 'Sheilta'
  | 'Siman'
  | 'Subsection'
  | 'Teshuvah'
  | 'Verse'
  | 'Window'
  | 'Word';

export interface Topic {
  heTitle: string;
  nodes: TopicNode[];
  title: string;
  titles: Title[];
}

export interface TopicNode {
  addressTypes?: AddressType[];
  depth?: number;
  heTitle: string;
  includeSections?: boolean | string;
  nodeType?: DafYomiNodeType;
  nodes?: DafYomi[];
  offset?: number;
  refs?: string[];
  sectionNames?: DafYomiSectionName[];
  sharedTitle?: SharedTitle;
  startingAddress?: string;
  title: string;
  titles: Title[];
  wholeRef?: string;
}

export interface Author {
  en: string;
  he: string;
  slug: string;
}

type BaseTextMapping =
  | 'commentary_increment_base_text_depth'
  | ''
  | 'many_to_one'
  | 'many_to_one_default_only'
  | 'one_to_one';

export interface CollectiveTitle {
  en: string;
  he: string;
}

type Corpora = 'Bavli' | 'Midrash Rabbah' | 'Mishnah' | 'Tanakh' | 'Yerushalmi';

type Dependence = 'Commentary' | 'commentary' | 'Guides' | 'Midrash' | 'Targum';

type Era = 'A' | 'AH' | 'CO' | 'GN' | 'RI' | 'T';

type ExcludeStruct = 'schema';

export interface SchemaClass {
  addressTypes?: AddressType[];
  checkFirst?: CollectiveTitle;
  depth?: number;
  diburHamatchilRegexes?: DiburHamatchilRegex[];
  heSectionNames?: SchemaHeSectionName[];
  heTitle: string;
  isSegmentLevelDiburHamatchil?: boolean;
  key: string;
  lengths?: number[];
  match_templates?: SchemaMatchTemplate[];
  nodeType?: SchemaNodeType;
  nodes?: SchemaNode[];
  ref_resolver_context_swaps?: RefResolverContextSwaps;
  referenceableSections?: boolean[];
  sectionNames?: SchemaSectionName[];
  title: string;
  titles: Title[];
  toc_zoom?: number;
}

type DiburHamatchilRegex =
  | '^<b>(.+?)</b>'
  | '\\.(.+?)$'
  | '^(.+?)[\\-–]'
  | "^(?:(?:מתני'|גמ')\\s?)?(.+)$";

type SchemaHeSectionName =
  | ''
  | 'אות'
  | 'דף'
  | 'דרוש'
  | 'הדרן'
  | 'הוראה'
  | 'הלכה'
  | 'חדר'
  | 'חלק'
  | 'כלל'
  | 'כרך'
  | 'מאמר'
  | 'מדרש'
  | 'מזמור'
  | 'מצוה'
  | 'מצות לא תעשה'
  | 'מצות עשה'
  | 'משנה'
  | 'נתיב'
  | 'סדר התפילה'
  | 'סימן'
  | 'סעיף'
  | 'סעיף קטן'
  | 'ספר'
  | 'פיוט'
  | 'פירוש'
  | 'פסוק'
  | 'פסקה'
  | 'פרק'
  | 'פרשה'
  | 'קובץ'
  | 'רמז'
  | 'שורה'
  | 'שער'
  | "שער הגמול - רמב''ן"
  | 'תוספתא'
  | 'תשובה';

export interface SchemaMatchTemplate {
  term_slugs: string[];
}

type SchemaNodeType = 'DictionaryNode' | 'JaggedArrayNode' | 'SchemaNode';

export interface SchemaNode {
  addressTypes?: AddressType[];
  default?: boolean;
  depth?: number;
  diburHamatchilRegexes?: DiburHamatchilRegex[];
  firstWord?: string;
  heSectionNames?: PurpleHeSectionName[];
  heTitle: string;
  headwordMap?: Array<string[]>;
  index_offsets_by_depth?: { [key: string]: number[] | number };
  isSegmentLevelDiburHamatchil?: boolean;
  key?: string;
  lastWord?: string;
  lengths?: number[];
  lexiconName?: string;
  match_templates?: DafYomiMatchTemplate[];
  nodeType?: SchemaNodeType;
  nodes?: FluffyNode[];
  referenceableSections?: boolean[];
  sectionNames?: TentacledSectionName[];
  sharedTitle?: string;
  title: string;
  titles?: Title[];
  toc_zoom?: number;
}

type PurpleHeSectionName =
  | ''
  | 'אות'
  | 'דף'
  | 'הלכה'
  | 'חדר'
  | 'חלק'
  | 'כלל'
  | 'מדרש'
  | 'מצוה'
  | 'משנה'
  | 'סימן'
  | 'סיפור'
  | 'סעיף'
  | 'סעיף קטן'
  | 'ספר'
  | 'פירוש'
  | 'פסוק'
  | 'פסקה'
  | 'פרק'
  | 'פרשה'
  | 'פרשנות'
  | 'שורה'
  | 'שורש'
  | 'שער'
  | 'תורה'
  | 'תלמוד'
  | 'תפילה'
  | 'תשובה';

export interface FluffyNode {
  addressTypes?: AddressType[];
  default?: boolean;
  depth?: number;
  diburHamatchilRegexes?: DiburHamatchilRegex[];
  heSectionNames?: SchemaHeSectionName[];
  heTitle: string;
  index_offsets_by_depth?: IndexOffsetsByDepthClass;
  isSegmentLevelDiburHamatchil?: boolean;
  key: string;
  lengths?: number[];
  match_templates?: DafYomiMatchTemplate[];
  nodeType?: SchemaNodeType;
  nodes?: TentacledNode[];
  numeric_equivalent?: number;
  referenceableSections?: boolean[];
  sectionNames?: PurpleSectionName[];
  sharedTitle?: string;
  title: string;
  titles?: Title[];
  toc_zoom?: number;
}

export interface IndexOffsetsByDepthClass {
  '2': number[];
}

export interface TentacledNode {
  addressTypes?: AddressType[];
  default?: boolean;
  depth?: number;
  heSectionNames?: SchemaHeSectionName[];
  heTitle: string;
  key: string;
  lengths?: number[];
  nodeType?: SchemaNodeType;
  nodes?: StickyNode[];
  sectionNames?: FluffySectionName[];
  sharedTitle?: string;
  title: string;
  titles?: Title[];
  toc_zoom?: number;
}

export interface StickyNode {
  addressTypes?: AddressType[];
  default?: boolean;
  depth?: number;
  heSectionNames?: SchemaHeSectionName[];
  heTitle: string;
  key: string;
  lengths?: number[];
  nodeType?: SchemaNodeType;
  nodes?: IndigoNode[];
  sectionNames?: DafYomiSectionName[];
  sharedTitle?: string;
  title: string;
  titles?: Title[];
}

export interface IndigoNode {
  addressTypes?: AddressType[];
  depth?: number;
  heSectionNames?: SchemaHeSectionName[];
  heTitle: string;
  key: string;
  nodeType?: SchemaNodeType;
  nodes?: IndigoNode[];
  sectionNames?: DafYomiSectionName[];
  title: string;
  titles: Title[];
}

type FluffySectionName =
  | 'chapter'
  | 'Comment'
  | 'Daf'
  | "'Epistle'"
  | 'Paragraph'
  | 'Path'
  | "'Paragraph'"
  | 'Chapter'
  | 'paragraph'
  | 'Seif'
  | 'Shorash'
  | 'Siman';

type TentacledSectionName =
  | 'Book'
  | 'Chamber'
  | 'Chapter'
  | 'Comment'
  | 'Daf'
  | 'Discourse'
  | 'Footnote'
  | 'Gate'
  | 'Halacha'
  | 'Halakhah'
  | 'Integer'
  | 'Inyan'
  | 'Klal'
  | 'Letter'
  | 'Line'
  | 'Maayan'
  | 'Manuscript'
  | 'Midrash'
  | 'Mishnah'
  | 'Mitzvah'
  | 'Ot'
  | 'Paragraph'
  | 'Paragraphs'
  | 'Pararaph'
  | 'Parasha'
  | 'Parshanut'
  | 'Part'
  | 'Prayer'
  | "Se'if"
  | 'Section'
  | 'siman'
  | 'Segment'
  | 'Seif'
  | 'Seif Katan'
  | 'Sheilta'
  | 'Shoket'
  | 'Shoresh'
  | 'Siman'
  | 'Story'
  | 'Talmud'
  | 'Teshuva'
  | 'Teshuvah'
  | 'Torah'
  | 'Treatise'
  | 'Verse'
  | 'Window';

export interface RefResolverContextSwaps {
  halakha: string[];
}

type SchemaSectionName =
  | 'Book'
  | 'Chapter'
  | 'Comment'
  | 'Daf'
  | 'Day of Week'
  | 'DH'
  | 'Drush'
  | ''
  | 'Essay'
  | 'Footnote'
  | 'Gate'
  | 'Hadran'
  | 'Halacha'
  | 'Halakhah'
  | 'Klal'
  | 'Kovetz'
  | 'Letter'
  | 'Line'
  | 'Liturgy'
  | 'Midrash'
  | 'Mishna'
  | 'Mishnah'
  | 'Mitzvah'
  | 'Ot'
  | 'Page'
  | 'Paragraph'
  | 'Paragraphs'
  | 'Parasha'
  | 'Part'
  | 'Passuk'
  | 'Perek'
  | 'Piyyut'
  | 'Psalm'
  | 'Chapter '
  | 'Question'
  | 'Remez'
  | "Sha'ar Ha'Gemul"
  | 'Section'
  | 'chapter'
  | 'comment'
  | 'paragraph'
  | 'section'
  | 'Segment '
  | 'siman'
  | 'verse'
  | 'Volume '
  | 'Segment'
  | 'Seif'
  | 'Seif Katan'
  | 'Sheilta'
  | 'Siman'
  | 'Statement'
  | 'Teaching'
  | 'Teshuva'
  | 'Tosefta'
  | 'Verse'
  | 'Verset'
  | 'Volume';
