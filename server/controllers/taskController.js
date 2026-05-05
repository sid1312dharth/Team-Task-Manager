const pool = require('../config/db');

exports.createTask = async (req, res) => {
  const { title, description, status, priority, due_date, assigned_to } = req.body;
  const { projectId } = req.params;

  const task = await pool.query(
    `INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [title, description, status, priority, due_date, projectId, assigned_to, req.user.id]
  );
  res.json(task.rows[0]);
};

exports.getProjectTasks = async (req, res) => {
  const result = await pool.query(
    `SELECT t.*, u.name as assignee_name FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE t.project_id = $1 ORDER BY t.created_at DESC`,
    [req.params.projectId]
  );
  res.json(result.rows);
};

exports.updateTask = async (req, res) => {
  const { title, description, status, priority, due_date, assigned_to } = req.body;
  const result = await pool.query(
    `UPDATE tasks SET title=$1, description=$2, status=$3, priority=$4, due_date=$5, assigned_to=$6
     WHERE id=$7 RETURNING *`,
    [title, description, status, priority, due_date, assigned_to, req.params.taskId]
  );
  res.json(result.rows[0]);
};

exports.deleteTask = async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.taskId]);
  res.json({ message: 'Task deleted' });
};