import { and, eq, or, sql } from 'drizzle-orm';
import _ from 'lodash';
import { getOrm } from './orm';

type Schema = Awaited<ReturnType<typeof getOrm>>['schema'];

type Toc = Pick<
  Schema['toc']['$inferSelect'],
  | 'id'
  | 'hasContent'
  | 'titleHebrew'
  | 'titleEnglish'
  | 'fileSize'
  | 'contentEntries'
  | 'categoryHebrew'
  | 'categoryEnglish'
  | 'parentId'
  | 'skip'
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
    if (node.skip) continue;
    const parent = node.id !== 0 ? nodes[node.parentId ?? 0] : undefined;
    parent?.children.push(node);
    node.parent = parent;
  }

  return nodes;
};

export const getToc = async () => {
  const { db } = await getOrm();
  const toc = await db.query.toc.findMany({
    columns: {
      id: true,
      hasContent: true,
      titleHebrew: true,
      titleEnglish: true,
      fileSize: true,
      contentEntries: true,
      categoryHebrew: true,
      categoryEnglish: true,
      parentId: true,
      skip: true,
    },
  });
  const hierarchy = buildHierarchy(toc);
  return hierarchy;
};

export const getMeta = async (tocId: number) => {
  const { db, schema } = await getOrm();
  const meta = await db
    .select()
    .from(schema.meta)
    .where(eq(schema.meta.tocId, tocId))
    .all();

  if (meta.length === 0) {
    // Return a default meta object if no meta data is found
    return {
      id: 0,
      tocId,
      schema: {
        schema: [],
      },
    };
  }

  return meta[0];
};

export const getContent = async (tocId: number) => {
  const { db, schema } = await getOrm();
  const content = await db
    .select()
    .from(schema.content)
    .where(eq(schema.content.tocId, tocId))
    .all();

  return content;
};

export const getLinks = async (
  tocId: number
  // minLine = 0,
  // maxLine = Infinity
) => {
  const { db, schema } = await getOrm();
  const links = await db.query.links.findMany({
    where: or(
      and(
        // gte(schema.links.fromLine, minLine),
        // lte(schema.links.fromLine, maxLine),
        eq(schema.links.fromId, tocId)
      ),
      and(
        // gte(schema.links.toLine, minLine),
        // lte(schema.links.toLine, maxLine),
        eq(schema.links.toId, tocId)
      )
    ),
  });
  const byLine = _.groupBy(links, (link) =>
    link.fromId === tocId ? link.fromRef : link.toRef
  );
  return _.mapValues(byLine, (links) => {
    return links.map((link) => {
      const isFrom = link.fromId === tocId;
      const ref = isFrom ? link.fromRef : link.toRef;
      const otherRef = isFrom ? link.toRef : link.fromRef;
      const otherId = isFrom ? link.toId : link.fromId;
      return {
        id: link.id,
        ref,
        otherId,
        otherRef,
        connectionType: link.connectionType,
      };
    });
  });
};

export const getGrouped = async () => {
  const { db, schema } = await getOrm();
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
