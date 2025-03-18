import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
} from '@mui/material';
import { getOrm } from '../orm';
import { getGrouped, getToc, Node } from '../queries';
import _ from 'lodash';

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

export const DownloadManager: React.FC = () => {
  const [downloading, setDownloading] = React.useState(false);
  const client = useQueryClient();

  const toc = useQuery({
    queryKey: ['toc'],
    queryFn: getToc,
  });

  const grouped = useQuery({
    queryKey: ['grouped'],
    queryFn: getGrouped,
  });

  const data = toc.data;

  if (toc.isLoading) return <Typography>Loading...</Typography>;
  if (toc.error) return <Typography>Error: {toc.error.message}</Typography>;
  if (!data) return <Typography>No data</Typography>;

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

  const handleDownload = async (id: number) => {
    setDownloading(true);
    const node = data[id];
    const timeKey = `download ${node.titleEnglish ?? node.categoryEnglish}`;
    console.time(timeKey);

    const log = _.throttle((message: string) => {
      console.log(message);
    }, 1000);

    const invalidate = _.throttle(() => {
      return Promise.all([client.invalidateQueries({ queryKey: ['grouped'] })]);
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
  };

  const handleWipeDb = async () => {
    if (!confirm('Are you sure you want to wipe the database?')) return;
    const { worker } = await getOrm();
    await worker.wipe();
    location.reload();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Download Manager
        </Typography>
        <Button variant="outlined" color="error" onClick={handleWipeDb}>
          Wipe Database
        </Button>
      </Box>

      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Available Content
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Total Size</TableCell>
              <TableCell align="right">Missing</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data[0].children.map((topic) => {
              const missingBytes = calculateMissingBytes(topic);
              return (
                <TableRow key={topic.id}>
                  <TableCell>{title(topic)}</TableCell>
                  <TableCell align="right">
                    {formatBytes(calculateSize(topic))}
                  </TableCell>
                  <TableCell align="right">
                    {formatBytes(missingBytes)}
                  </TableCell>
                  <TableCell align="right">
                    {missingBytes > 0 && (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={downloading}
                        onClick={() => handleDownload(topic.id)}
                      >
                        Download
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
