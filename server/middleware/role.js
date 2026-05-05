const pool = require('../config/db');

module.exports = (requiredRole) => async (req, res, next) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  const result = await pool.query(
    'SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2',
    [projectId, userId]
  );

  if (!result.rows.length) return res.status(403).json({ message: 'Not a member' });
  if (requiredRole === 'Admin' && result.rows[0].role !== 'Admin') {
    return res.status(403).json({ message: 'Admins only' });
  }

  req.userRole = result.rows[0].role;
  next();
};