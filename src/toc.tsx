import React from 'react';
import { getOrm } from './orm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  NumberParam,
  StringParam,
  useQueryParam,
  useQueryParams,
  withDefault,
} from 'use-query-params';
import {
  getContent,
  getGrouped,
  getLinks,
  getMeta,
  getToc,
  Node,
} from './queries';
import _ from 'lodash';
import { getSectionsFromRef } from './shared';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';

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
    ref: string;
    otherId: number;
    otherRef: string;
  }>;
}> = ({ links }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [, updateParams] = useQueryParams();
  const map = (link: (typeof links)[number]) => {
    const label = `${link.other.titleEnglish} ${link.otherRef}`;
    return (
      <div key={link.id}>
        <a
          onClick={(e) => {
            e.preventDefault();
            const current = link.other.id;
            const params = { ref: link.otherRef, current };
            updateParams(params);
          }}
          href={`/?current=${link.other.id}&ref=${link.otherRef}`}
        >
          {label}
        </a>
      </div>
    );
  };

  if (links.length < 5) return links.map(map);

  return (
    <div>
      <Button
        size="small"
        variant="outlined"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Hide' : `Show ${links.length}`} links
      </Button>
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
    ref: StringParam,
    current: NumberParam,
  });
  const ref = params.ref;
  const current = params.current ?? 0;

  const client = useQueryClient();
  const content = useQuery({
    queryKey: ['content', current],
    queryFn: async () => getContent(current),
  });

  const meta = useQuery({
    queryKey: ['meta', current],
    queryFn: async () => getMeta(current),
    enabled: !!current,
  });

  const links = useQuery({
    queryKey: ['links', current],
    queryFn: async () => await getLinks(current),
  });

  React.useEffect(() => {
    console.log({
      current: toc.data?.[current],
      links: links.data,
      content: content.data,
      minSchema: meta.data,
    });
  }, [content.data, current, links.data, meta.data, toc.data]);

  const sections = React.useMemo(() => {
    if (!content.data) return undefined;
    if (!meta.data) return undefined;
    const contentSections = content.data.map((c) => ({
      ...c,
      sections: getSectionsFromRef(c.ref, meta.data.schema.schema),
    }));
    const grouped = _.groupBy(contentSections, (sections) =>
      sections.sections
        ?.map((s) => `${s.name}${s.number ? ` ${s.number}` : ''}`)
        .slice(0, -1)
        .join(' > ')
    );
    const newSections = Object.entries(grouped).map(
      ([sectionName, contents]) => ({
        sectionName,
        contents,
      })
    );
    return newSections;
  }, [content.data, meta.data]);

  const [sectionIndex, setSectionIndex] = useQueryParam(
    'section',
    withDefault(NumberParam, 0),
    { removeDefaultsFromUrl: true }
  );

  const refSectionIndex = React.useMemo(() => {
    return sections?.findIndex((section) =>
      section.contents.find((content) => content.ref === ref)
    );
  }, [ref, sections]);

  const refSectionIndexRef = React.useRef(refSectionIndex);
  refSectionIndexRef.current = refSectionIndex;
  React.useEffect(() => {
    if (content.data) {
      setSectionIndex(Math.max(refSectionIndexRef.current ?? 0, 0));
    }
  }, [content.data, setSectionIndex]);

  const thisSection = React.useMemo(() => {
    if (sectionIndex == undefined || !content.data) return undefined;
    return sections?.[sectionIndex];
  }, [sectionIndex, content.data, sections]);

  const grouped = useQuery({
    queryKey: ['grouped'],
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
      const { worker } = await getOrm();
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
        client.invalidateQueries({ queryKey: ['meta'] });
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
    download = (
      <Typography>Downloading {data[current].titleEnglish}</Typography>
    );
  }

  const title = (node?: Node) => node?.categoryEnglish ?? node?.titleEnglish;
  const calculateSize = (node: Node) => {
    let size = data[node.id]?.hasContent ? data[node.id]?.fileSize ?? 0 : 0;
    for (const child of node.children) {
      size += calculateSize(child);
    }
    return size;
  };
  const calculateMissingBytes = (node: Node) => {
    if (grouped.isLoading || toc.isLoading) return 0;
    const localNode = grouped.data?.[node.id];
    const info = data[node.id];
    const actual = info?.contentEntries ?? 0;
    let size = info.hasContent
      ? localNode === actual
        ? 0
        : info.fileSize ?? 0
      : 0;
    for (const child of node.children) {
      size += calculateMissingBytes(child);
    }
    return size;
  };

  const children = data[current].children;

  const sectionPicker = () => {
    // Don't render the section picker if sections are not available yet
    if (!sections || sections.length === 0) {
      return null;
    }

    return (
      <Box sx={{ display: 'flex', gap: 1, my: 2 }}>
        <Button
          variant="outlined"
          size="small"
          disabled={!sectionIndex}
          onClick={() => setSectionIndex(sectionIndex! - 1)}
        >
          Previous
        </Button>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={`${sectionIndex}`}
            onChange={(e) => setSectionIndex(+e.target.value)}
            displayEmpty={false}
          >
            {sections.map((section, index) => (
              <MenuItem
                key={section.sectionName || `section-${index}`}
                value={index}
              >
                {section.sectionName || `Section ${index + 1}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          size="small"
          disabled={sectionIndex! >= sections.length - 1}
          onClick={() => setSectionIndex(sectionIndex! + 1)}
        >
          Next
        </Button>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        direction: 'rtl',
        '& button': { fontFamily: 'inherit' },
        '& a': { textDecoration: 'none' },
      }}
    >
      <Button
        variant="outlined"
        color="error"
        size="small"
        sx={{ mb: 2 }}
        onClick={async () => {
          if (!confirm('Are you sure?')) return;
          const { worker } = await getOrm();
          await worker.wipe();
          location.reload();
        }}
      >
        Wipe out DB
      </Button>

      <Typography
        variant="h5"
        component="h2"
        sx={{
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          m: 0,
          p: 1,
          zIndex: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {breadcrumbs.map((id, index) => {
          const missingBytes = calculateMissingBytes(data[id]);
          const missing = !missingBytes ? (
            ''
          ) : (
            <>
              <Button
                size="small"
                variant="text"
                disabled={downloading}
                onClick={async (e) => {
                  setDownloading(true);
                  const node = data[id];
                  const timeKey = `download ${
                    node.titleEnglish ?? node.categoryEnglish
                  }`;
                  console.time(timeKey);
                  e.preventDefault();
                  const log = _.throttle((message: string) => {
                    console.log(message);
                  }, 1000);
                  const invalidate = _.throttle(() => {
                    return Promise.all([
                      client.invalidateQueries({ queryKey: ['grouped'] }),
                    ]);
                  }, 100);
                  const { worker } = await getOrm();
                  const recur = async (node: Node) => {
                    const localNode = grouped.data?.[node.id];
                    if (!localNode && toc.data?.[node.id]?.hasContent) {
                      await worker.merge(node.id, ({ processed, total }) => {
                        const percent = Math.floor((processed / total) * 100);
                        const msg = `Downloading "${node.titleEnglish}" ${percent}% done`;
                        log(msg);
                      });
                    }
                    for (const child of node.children) await recur(child);

                    await invalidate();
                  };
                  await recur(data[id]);
                  console.timeEnd(timeKey);
                  setDownloading(false);
                }}
              >
                Download {formatBytes(missingBytes)} missing
              </Button>
            </>
          );
          return (
            <span key={id}>
              {index ? ' > ' : null}
              <a
                href={`/${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  updateParams({ current: id, ref: null });
                }}
              >
                {id === 0
                  ? 'Root'
                  : data[id].titleHebrew ?? data[id].categoryHebrew}
              </a>
              {missing}
            </span>
          );
        })}
      </Typography>

      {children.length > 0 && (
        <TableContainer component={Paper} sx={{ my: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Total size</TableCell>
                <TableCell align="right">Missing</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {children.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell>
                    <a
                      href=""
                      onClick={(e) => {
                        e.preventDefault();
                        updateParams({ current: topic.id, ref: null });
                      }}
                    >
                      {title(topic)}
                    </a>
                  </TableCell>
                  <TableCell align="right">
                    {formatBytes(calculateSize(topic))}
                  </TableCell>
                  <TableCell align="right">
                    {formatBytes(calculateMissingBytes(topic))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {content.isLoading && <Typography>Loading content...</Typography>}
      {download}

      {!!thisSection?.contents?.length && (
        <Box>
          {sectionPicker()}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    position: 'sticky',
                    top: 48,
                    bgcolor: 'background.paper',
                  }}
                >
                  <TableCell>Reference</TableCell>
                  <TableCell>Text</TableCell>
                  <TableCell>Links</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {thisSection.contents
                  .filter((d) => !d.isEnglish)
                  .map((data) => {
                    const thisItem = ref === data.ref;
                    const linksWithOther =
                      links.data?.[data.ref ?? 0]?.map((link) => {
                        return { ...link, other: toc.data[link.otherId] };
                      }) ?? [];
                    const translation = thisSection.contents.find(
                      (r) => r.isEnglish && r.ref === data.ref
                    );

                    return (
                      <TableRow key={data.id} sx={{ verticalAlign: 'top' }}>
                        <TableCell>{data.ref}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              maxWidth: '50vw',
                              bgcolor: thisItem ? 'yellow' : 'transparent',
                            }}
                          >
                            <div
                              ref={
                                thisItem
                                  ? (e) =>
                                      e?.scrollIntoView({ block: 'center' })
                                  : undefined
                              }
                              dangerouslySetInnerHTML={{
                                __html: data.text ?? '',
                              }}
                            />
                            {translation && (
                              <details>
                                <summary
                                  style={{ display: 'flex', minWidth: 100 }}
                                >
                                  Toggle English
                                </summary>
                                <div
                                  style={{
                                    display: 'inline-block',
                                    maxWidth: '30vw',
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: translation.text ?? '',
                                  }}
                                />
                              </details>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {links.isLoading ? (
                            'Loading links...'
                          ) : (
                            <Links links={linksWithOther} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          {sectionPicker()}
        </Box>
      )}
    </Box>
  );
};
