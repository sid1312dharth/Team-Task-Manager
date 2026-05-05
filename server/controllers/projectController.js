const pool = require('../config/db');

exports.createProject = async (req, res) => {
  const { name, description } = req.body;
  const owner_id = req.user.id;

  const project = await pool.query(
    'INSERT INTO projects (name, description, owner_id) VALUES ($1,$2,$3) RETURNING *',
    [name, description, owner_id]
  );

  // Add creator as Admin
  await pool.query(
    'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3)',
    [project.rows[0].id, owner_id, 'Admin']
  );

  res.json(project.rows[0]);
};

exports.getMyProjects = async (req, res) => {
  const result = await pool.query(
    `SELECT p.*, pm.role FROM projects p
     JOIN project_members pm ON p.id = pm.project_id
     WHERE pm.user_id = $1`,
    [req.user.id]
  );
  res.json(result.rows);
};

exports.addMember = async (req, res) => {
  const { projectId } = req.params;
  const { email, role } = req.body;

  const user = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (!user.rows.length) return res.status(404).json({ message: 'User not found' });

  await pool.query(
    'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
    [projectId, user.rows[0].id, role || 'Member']
  );
  res.json({ message: 'Member added' });
};