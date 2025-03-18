// Created via node scripts/infer.ts ./Sefaria-Export/table_of_contents.json and some manual cleanup

export interface Toc {
  category: Category;
  contents: Content[];
  enComplete: boolean;
  enDesc: string;
  enShortDesc: string;
  heCategory: string;
  heComplete: boolean;
  heDesc: string;
  heShortDesc: string;
  order: number;
}

export type Content = {
  base_text_order?: number;
  categories?: Category[];
  category?: string;
  collectiveTitle: string;
  commentator: string;
  contents?: Content[];
  corpus?: Category;
  dependence: string;
  enComplete?: boolean;
  enDesc?: string;
  enShortDesc: string;
  heCategory?: string;
  heCollectiveTitle: string;
  heCommentator: string;
  heComplete?: boolean;
  heDesc?: string;
  heShortDesc: string;
  heTitle?: string;
  hidden?: boolean;
  isCollection?: boolean;
  isPrimary?: boolean;
  name?: string;
  nodeType?: string;
  order?: number;
  primary_category?: Category;
  searchRoot?: string;
  slug?: string;
  title?: string;
};

type Category =
  | 'Chasidut'
  | 'Commentary'
  | 'commentary'
  | 'Guides'
  | 'Halakhah'
  | 'Jewish Thought'
  | 'Kabbalah'
  | 'Liturgy'
  | 'Midrash'
  | 'Mishnah'
  | 'Musar'
  | 'Reference'
  | 'Responsa'
  | 'Second Temple'
  | 'Talmud'
  | 'Tanakh'
  | 'Targum'
  | 'Tosefta';
