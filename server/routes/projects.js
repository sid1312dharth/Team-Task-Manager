const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
  getProjectActivity
} = require('../controllers/projectController');

// All project routes require authentication
router.use(auth);

// Project list & creation
router.get('/', getMyProjects);
router.post('/', createProject);

// Single project access
router.get('/:projectId', role('Member'), getProjectById);
router.put('/:projectId', role('Admin'), updateProject);
router.delete('/:projectId', role('Admin'), deleteProject);

// Project team members
router.post('/:projectId/members', role('Admin'), addMember);
router.put('/:projectId/members/:userId', role('Admin'), updateMemberRole);
router.delete('/:projectId/members/:userId', role('Admin'), removeMember);

// Project activity feed
router.get('/:projectId/activity', role('Member'), getProjectActivity);

module.exports = router;