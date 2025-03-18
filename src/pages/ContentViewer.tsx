import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Chip,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  NavigateBefore,
  Translate,
  Link as LinkIcon,
  Search,
  ExpandMore,
} from '@mui/icons-material';
import {
  NumberParam,
  StringParam,
  useQueryParam,
  useQueryParams,
  withDefault,
} from 'use-query-params';
import _ from 'lodash';
import { getContent, getLinks, getMeta, getToc, Node } from '../queries';
import { getSectionsFromRef } from '../shared';
import { getOrm } from '../orm';

// Common styles
const cardStyles = {
  cursor: 'pointer',
  '&:hover': {
    boxShadow: 2,
  },
};

const accordionStyles = {
  '&:before': { display: 'none' },
  border: '1px solid',
  borderColor: 'divider',
  mb: 1,
};

// Extend the Node type to include connectionType and path
interface LinkNode extends Node {
  connectionType?: string;
  path?: string;
}

interface LinksProps {
  links: Array<{
    id: number;
    other: LinkNode;
    ref: string;
    otherId: number;
    otherRef: string;
    connectionType: string | null;
  }>;
}

// Function to filter links based on search term
const filterLinksBySearchTerm = (
  link: LinksProps['links'][number],
  searchTerm: string
) =>
  !searchTerm ||
  (link.other.titleEnglish?.toLowerCase() || '').includes(
    searchTerm.toLowerCase()
  ) ||
  (link.otherRef?.toLowerCase() || '').includes(searchTerm.toLowerCase());

// Links component for displaying related references
const Links: React.FunctionComponent<LinksProps> = ({ links }) => {
  const [, updateParams] = useQueryParams();
  const [expanded, setExpanded] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Group links by type (commentary, targum, reference, etc.)
  const groupedLinks = React.useMemo(() => {
    // Extract connection type from the links
    const groups: Record<string, typeof links> = {};

    links.forEach((link) => {
      // Use the connectionType field if available, otherwise infer from content
      const type = link.connectionType || 'other';

      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(link);
    });

    return groups;
  }, [links]);

  const handleLinkClick = (link: (typeof links)[number]) => {
    const current = link.other.id;
    const params = { ref: link.otherRef, current };
    updateParams(params);
  };

  if (links.length === 0) {
    return null;
  }

  // If there are too many links, show a more compact interface
  if (links.length > 20) {
    return (
      <Box sx={{ mt: 1 }}>
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setExpanded(!expanded)}
            startIcon={expanded ? null : <LinkIcon />}
            sx={{ mr: 1 }}
          >
            {expanded ? 'Hide' : `Show ${links.length}`} links
          </Button>

          {expanded && (
            <TextField
              size="small"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              variant="outlined"
              sx={{ ml: 1, flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          )}
        </Box>

        {expanded && (
          <Box sx={{ mt: 1 }}>
            {Object.entries(groupedLinks).map(([type, typeLinks]) => {
              // Filter links based on search term
              const filteredLinks = typeLinks.filter((link) =>
                filterLinksBySearchTerm(link, searchTerm)
              );

              return (
                <Accordion
                  key={type}
                  disableGutters
                  elevation={0}
                  sx={accordionStyles}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography
                      variant="subtitle2"
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {type} ({filteredLinks.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 1 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {filteredLinks.map((link) => (
                        <Chip
                          key={link.id}
                          label={`${link.other.titleEnglish} ${link.otherRef}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleLinkClick(link)}
                          icon={<LinkIcon fontSize="small" />}
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </Box>
    );
  }

  // For a small number of links, show them directly
  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {links.map((link) => (
          <Chip
            key={link.id}
            label={`${link.other.titleEnglish} ${link.otherRef}`}
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => handleLinkClick(link)}
            icon={<LinkIcon fontSize="small" />}
            sx={{ mb: 1 }}
          />
        ))}
      </Stack>
    </Box>
  );
};

// Define a type for section content
interface SectionContent {
  id: number;
  tocId: number;
  ref: string;
  text: string | null;
  isEnglish: boolean | null;
  sections?: Array<{ name: string; nameHebrew: string; number?: string }>;
}

// Section picker component
const SectionPicker: React.FC<{
  sections: Array<{ sectionName: string; contents: SectionContent[] }>;
  currentIndex: number;
  onChange: (index: number) => void;
}> = ({ sections, currentIndex, onChange }) => {
  if (!sections || sections.length === 0) {
    return null;
  }

  const sectionName =
    sections[currentIndex]?.sectionName || `Chapter ${currentIndex + 1}`;

  return (
    <Box sx={{ display: 'flex', gap: 1, my: 2 }}>
      <Button
        variant="outlined"
        size="small"
        disabled={!currentIndex}
        onClick={() => onChange(currentIndex - 1)}
      >
        Previous
      </Button>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <Select
          value={`${currentIndex}`}
          onChange={(e) => onChange(+e.target.value)}
          displayEmpty={false}
          renderValue={() => sectionName}
        >
          {sections.map((section, index) => (
            <MenuItem
              key={section.sectionName || `section-${index}`}
              value={`${index}`}
            >
              {section.sectionName || `Chapter ${index + 1}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        size="small"
        disabled={currentIndex >= sections.length - 1}
        onClick={() => onChange(currentIndex + 1)}
      >
        Next
      </Button>
    </Box>
  );
};

export const ContentViewer: React.FC = () => {
  const [downloading, setDownloading] = React.useState(false);
  const [showTranslations, setShowTranslations] = React.useState<
    Record<string, boolean>
  >({});
  const queryClient = useQueryClient();
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

  const grouped = useQuery({
    queryKey: ['grouped'],
    queryFn: async () => {
      try {
        // Try to get the grouped data from the cache
        return (
          (queryClient.getQueryData(['grouped']) as Record<number, number>) ||
          {}
        );
      } catch (error) {
        console.error('Error getting grouped data:', error);
        return {} as Record<number, number>;
      }
    },
  });

  // Check if content is available for the current node
  const isContentAvailable = React.useMemo(() => {
    if (!toc.data || !grouped.data) return true; // Default to true if data is loading

    const node = toc.data[current];
    if (!node) return true;

    // If content is already loaded, consider it available regardless of grouped data
    if (content.data && content.data.length > 0) return true;

    const localNode = grouped.data[current];
    const actual = node.contentEntries ?? 0;

    // If node has content but it's not downloaded or not fully downloaded
    return !(node.hasContent && (!localNode || localNode < actual));
  }, [current, toc.data, grouped.data, content.data]);

  const sections = React.useMemo(() => {
    if (!content.data) return undefined;
    if (!meta.data) {
      // If meta data is not available, just return the content as is
      // without trying to parse sections
      if (content.data.length === 0) return undefined;

      return [
        {
          sectionName: 'Content',
          contents: content.data.map((c) => ({
            ...c,
            sections: [],
          })),
        },
      ];
    }

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
      ([sectionName, contents], index) => ({
        // If sectionName is empty string, use a default chapter name with index
        sectionName: sectionName || `Chapter ${index + 1}`,
        contents,
      })
    );
    return newSections;
  }, [content.data, meta.data]);

  const titleEnglish = React.useCallback(
    (node: Node) => node.titleEnglish ?? node.categoryEnglish,
    []
  );

  const titleHebrew = React.useCallback(
    (node: Node) => node.titleHebrew ?? node.categoryHebrew,
    []
  );

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

  // Handle scrolling to the referenced content only when ref changes
  React.useEffect(() => {
    if (ref) {
      // Find the content with the matching ref
      const contentElement = document.getElementById(
        `content-${
          thisSection?.contents.find((content) => content.ref === ref)?.id
        }`
      );

      if (contentElement) {
        contentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [ref, thisSection]);

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

  const toggleTranslation = React.useCallback((ref: string) => {
    setShowTranslations((prev) => ({
      ...prev,
      [ref]: !prev[ref],
    }));
  }, []);

  // Memoized log and invalidate functions for download
  const log = _.throttle((message: string) => {
    console.log(message);
  }, 1000);

  const invalidate = _.throttle(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['grouped'] }),
      queryClient.invalidateQueries({ queryKey: ['meta'] }),
      queryClient.invalidateQueries({ queryKey: ['links'] }),
    ]);
  }, 100);

  // Handle downloading content
  const handleDownloadContent = React.useCallback(async () => {
    if (!data || !toc.data) return;

    setDownloading(true);
    try {
      const { worker } = await getOrm();
      const node = data[current];
      const timeKey = `download ${titleEnglish(node)}`;
      console.time(timeKey);

      const recur = async (node: Node) => {
        const localNode = grouped.data?.[node.id];
        if (!localNode && toc.data?.[node.id]?.hasContent) {
          await worker.merge(
            node.id,
            ({ processed, total }: { processed: number; total: number }) => {
              const percent = Math.floor((processed / total) * 100);
              const msg = `Downloading "${node.titleEnglish}" ${percent}% done`;
              log(msg);
            }
          );
        }
        for (const child of node.children) await recur(child);
        await invalidate();
      };

      await recur(data[current]);
      console.timeEnd(timeKey);

      // Invalidate queries to refresh content
      await queryClient.invalidateQueries({
        queryKey: ['content', current],
      });
      await queryClient.invalidateQueries({
        queryKey: ['grouped'],
      });

      // Force refresh the UI to remove the warning message
      await content.refetch();
    } catch (error) {
      console.error('Error downloading content:', error);
    } finally {
      setDownloading(false);
    }
  }, [
    content,
    current,
    data,
    grouped.data,
    invalidate,
    log,
    queryClient,
    titleEnglish,
    toc.data,
  ]);

  if (toc.isLoading || content.isLoading)
    return <Typography>Loading...</Typography>;
  if (toc.error) return <Typography>Error: {toc.error.message}</Typography>;
  if (!data) return <Typography>No data</Typography>;

  return (
    <Box sx={{ p: 2 }}>
      <Box
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
        <Breadcrumbs
          separator={<NavigateBefore fontSize="small" />}
          aria-label="breadcrumb"
          sx={{
            '& .MuiBreadcrumbs-ol': {
              direction: 'rtl',
              justifyContent: 'flex-start',
            },
          }}
        >
          {breadcrumbs.map((id) => (
            <Link
              key={id}
              underline="hover"
              color="inherit"
              component="button"
              onClick={() => updateParams({ current: id, ref: null })}
              sx={{
                fontWeight: id === current ? 'bold' : 'normal',
                color: id === current ? 'primary.main' : 'inherit',
              }}
            >
              {id === 0 ? 'Root' : titleHebrew(data[id])}
            </Link>
          ))}
        </Breadcrumbs>
      </Box>

      {content.isLoading && <Typography>Loading content...</Typography>}

      {!isContentAvailable && (
        <Alert
          severity="warning"
          sx={{ mt: 2, mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              disabled={downloading}
              onClick={handleDownloadContent}
            >
              Download Content
            </Button>
          }
        >
          Content for{' '}
          {titleEnglish(data[current]) ||
            titleHebrew(data[current]) ||
            'this item'}
          is not downloaded. Please download it first.
        </Alert>
      )}

      {(current === 0 || data[current]?.children?.length > 0) && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {current === 0
              ? 'Available Categories'
              : `${titleEnglish(data[current])} Categories`}
          </Typography>
          <Grid container spacing={2}>
            {(current === 0 ? data[0].children : data[current].children).map(
              (category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Card
                    variant="outlined"
                    sx={cardStyles}
                    onClick={() =>
                      updateParams({ current: category.id, ref: null })
                    }
                  >
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {category.titleEnglish || category.categoryEnglish}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {`View content in ${
                          category.titleEnglish || category.categoryEnglish
                        }`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            )}
          </Grid>
        </Box>
      )}

      {!!thisSection?.contents?.length && (
        <Box>
          {sections && (
            <SectionPicker
              sections={sections}
              currentIndex={sectionIndex ?? 0}
              onChange={setSectionIndex}
            />
          )}

          <Typography variant="h6" component="h2" gutterBottom>
            {thisSection.sectionName}
          </Typography>
          <Stack spacing={2}>
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
                const hasTranslation = !!translation;
                const showTranslation = showTranslations[data.ref];

                return (
                  <Card
                    key={data.id}
                    variant="outlined"
                    sx={{
                      bgcolor: thisItem
                        ? 'rgba(255, 255, 0, 0.1)'
                        : 'transparent',
                      borderColor: thisItem ? 'primary.main' : 'divider',
                    }}
                    id={`content-${data.id}`}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {data.ref}
                        </Typography>
                        <Box>
                          {hasTranslation && (
                            <Tooltip title="Toggle English translation">
                              <IconButton
                                size="small"
                                color={showTranslation ? 'primary' : 'default'}
                                onClick={() => toggleTranslation(data.ref)}
                              >
                                <Translate fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ direction: 'rtl', textAlign: 'right' }}>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: data.text ?? '',
                          }}
                        />
                      </Box>

                      {hasTranslation && showTranslation && (
                        <Box
                          sx={{
                            mt: 2,
                            pt: 2,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            English Translation:
                          </Typography>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: translation.text ?? '',
                            }}
                          />
                        </Box>
                      )}

                      {linksWithOther.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Related References:
                          </Typography>
                          <Links links={linksWithOther} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </Stack>

          {sections && (
            <SectionPicker
              sections={sections}
              currentIndex={sectionIndex ?? 0}
              onChange={setSectionIndex}
            />
          )}
        </Box>
      )}
    </Box>
  );
};
