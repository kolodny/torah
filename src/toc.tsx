import React from 'react';
import { db, schema, worker } from './main';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { and, eq, or, sql } from 'drizzle-orm';
import { NumberParam, useQueryParams } from 'use-query-params';
import _ from 'lodash';

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
type Node = Omit<Partial<Toc>, 'id'> & {
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

const formatBytes = (bytes: number) =>
  new Intl.NumberFormat('en', {
    style: 'unit',
    unit: 'byte',
    unitDisplay: 'narrow',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
    .format(bytes)
    .replace(/BB/, 'GB');

const Links: React.FunctionComponent<{
  links: Array<{
    id: number;
    other: Node;
    line: number;
    otherId: number;
    otherLine: number;
  }>;
}> = ({ links }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [, updateParams] = useQueryParams();
  const map = (link: (typeof links)[number]) => {
    const label = `${link.other.titleHebrew} ${link.otherLine}`;
    return (
      <div key={link.id}>
        <a
          onClick={(e) => {
            e.preventDefault();
            const current = link.other.id;
            const params = { line: link.otherLine, current };
            updateParams(params);
          }}
          href={`/?current=${link.other.id}&line=${link.otherLine}`}
        >
          {label}
        </a>
      </div>
    );
  };

  if (links.length < 5) return links.map(map);

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Hide' : `Show ${links.length}`} links
      </button>
      {expanded ? links.map(map) : null}
    </div>
  );
};

export const Toc: React.FC = () => {
  const toc = useQuery({
    queryKey: ['toc'],
    queryFn: async () => {
      const tocs = await db.query.toc.findMany({
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

      return buildHierarchy(tocs);
    },
  });
  const [params, updateParams] = useQueryParams({
    line: NumberParam,
    current: NumberParam,
  });
  const line = params.line;
  const current = params.current ?? 0;

  const links = useQuery({
    queryKey: ['links', current],
    queryFn: async () => {
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
            // gte(schema.links.fromLine, 3),
            // lte(schema.links.fromLine, 33),
            eq(schema.links.fromId, current)
          ),
          and(
            // gte(schema.links.toLine, 3),
            // lte(schema.links.toLine, 33),
            eq(schema.links.toId, current)
          )
        ),
        // limit: 100,
      });
      const byLine = _.groupBy(links, (link) =>
        link.fromId === current ? link.fromLine : link.toLine
      );
      return _.mapValues(byLine, (links) => {
        return links.map((link) => {
          const isFrom = link.fromId === current;
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
    },
  });

  const client = useQueryClient();
  const content = useQuery({
    queryKey: ['content', current],
    queryFn: async () => {
      return db
        .select()
        .from(schema.content)
        .where(eq(schema.content.tocId, current))
        .all();
    },
  });

  const grouped = useQuery({
    queryKey: ['content', 'grouped'],
    queryFn: async () => {
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
    },
  });

  const data = toc.data;

  const breadcrumbs = React.useMemo(() => {
    const path: number[] = [];
    let node = data?.[current];
    while (node) {
      path.unshift(node.id ?? 0);
      node = node.parent;
    }
    return path;
  }, [current, data]);

  React.useEffect(() => {
    asyncEffect();
    async function asyncEffect() {
      if (data?.[current]?.hasContent && content.data?.length === 0) {
        let lastPercent = -1;
        await worker.merge(current, (info) => {
          const percent = Math.floor((info.processed / info.total) * 100);
          if (percent !== lastPercent) {
            const message = `Downloading "${data?.[current].titleEnglish}" ${percent}% done`;
            console.log(message);
            lastPercent = percent;
          }
        });
        client.invalidateQueries({ queryKey: ['content'] });
        client.invalidateQueries({ queryKey: ['links'] });
      }
    }
  }, [client, content.data?.length, current, data]);

  if (toc.isLoading) return <div>Loading...</div>;
  if (toc.error) return <div>Error: {toc.error.message}</div>;
  if (!data) return <div>No data</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const windowAny = window as any;
  windowAny.data = data;
  windowAny.content = content;

  let download = <></>;
  if (data[current]?.hasContent && content.data?.length === 0) {
    download = <>Downloading {data[current].titleHebrew}</>;
  }

  const title = (node?: Node) => node?.categoryHebrew ?? node?.titleHebrew;
  const calculateSize = (node: Node) => {
    let size = data[node.id]?.fileSize ?? 0;
    for (const child of node.children) {
      size += calculateSize(child);
    }
    return size;
  };
  const calculateMissingBytes = (node: Node) => {
    if (grouped.isLoading || toc.isLoading) return 0;
    const localNode = grouped.data?.[node.id];
    const actual = data[node.id]?.contentEntries ?? 0;
    let size = localNode === actual ? 0 : data[node.id].fileSize ?? 0;
    for (const child of node.children) {
      size += calculateMissingBytes(child);
    }
    return size;
  };

  let table = <></>;
  const children = data[current].children;
  if (children.length) {
    table = (
      <table>
        <thead>
          <tr>
            <td>Name</td>
            <th>Total size</th>
            <th>Missing</th>
          </tr>
        </thead>
        <tbody>
          {children.map((topic) => {
            return (
              <tr key={topic.id}>
                <td>
                  <a
                    href=""
                    onClick={(e) => {
                      e.preventDefault();
                      updateParams({ current: topic.id, line: null });
                    }}
                  >
                    {title(topic)}
                  </a>
                </td>
                <td>{formatBytes(calculateSize(topic))}</td>
                <td>{formatBytes(calculateMissingBytes(topic))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div style={{ direction: 'rtl' }}>
      <h2
        style={{
          position: 'sticky',
          top: 0,
          background: 'white',
          margin: 0,
          padding: 10,
        }}
      >
        {breadcrumbs.map((id, index) => {
          const missingBytes = calculateMissingBytes(data[id]);
          const missing = !missingBytes
            ? ''
            : `(Missing ${formatBytes(missingBytes)})`;
          return (
            <span key={id}>
              {index ? ' > ' : null}
              <a
                href={`/${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  updateParams({ current: id, line: null });
                }}
              >
                {id === 0 ? 'Root' : title(data[id])} {missing}
              </a>
            </span>
          );
        })}
      </h2>
      {table}

      {content.isLoading ? <div>Loading content...</div> : null}
      {download}

      {console.time('table') as never}
      {!!content.data?.length && (
        <div>
          <table>
            <thead>
              <tr
                style={{
                  position: 'sticky',
                  top: 48,
                  background: 'white',
                }}
              >
                <td>Section Path</td>
                <td>Line</td>
                <td>Text</td>
                <td>Links</td>
              </tr>
            </thead>
            <tbody>
              {content.data?.map((data) => {
                const thisItem = line === data.line;
                const linksWithOther =
                  links.data?.[data.line ?? 0]?.map((link) => {
                    return { ...link, other: toc.data[link.otherId] };
                  }) ?? [];
                return (
                  <tr key={data.id}>
                    <td>{data.sectionPath?.join(' > ')}</td>
                    <td>{data.line}</td>
                    <td>
                      <div
                        ref={
                          thisItem
                            ? (e) => e?.scrollIntoView({ block: 'center' })
                            : undefined
                        }
                        style={{
                          display: 'inline-block',
                          maxWidth: '50vw',
                          background: thisItem ? 'yellow' : 'none',
                        }}
                        dangerouslySetInnerHTML={{ __html: data.text ?? '' }}
                      />
                    </td>
                    <td>
                      {links.isLoading ? (
                        'Loading links...'
                      ) : (
                        <Links links={linksWithOther} />
                      )}
                    </td>
                  </tr>
                );
              })}
              {console.timeEnd('table') as never}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
