import React from 'react';
import { DownloadManager } from './pages/DownloadManager';
import { ContentViewer } from './pages/ContentViewer';
import { TodoPage } from './pages/TodoPage';
import {
  Box,
  Tab,
  Tabs,
  Container,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { NumberParam, useQueryParam, withDefault } from 'use-query-params';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

// Create a theme with better support for RTL content
const theme = createTheme({
  direction: 'ltr', // Default direction
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#1976d2',
          height: 3,
        },
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minWidth: 120,
          padding: '12px 16px',
          transition: 'all 0.2s',
          '&.Mui-selected': {
            color: '#1976d2',
            fontWeight: 600,
          },
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow:
            '0px 2px 4px -1px rgba(0,0,0,0.1), 0px 1px 10px 0px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useQueryParam(
    'tab',
    withDefault(NumberParam, 0)
  );

  const handleChange = (_e: unknown, value: number) => setActiveTab(value);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              onChange={handleChange}
              value={activeTab}
              aria-label="Torah App Tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Download Manager" {...a11yProps(0)} />
              <Tab label="Content Viewer" {...a11yProps(1)} />
              <Tab label="Todo" {...a11yProps(2)} />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <DownloadManager />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <ContentViewer />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <TodoPage />
          </TabPanel>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};
