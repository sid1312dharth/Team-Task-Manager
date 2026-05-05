const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { createProject, getMyProjects, addMember } = require('../controllers/projectController');

router.post('/', auth, createProject);
router.get('/', auth, getMyProjects);
router.post('/:projectId/members', auth, role('Admin'), addMember);

module.exports = router;