/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Meta {
  alts?: Alts;
  authors?: Author[];
  base_text_mapping?: BaseTextMapping | null;
  base_text_titles?: CollectiveTitle[];
  categories: string[];
  collective_title?: CollectiveTitle;
  compDate?: number[];
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
  exclude_structs?: ExcludeStruct[];
  hasErrorMargin?: boolean;
  heCategories: string[];
  heDesc?: string;
  heShortDesc?: string;
  heTitle: string;
  heTitleVariants: string[];
  hidden?: boolean;
  is_cited?: boolean;
  lexiconName?: string;
  order?: number[];
  pubDate?: number[];
  pubDateString?: CollectiveTitle;
  pubPlace?: string;
  pubPlaceString?: CollectiveTitle;
  schema: SchemaClass;
  sectionNames?: SectionName[];
  title: string;
  titleVariants: string[];
}

type Node =
  | ChapterNode
  | IndecentNode
  | IndigoNode
  | Pages
  | PagesNode
  | PurpleNode
  | SchemaNode
  | StickyNode
  | TentacledNode
  | The30DayCycleNode;

interface Alts {
  '30 Day Cycle'?: The30_DayCycle;
  Authors?: Authors;
  Book?: The30_DayCycle;
  Chamber?: Chamber;
  Chapter?: Chapter;
  Chapters?: The30_DayCycle;
  Compositions?: Authors;
  Contents?: Contents;
  Daf?: Daf;
  Essay?: Essay;
  Gate?: The30_DayCycle;
  Hilchot?: Chapter;
  Letter?: Contents;
  Pages?: Pages;
  Parasha?: Parasha;
  Pillars?: The30_DayCycle;
  Remez?: Contents;
  Siman?: Contents;
  'Tanaim and Amoraim'?: Authors;
  Tikkunim?: Contents;
  Topic?: Topic;
  'Vavim and Amudim'?: Chamber;
}

interface The30_DayCycle {
  heTitle: string;
  nodes: The30DayCycleNode[];
  title: string;
  titles: Title[];
}

interface The30DayCycleNode {
  addressTypes?: PagesAddressType[];
  depth?: number;
  heTitle: string;
  includeSections?: boolean;
  isSegmentLevelDiburHamatchil?: boolean;
  match_templates?: PurpleMatchTemplate[];
  nodeType?: PagesNodeType;
  nodes?: Node[];
  numeric_equivalent?: number;
  offset?: number;
  referenceableSections?: boolean[];
  refs?: string[];
  sectionNames?: SectionName[];
  startingAddress?: number;
  title: string;
  titles: Title[];
  wholeRef?: string;
}

type PagesAddressType =
  | 'Aliyah'
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

interface PurpleMatchTemplate {
  scope?: Scope;
  term_slugs: string[];
}

type Scope = 'alone' | 'any';

type PagesNodeType = 'AltStructNode' | 'ArrayMapNode';

interface PagesNode {
  depth?: number;
  heTitle: string;
  includeSections?: boolean;
  nodeType?: PagesNodeType;
  nodes?: Node[];
  refs?: any[];
  sharedTitle?: string;
  title: string;
  titles: Title[];
  wholeRef?: string;
}

interface Pages {
  addressTypes?: PagesAddressType[];
  default?: boolean;
  depth?: number;
  heTitle: string;
  includeSections?: boolean;
  match_templates?: PagesMatchTemplate[];
  nodeType?: PagesNodeType;
  nodes?: Node[];
  offset?: number;
  refs?: string[];
  sectionNames?: SectionName[];
  startingAddress?: number;
  title: string;
  titles?: Title[];
  wholeRef?: string;
}

interface Title {
  lang: Lang;
  presentation?: string;
  primary?: boolean;
  text: string;
}

type Lang = 'en' | 'he';

interface PagesMatchTemplate {
  term_slugs: string[];
}

type SectionName =
  | 'Additional Tikkun'
  | 'Pages'
  | 'Room'
  | 'Siman'
  | 'Tikkun'
  | 'Verse'
  | 'Book'
  | 'Chapter'
  | 'Chapters'
  | 'Comment'
  | 'Daf'
  | 'Drush'
  | 'Gate'
  | 'Halacha'
  | 'Halakhah'
  | 'Integer'
  | 'Klal'
  | 'Letter'
  | 'Line'
  | 'Manuscript'
  | 'Midrash'
  | 'Mishnah'
  | 'Mitzvah'
  | 'Ot'
  | 'Paragraph'
  | 'Pararaph'
  | 'Parasha'
  | 'Parshanut'
  | 'Part'
  | 'Prayer'
  | 'Section'
  | 'paragraph'
  | 'siman'
  | 'Segment'
  | 'Seif'
  | 'Seif Katan'
  | 'Shoresh'
  | 'Siman'
  | 'Story'
  | 'Talmud'
  | 'Teshuva'
  | 'Teshuvah'
  | 'Torah'
  | 'Treatise'
  | 'Verse'
  | 'Volume';

interface Authors {
  heTitle: string;
  nodes: Contents[];
  title: string;
  titles: Title[];
}

interface Contents {
  heTitle: string;
  nodes: Pages[];
  title: string;
  titles: Title[];
}

interface Chamber {
  heTitle: string;
  nodes: ChamberNode[];
  title: string;
  titles: Title[];
}

interface ChamberNode {
  addressTypes: PagesAddressType[];
  depth: number;
  heTitle: string;
  nodeType: PagesNodeType;
  refs: string[];
  sectionNames: FluffySectionName[];
  title: string;
  titles: Title[];
  wholeRef: string;
}

enum FluffySectionName {
  Room = 'Room',
  Vav = 'Vav',
}

interface Chapter {
  heTitle: string;
  nodes: ChapterNode[];
  title: string;
  titles: Title[];
}

interface ChapterNode {
  addressTypes?: PagesAddressType[];
  addresses?: number[];
  default?: boolean;
  depth?: number;
  heTitle: string;
  includeSections?: string;
  match_templates?: PagesMatchTemplate[];
  nodeType?: PagesNodeType;
  nodes?: Node[];
  offset?: number;
  refs?: string[];
  sectionNames?: SectionName[];
  skipped_addresses?: number[];
  startingAddress?: string;
  title: string;
  titles?: Title[];
  wholeRef?: string;
}

interface Daf {
  heTitle: string;
  nodes: DafNode[];
  title: string;
  titles: Title[];
}

interface DafNode {
  addressTypes?: PurpleAddressType[];
  depth?: number;
  heTitle: string;
  match_templates?: PagesMatchTemplate[];
  nodeType: PagesNodeType;
  nodes?: Node[];
  numeric_equivalent?: number;
  offset?: number;
  referenceable?: Referenceable;
  refs?: string[];
  sectionNames?: SectionName[];
  startingAddress?: string;
  title: string;
  titles: Title[];
  wholeRef?: string;
}

enum PurpleAddressType {
  Folio = 'Folio',
  Integer = 'Integer',
}

interface PurpleNode {
  addressTypes?: PagesAddressType[];
  addresses?: number[];
  depth?: number;
  heTitle: string;
  match_templates: PagesMatchTemplate[];
  nodeType: PagesNodeType;
  nodes?: Node[];
  offset?: number;
  referenceable?: Referenceable;
  refs?: string[];
  sectionNames?: SectionName[];
  startingAddress?: string;
  title: string;
  titles: Title[];
  wholeRef?: string;
}

enum Referenceable {
  Optional = 'optional',
}

interface Essay {
  heTitle: string;
  nodes: EssayNode[];
  title: string;
  titles: Title[];
}

interface EssayNode {
  heTitle: string;
  match_templates: PagesMatchTemplate[];
  nodeType: PagesNodeType;
  nodes: FluffyNode[];
  referenceable?: Referenceable;
  title: string;
  titles: Title[];
}

interface FluffyNode {
  addressTypes?: PagesAddressType[];
  depth?: number;
  heTitle: string;
  match_templates: PagesMatchTemplate[];
  nodeType: PagesNodeType;
  nodes?: Node[];
  numeric_equivalent?: number;
  offset?: number;
  referenceable?: Referenceable;
  refs?: string[];
  sectionNames?: SectionName[];
  startingAddress?: number;
  title: string;
  titles: Title[];
  wholeRef?: string;
}

interface Parasha {
  heTitle: string;
  nodes: ParashaNode[];
  title: string;
  titles: Title[];
}

interface ParashaNode {
  addressTypes?: PagesAddressType[];
  depth?: number;
  heTitle: string;
  includeSections?: boolean;
  isMapReferenceable?: boolean;
  match_templates?: PurpleMatchTemplate[];
  nodeType?: PagesNodeType;
  nodes?: Node[];
  offset?: number;
  refs?: string[];
  sectionNames?: SectionName[];
  sharedTitle?: string;
  startingAddress?: string;
  title: string;
  titles: Title[];
  wholeRef?: string;
}

interface Topic {
  heTitle: string;
  nodes: TopicNode[];
  title: string;
  titles: Title[];
}

interface TopicNode {
  addressTypes?: PagesAddressType[];
  depth?: number;
  heTitle: string;
  includeSections?: boolean | string;
  nodeType?: PagesNodeType;
  nodes?: Node[];
  offset?: number;
  refs?: string[];
  sectionNames?: SectionName[];
  sharedTitle?: SharedTitle;
  startingAddress?: string;
  title: string;
  titles: Title[];
  wholeRef?: string;
}

enum SharedTitle {
  Introduction = 'Introduction',
}

interface Author {
  en: string;
  he: string;
  slug: string;
}

enum BaseTextMapping {
  ManyToOne = 'many_to_one',
  ManyToOneDefaultOnly = 'many_to_one_default_only',
  OneToOne = 'one_to_one',
}

interface CollectiveTitle {
  en: string;
  he: string;
}

enum Corpora {
  Bavli = 'Bavli',
  MidrashRabbah = 'Midrash Rabbah',
  Mishnah = 'Mishnah',
  Tanakh = 'Tanakh',
}

enum Dependence {
  Commentary = 'Commentary',
  DependenceCommentary = 'commentary',
  DependenceTargum = 'targum',
  Guides = 'Guides',
  Midrash = 'Midrash',
  Targum = 'Targum',
}

enum Era {
  A = 'A',
  Ah = 'AH',
  Co = 'CO',
  Gn = 'GN',
  Ri = 'RI',
  T = 'T',
}

enum ExcludeStruct {
  Schema = 'schema',
}

interface SchemaClass {
  addressTypes?: PagesAddressType[];
  checkFirst?: CollectiveTitle;
  depth?: number;
  diburHamatchilRegexes?: DiburHamatchilRegex[];
  heSectionNames?: SectionName[];
  heTitle: string;
  isSegmentLevelDiburHamatchil?: boolean;
  key: string;
  lengths?: number[];
  match_templates?: PagesMatchTemplate[];
  nodeType?: SchemaNodeType;
  nodes?: Node[];
  referenceableSections?: boolean[];
  sectionNames?: SectionName[];
  title: string;
  titles: Title[];
  toc_zoom?: number;
}

enum DiburHamatchilRegex {
  BB = '^<b>(.+?)</b>',
  DiburHamatchilRegex = '\\.(.+?)$',
  Empty = '^(.+?)[\\-–]',
  מתניגמS = "^(?:(?:מתני'|גמ')\\s?)?(.+)$",
}

enum SchemaNodeType {
  DictionaryNode = 'DictionaryNode',
  JaggedArrayNode = 'JaggedArrayNode',
  SchemaNode = 'SchemaNode',
}

interface SchemaNode {
  addressTypes?: PagesAddressType[];
  default?: boolean;
  depth?: number;
  diburHamatchilRegexes?: DiburHamatchilRegex[];
  firstWord?: string;
  heSectionNames?: SectionName[];
  heTitle: string;
  headwordMap?: Array<string[]>;
  index_offsets_by_depth?: { [key: string]: number[] | number };
  isSegmentLevelDiburHamatchil?: boolean;
  key?: string;
  lastWord?: string;
  lengths?: number[];
  lexiconName?: string;
  match_templates?: PurpleMatchTemplate[];
  nodeType?: SchemaNodeType;
  nodes?: Node[];
  referenceableSections?: boolean[];
  sectionNames?: SectionName[];
  sharedTitle?: string;
  title: string;
  titles?: Title[];
  toc_zoom?: number;
}

interface TentacledNode {
  addressTypes?: PagesAddressType[];
  default?: boolean;
  depth?: number;
  diburHamatchilRegexes?: DiburHamatchilRegex[];
  heSectionNames?: SectionName[];
  heTitle: string;
  index_offsets_by_depth?: { [key: string]: number[] | number };
  isSegmentLevelDiburHamatchil?: boolean;
  key: string;
  lengths?: number[];
  match_templates?: PurpleMatchTemplate[];
  nodeType?: SchemaNodeType;
  nodes?: Node[];
  numeric_equivalent?: number;
  referenceableSections?: boolean[];
  sectionNames?: SectionName[];
  sharedTitle?: string;
  title: string;
  titles?: Title[];
  toc_zoom?: number;
}

interface StickyNode {
  addressTypes?: PagesAddressType[];
  default?: boolean;
  depth?: number;
  heSectionNames?: SectionName[];
  heTitle: string;
  key: string;
  lengths?: number[];
  nodeType?: SchemaNodeType;
  nodes?: Node[];
  sectionNames?: SectionName[];
  sharedTitle?: string;
  title: string;
  titles?: Title[];
  toc_zoom?: number;
}

interface IndigoNode {
  addressTypes?: PagesAddressType[];
  default?: boolean;
  depth?: number;
  heSectionNames?: SectionName[];
  heTitle: string;
  key: string;
  lengths?: number[];
  nodeType?: SchemaNodeType;
  nodes?: Node[];
  sectionNames?: SectionName[];
  sharedTitle?: string;
  title: string;
  titles?: Title[];
}

interface IndecentNode {
  addressTypes?: PagesAddressType[];
  depth?: number;
  heSectionNames?: SectionName[];
  heTitle: string;
  key: string;
  nodeType?: SchemaNodeType;
  nodes?: Node[];
  sectionNames?: SectionName[];
  title: string;
  titles: Title[];
}
