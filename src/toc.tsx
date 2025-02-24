import React from 'react';
import { worker } from './main';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NumberParam, useQueryParams } from 'use-query-params';
import _ from 'lodash';
import { getContent, getGrouped, getLinks, getToc, Node } from './queries';

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
    queryFn: getToc,
  });
  const [params, updateParams] = useQueryParams({
    line: NumberParam,
    current: NumberParam,
  });
  const line = params.line;
  const current = params.current ?? 0;

  const client = useQueryClient();
  const content = useQuery({
    queryKey: ['content', current],
    queryFn: async () => getContent(current),
  });

  // const [section, setSection] = React.useState<string | undefined>(undefined);
  // const sections = React.useMemo(() => {
  //   if (!content.data) return undefined;
  //   const bySection = _.groupBy(content.data, (data) =>
  //     data.sectionPath?.join(' > ')
  //   );

  //   return bySection;
  // }, [content.data]);

  // console.log(sections);

  // React.useEffect(() => {
  //   if (!section && sections) {
  //     const firstSection = Object.entries(sections).find(
  //       ([, value]) => value.length > 1
  //     )?.[0];

  //     if (firstSection) setSection(firstSection);
  //     // setSection(firstSection);
  //   }
  // }, [section, sections]);

  // const thisSection = sections
  //   ? section && section in sections
  //     ? sections[section]
  //     : Object.values(sections)[0]
  //   : undefined;

  // const minLine = Math.min(...(thisSection?.map((l) => l.line!) ?? []));
  // const maxLine = Math.max(...(thisSection?.map((l) => l.line!) ?? []));
  // console.log({ thisSection, minLine, maxLine });

  const links = useQuery({
    // queryKey: ['links', current, minLine, maxLine],
    // queryFn: async () => await getLinks(current, minLine, maxLine),
    queryKey: ['links', current],
    queryFn: async () => await getLinks(current),
  });

  const grouped = useQuery({
    queryKey: ['content', 'grouped'],
    queryFn: getGrouped,
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

  const [downloading, setDownloading] = React.useState(false);

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
          const missing = !missingBytes ? (
            ''
          ) : (
            <>
              <button
                disabled={downloading}
                onClick={async (e) => {
                  setDownloading(true);
                  console.time('download');
                  e.preventDefault();
                  const recur = async (node: Node) => {
                    const localNode = grouped.data?.[node.id];
                    if (!localNode && toc.data?.[node.id]?.hasContent) {
                      await worker.merge(node.id, (info) => {
                        const percent = Math.floor(
                          (info.processed / info.total) * 100
                        );
                        console.log(
                          `Downloading "${node.titleEnglish}" ${percent}% done`
                        );
                      });
                    }
                    for (const child of node.children) {
                      await recur(child);
                    }
                    client.invalidateQueries({
                      queryKey: ['content', 'grouped'],
                    });
                  };
                  await recur(data[id]);
                  client.invalidateQueries({ queryKey: ['links'] });
                  console.timeEnd('download');
                  setDownloading(false);
                }}
              >
                Download {formatBytes(missingBytes)} missing
              </button>
            </>
          );
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
                {id === 0 ? 'Root' : title(data[id])}
              </a>
              {missing}
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
          {/* Section {section} */}
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
              {content.data.map((data) => {
                const thisItem = line === data.line;
                const linksWithOther =
                  links.data?.[data.line ?? 0]?.map((link) => {
                    return { ...link, other: toc.data[link.otherId] };
                  }) ?? [];
                const sectionPath = [...(data.sectionPath ?? [])];
                if (data.sectionName) sectionPath?.push(data.sectionName);

                return (
                  <tr key={data.id}>
                    <td>{sectionPath?.join(' > ')}</td>
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
