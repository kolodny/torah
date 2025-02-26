import { relations } from 'drizzle-orm';
import * as t from 'drizzle-orm/sqlite-core';

export const toc = t.sqliteTable('toc', {
  id: t.integer('id').primaryKey(),
  parentId: t.integer('parent_id'),
  contentEntries: t.integer('content_entries'),
  fileSize: t.integer('file_size'),
  titleEnglish: t.text('title_english'),
  titleHebrew: t.text('title_hebrew'),
  author: t.text('author'),
  publishedDate: t.text('published_date'),
  publishedPlace: t.text('published_place'),
  composedDate: t.text('composed_date'),
  composedPlace: t.text('composed_place'),
  completeEnglish: t.integer('complete_english', { mode: 'boolean' }),
  completeHebrew: t.integer('complete_hebrew', { mode: 'boolean' }),
  descriptionEnglish: t.text('description_english'),
  descriptionHebrew: t.text('description_hebrew'),
  descriptionShortEnglish: t.text('description_short_english'),
  descriptionShortHebrew: t.text('description_short_hebrew'),
  categories: t.text('categories', { mode: 'json' }).$type<string[]>(),
  mainOrder: t.integer('main_order'),
  baseTextOrder: t.integer('base_text_order'),
  hidden: t.integer('hidden', { mode: 'boolean' }),
  categoryEnglish: t.text('category_english'),
  categoryHebrew: t.text('category_hebrew'),
  primaryCategory: t.text('primary_category'),
  dependence: t.text('dependence'),
  collectiveTitleEnglish: t.text('collective_title_english'),
  collectiveTitleHebrew: t.text('collective_title_hebrew'),
  commentatorEnglish: t.text('commentator_english'),
  commentatorHebrew: t.text('commentator_hebrew'),
  corpus: t.text('corpus'),
  hasContent: t.integer('has_content', { mode: 'boolean' }),
});

export const content = t.sqliteTable(
  'content',
  {
    id: t.integer('id').primaryKey(),
    tocId: t.integer('toc_id').notNull(),
    sectionPath: t.text('section_path', { mode: 'json' }).$type<string[]>(),
    sectionName: t.text('section_name'),
    line: t.integer('line').notNull(),
    text: t.text('text'),
  },
  (table) => [
    t.index('toc_id_idx').on(table.tocId),
    t.index('section_path_idx').on(table.sectionPath),
  ]
);

export const links = t.sqliteTable(
  'links',
  {
    id: t.integer('id').primaryKey(),
    fromId: t.integer('from_id').notNull(),
    fromLine: t.integer('from_line').notNull(),
    toId: t.integer('to_id').notNull(),
    toLine: t.integer('to_line').notNull(),
    connectionType: t.text('connection_type'),
  },
  (table) => [
    t.index('from_id_idx').on(table.fromId),
    t.index('from_id_line_idx').on(table.fromId, table.fromLine),
    t.index('to_id_idx').on(table.toId),
    t.index('to_id_line_idx').on(table.toId, table.toLine),
    t
      .unique('unique_link')
      .on(table.fromId, table.fromLine, table.toId, table.toLine),
  ]
);

export const sortLinkRow = (row: typeof links.$inferInsert) => {
  const [fromId, fromLine, toId, toLine] = (() => {
    const { fromId, fromLine, toId, toLine } = row;
    if (fromId === toId) {
      return fromLine < toLine
        ? [fromId, fromLine, toId, toLine]
        : [toId, toLine, fromId, fromLine];
    }
    return fromId < toId
      ? [fromId, fromLine, toId, toLine]
      : [toId, toLine, fromId, fromLine];
  })();

  const sorted = {
    fromId,
    fromLine,
    toId,
    toLine,
    connectionType: row.connectionType,
  };

  return sorted;
};

export const tocRelations = relations(toc, ({ many }) => ({
  contents: many(content),
  linksFrom: many(links, { relationName: 'fromToc' }),
  linksTo: many(links, { relationName: 'toToc' }),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  toc: one(toc, { fields: [content.tocId], references: [toc.id] }),
  linksFrom: many(links, { relationName: 'fromContent' }),
  linksTo: many(links, { relationName: 'toContent' }),
}));

export const linksRelations = relations(links, ({ one }) => ({
  from: one(content, { fields: [links.fromId], references: [content.tocId] }),
  to: one(content, { fields: [links.toId], references: [content.tocId] }),
  fromContent: one(content, {
    fields: [links.fromId],
    references: [content.tocId],
  }),
  toContent: one(content, {
    fields: [links.toId],
    references: [content.tocId],
  }),
}));
