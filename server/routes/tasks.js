const router = require('express').Router({ mergeParams: true });
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getMyTasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  getTaskComments,
  addComment
} = require('../controllers/taskController');

// All task routes require authentication
router.use(auth);

// Global user tasks
router.get('/my-tasks', getMyTasks);

// Project-level tasks routes (both /api/project/:projectId/tasks and /api/tasks/project/:projectId)
router.get('/project/:projectId', role('Member'), getProjectTasks);
router.post('/project/:projectId', role('Member'), createTask);
router.get('/project/:projectId/tasks', role('Member'), getProjectTasks);
router.post('/project/:projectId/tasks', role('Member'), createTask);

// Single task operations
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

// Subtask operations
router.post('/:taskId/subtasks', createSubtask);
router.put('/:taskId/subtasks/:subtaskId', updateSubtask);
router.delete('/:taskId/subtasks/:subtaskId', deleteSubtask);

// Comment operations
router.get('/:taskId/comments', getTaskComments);
router.post('/:taskId/comments', addComment);

// Direct project tasks handler (when mounted under /api/project/:projectId/tasks)
router.get('/', role('Member'), getProjectTasks);
router.post('/', role('Member'), createTask);

module.exports = router;