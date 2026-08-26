const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  signup,
  login,
  getMe,
  updateProfile,
  getAllUsers,
  getDemoUsers
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/demo-users', getDemoUsers);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.get('/users', auth, getAllUsers);

module.exports = router;