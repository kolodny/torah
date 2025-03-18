import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Fade,
  Chip,
  Card,
  CardContent,
  CardHeader,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export const TodoPage: React.FC = () => {
  const [todos, setTodos] = React.useState<TodoItem[]>([
    { id: 1, text: 'Implement search functionality', completed: false },
    { id: 2, text: 'Add user authentication', completed: false },
    { id: 3, text: 'Improve Hebrew text rendering', completed: false },
    { id: 4, text: 'Add dark mode support', completed: false },
    { id: 5, text: 'Optimize database queries', completed: false },
  ]);
  const [newTodoText, setNewTodoText] = React.useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleToggle = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleAddTodo = () => {
    if (newTodoText.trim() === '') return;

    const newTodo: TodoItem = {
      id: Math.max(0, ...todos.map((t) => t.id)) + 1,
      text: newTodoText,
      completed: false,
    };

    setTodos([...todos, newTodo]);
    setNewTodoText('');
  };

  const handleDeleteCompleted = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    setTodos(todos.filter((todo) => !todo.completed));
    setDeleteDialogOpen(false);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AssignmentIcon sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" fontWeight="600">
          Project Todo List
        </Typography>
      </Box>

      <Card
        elevation={3}
        sx={{
          p: 1,
          mb: 4,
          borderRadius: 2,
          transition: 'all 0.3s',
          '&:hover': {
            boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)',
          },
        }}
      >
        <CardHeader
          title="Add New Task"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          sx={{ pb: 0 }}
        />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter a new task"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  handleAddTodo();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TaskAltIcon color="disabled" fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddTodo}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              Add
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" component="h2" fontWeight="500">
          Tasks
        </Typography>
        <Chip
          label={`${todos.filter((t) => t.completed).length}/${
            todos.length
          } completed`}
          color="primary"
          size="small"
          variant="outlined"
          icon={<CheckCircleIcon />}
        />
      </Box>

      <Paper
        elevation={3}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s',
          '&:hover': {
            boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)',
          },
        }}
      >
        <List sx={{ width: '100%', p: 0 }}>
          {todos.length === 0 ? (
            <Fade in={true} timeout={800}>
              <ListItem sx={{ py: 3 }}>
                <ListItemText
                  primary="No tasks yet. Add some tasks above!"
                  primaryTypographyProps={{
                    align: 'center',
                    color: 'text.secondary',
                    fontStyle: 'italic',
                  }}
                />
              </ListItem>
            </Fade>
          ) : (
            todos.map((todo) => (
              <ListItem
                key={todo.id}
                dense
                sx={{
                  py: 1.5,
                  cursor: 'pointer',
                  bgcolor: todo.completed
                    ? 'rgba(76, 175, 80, 0.08)'
                    : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: todo.completed
                      ? 'rgba(76, 175, 80, 0.12)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
                onClick={() => handleToggle(todo.id)}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={todo.completed}
                    tabIndex={-1}
                    disableRipple
                    icon={<TaskAltIcon color="disabled" />}
                    checkedIcon={<TaskAltIcon color="success" />}
                    sx={{
                      transition: 'transform 0.2s',
                      '&.Mui-checked': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={todo.text}
                  sx={{
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? 'text.secondary' : 'text.primary',
                    transition: 'all 0.3s',
                  }}
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      <Fade in={todos.some((todo) => todo.completed)}>
        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Tooltip title="Remove all completed tasks">
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleDeleteCompleted}
              startIcon={<DeleteIcon />}
              sx={{
                borderRadius: 2,
                px: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Delete Completed Tasks
            </Button>
          </Tooltip>
        </Box>
      </Fade>

      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle id="alert-dialog-title">
          {'Delete completed tasks?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete all completed tasks? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={cancelDelete} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            autoFocus
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
