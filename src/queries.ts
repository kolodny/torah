import { and, eq, gte, lte, or, sql } from 'drizzle-orm';
import _ from 'lodash';
import { db, schema } from './main';

type Toc = Pick<
  typeof schema.toc.$inferSelect,
  | 'id'
  | 'hasContent'
  | 'titleHebrew'
  | 'titleEnglish'
  | 'fileSize'
  | 'contentEntries'
  | 'categoryHebrew'
  | 'parentId'
>;
export type Node = Omit<Partial<Toc>, 'id'> & {
  id: number;
  children: Node[];
  parent?: Node | undefined;
};

const buildHierarchy = (data: Toc[]) => {
  const root: Node = { id: 0, children: [] };

  const nodes: Record<string, Node> = { 0: root };

  for (const topic of data) {
    nodes[topic.id] = { ...topic, children: [] };
  }
  for (const node of Object.values(nodes)) {
    const parent = node.id !== 0 ? nodes[node.parentId ?? 0] : undefined;
    parent?.children.push(node);
    node.parent = parent;
  }

  return nodes;
};

export const getToc = async () => {
  const toc = await db.query.toc.findMany({
    columns: {
      id: true,
      hasContent: true,
      titleHebrew: true,
      titleEnglish: true,
      fileSize: true,
      contentEntries: true,
      categoryHebrew: true,
      parentId: true,
    },
  });
  const hierarchy = buildHierarchy(toc);
  return hierarchy;
};

export const getContent = async (tocId: number) => {
  const content = await db
    .select()
    .from(schema.content)
    .where(eq(schema.content.tocId, tocId))
    .all();

  return content;
};

export const getLinks = async (
  tocId: number,
  minLine = 0,
  maxLine = Infinity
) => {
  const links = await db.query.links.findMany({
    columns: {
      id: true,
      fromId: true,
      fromLine: true,
      toId: true,
      toLine: true,
      connectionType: true,
    },
    where: or(
      and(
        gte(schema.links.fromLine, minLine),
        lte(schema.links.fromLine, maxLine),
        eq(schema.links.fromId, tocId)
      ),
      and(
        gte(schema.links.toLine, minLine),
        lte(schema.links.toLine, maxLine),
        eq(schema.links.toId, tocId)
      )
    ),
  });
  const byLine = _.groupBy(links, (link) =>
    link.fromId === tocId ? link.fromLine : link.toLine
  );
  return _.mapValues(byLine, (links) => {
    return links.map((link) => {
      const isFrom = link.fromId === tocId;
      const line = isFrom ? link.fromLine : link.toLine;
      const otherLine = isFrom ? link.toLine : link.fromLine;
      const otherId = isFrom ? link.toId : link.fromId;
      return {
        id: link.id,
        line,
        otherId,
        otherLine,
      };
    });
  });
};

export const getGrouped = async () => {
  return Object.fromEntries(
    (
      await db
        .select({
          id: schema.content.tocId,
          count: sql<number>`COUNT(*)`,
        })
        .from(schema.content)
        .groupBy(schema.content.tocId)
        .all()
    ).map(({ id, count }) => [id, count] as const)
  );
};
