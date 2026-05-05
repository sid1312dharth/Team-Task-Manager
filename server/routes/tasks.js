const router = require('express').Router({ mergeParams: true });
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { createTask, getProjectTasks, updateTask, deleteTask } = require('../controllers/taskController');

router.get('/', auth, role('Member'), getProjectTasks);
router.post('/', auth, role('Admin'), createTask);
router.put('/:taskId', auth, role('Admin'), updateTask);
router.delete('/:taskId', auth, role('Admin'), deleteTask);

module.exports = router;