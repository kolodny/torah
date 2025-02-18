import React from 'react';
import { db, schema, worker } from './main';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eq, sql } from 'drizzle-orm';
import { useUrlParam } from './use-url-param';

type Toc = typeof schema.toc.$inferSelect;
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

export const Toc: React.FC = () => {
  const toc = useQuery({
    queryKey: ['toc'],
    queryFn: async () => {
      const tocs = await db.select().from(schema.toc).all();
      return buildHierarchy(tocs);
    },
  });
  const [current, setCurrent] = useUrlParam('id', '0');

  const links = useQuery({
    queryKey: ['links', current],
    queryFn: async () => {
      return db
        .select()
        .from(schema.links)
        .where(eq(schema.links.fromId, +current))
        .all();
    },
  });

  const client = useQueryClient();
  const content = useQuery({
    queryKey: ['content', current],
    queryFn: async () => {
      return db
        .select()
        .from(schema.content)
        .where(eq(schema.content.tocId, +current))
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

  if (toc.isLoading) return <div>Loading...</div>;
  if (toc.error) return <div>Error: {toc.error.message}</div>;
  if (!data) return <div>No data</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const windowAny = window as any;
  windowAny.data = data;
  windowAny.content = content;

  let download = <></>;
  if (data[current]?.hasContent && content.data?.length === 0) {
    download = (
      <button
        onClick={async () => {
          let lastPercent = -1;
          await worker.merge(+current, (info) => {
            const percent = Math.floor((info.processed / info.total) * 100);
            if (percent !== lastPercent) {
              const message = `Downloading "${data[current].titleEnglish}" ${percent}% done`;
              console.log(message);
              lastPercent = percent;
            }
          });
          client.invalidateQueries({ queryKey: ['content'] });
        }}
      >
        Download
      </button>
    );
  }

  const title = (node?: Node) => node?.categoryEnglish ?? node?.titleEnglish;
  const calculateSize = (node: Node) => {
    let size = data[node.id]?.fileSize ?? 0;
    for (const child of node.children) {
      size += calculateSize(child);
    }
    return size;
  };
  const calculateMissingBytes = (node: Node) => {
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
                      setCurrent(`${topic.id}`);
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
    <div>
      <h2>
        {breadcrumbs.map((id, index) => (
          <span key={id}>
            {index ? ' > ' : null}
            <a
              href={`/${id}`}
              onClick={(e) => {
                e.preventDefault();
                setCurrent(`${id}`);
              }}
            >
              {id === 0 ? 'Root' : title(data[id])} (Missing{' '}
              {formatBytes(calculateMissingBytes(data[id]))})
            </a>
          </span>
        ))}
      </h2>
      {table}

      {content.isLoading ? <div>Loading content...</div> : null}
      {download}

      {!!content.data?.length && (
        <div style={{ direction: 'rtl' }}>
          <table>
            <thead>
              <tr>
                <td>Section Path</td>
                <td>Text</td>
                <td>Links</td>
              </tr>
            </thead>
            <tbody>
              {content.data?.map((data) => {
                const linksForLine = [
                  ...new Set(
                    links.data?.filter((link) => link.fromLine === data.line)
                  ),
                ].map((link) => {
                  const other =
                    link.fromId === +current ? link.toId : link.fromId;
                  return { ...link, other: toc.data[other] };
                });
                return (
                  <tr key={data.id}>
                    <td>{data.sectionPath?.join(' > ')}</td>
                    <td>
                      <div
                        style={{
                          display: 'inline-block',
                          maxWidth: '50vw',
                        }}
                        dangerouslySetInnerHTML={{ __html: data.text ?? '' }}
                      />
                    </td>
                    <td>
                      {linksForLine.map((link) => (
                        <div key={link.id}>{link.other.titleEnglish}</div>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
