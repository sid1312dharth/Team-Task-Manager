const db = require('../config/db');

module.exports = (requiredRole = 'Member') => async (req, res, next) => {
  const projectId = req.params.projectId || req.body.project_id || req.body.projectId;
  const userId = req.user.id;

  if (!projectId) {
    return res.status(400).json({ message: 'Project ID is required for role verification' });
  }

  try {
    // Check if user is a member of the project or the project owner
    const memberRes = await db.query(
      `SELECT pm.role, p.owner_id 
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
       WHERE p.id = $2`,
      [userId, projectId]
    );

    if (!memberRes.rows.length) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const row = memberRes.rows[0];
    const isOwner = Number(row.owner_id) === Number(userId);
    const userRole = isOwner ? 'Admin' : row.role;

    if (!userRole && !isOwner) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    if (requiredRole === 'Admin' && userRole !== 'Admin' && !isOwner) {
      return res.status(403).json({ message: 'Admin privileges required for this action' });
    }

    req.userRole = userRole || 'Member';
    req.isProjectAdmin = userRole === 'Admin' || isOwner;
    next();
  } catch (err) {
    console.error('Role middleware error:', err);
    return res.status(500).json({ message: 'Server error checking project permissions' });
  }
};