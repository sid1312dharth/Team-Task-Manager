const db = require('../config/db');

exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, status, priority, due_date, assigned_to, tags, estimated_hours } = req.body;
  const userId = req.user.id;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  try {
    const taskStatus = status || 'todo';
    const taskPriority = priority || 'medium';
    const taskTags = Array.isArray(tags) ? tags.join(',') : (tags || '');
    const taskHours = estimated_hours ? parseFloat(estimated_hours) : 0;
    const assignee = assigned_to ? parseInt(assigned_to, 10) : null;

    const taskRes = await db.query(
      `INSERT INTO tasks 
        (project_id, title, description, status, priority, due_date, assigned_to, created_by, tags, estimated_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        projectId,
        title.trim(),
        description || '',
        taskStatus,
        taskPriority,
        due_date || null,
        assignee,
        userId,
        taskTags,
        taskHours
      ]
    );

    const task = taskRes.rows[0];
    const taskId = task.id || taskRes.lastID;

    // Fetch assignee details
    let assigneeInfo = null;
    if (assignee) {
      const uRes = await db.query('SELECT name, email, avatar_color FROM users WHERE id = $1', [assignee]);
      if (uRes.rows.length) assigneeInfo = uRes.rows[0];
    }

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (project_id, task_id, user_id, action, details) VALUES ($1, $2, $3, $4, $5)',
      [projectId, taskId, userId, 'created_task', `Created task "${title.trim()}"`]
    );

    res.status(201).json({
      ...task,
      id: taskId,
      assignee_name: assigneeInfo?.name || null,
      assignee_email: assigneeInfo?.email || null,
      assignee_avatar_color: assigneeInfo?.avatar_color || null,
      subtask_count: 0,
      subtask_completed_count: 0,
      comment_count: 0
    });
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ message: 'Error creating task' });
  }
};

exports.getProjectTasks = async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, assigned_to, search } = req.query;

  try {
    let sql = `
      SELECT 
        t.*,
        u.name as assignee_name,
        u.email as assignee_email,
        u.avatar_color as assignee_avatar_color,
        u.role_title as assignee_role_title,
        c.name as creator_name,
        (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id) as subtask_count,
        (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND completed = 1) as subtask_completed_count,
        (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.project_id = $1
    `;

    const params = [projectId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      sql += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }

    if (priority && priority !== 'all') {
      sql += ` AND t.priority = $${paramIndex++}`;
      params.push(priority);
    }

    if (assigned_to && assigned_to !== 'all') {
      sql += ` AND t.assigned_to = $${paramIndex++}`;
      params.push(parseInt(assigned_to, 10));
    }

    if (search && search.trim()) {
      sql += ` AND (LOWER(t.title) LIKE $${paramIndex} OR LOWER(t.description) LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase().trim()}%`);
      paramIndex++;
    }

    sql += ' ORDER BY CASE t.priority WHEN \'urgent\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 ELSE 4 END, t.created_at DESC';

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getProjectTasks error:', err);
    res.status(500).json({ message: 'Error retrieving project tasks' });
  }
};

exports.getTaskById = async (req, res) => {
  const { taskId } = req.params;

  try {
    const taskRes = await db.query(
      `SELECT 
        t.*,
        p.name as project_name,
        p.color as project_color,
        u.name as assignee_name,
        u.email as assignee_email,
        u.avatar_color as assignee_avatar_color,
        c.name as creator_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users c ON t.created_by = c.id
       WHERE t.id = $1`,
      [taskId]
    );

    if (!taskRes.rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = taskRes.rows[0];

    // Fetch Subtasks
    const subtasksRes = await db.query(
      'SELECT * FROM subtasks WHERE task_id = $1 ORDER BY id ASC',
      [taskId]
    );

    // Fetch Comments
    const commentsRes = await db.query(
      `SELECT 
        tc.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar_color as user_avatar_color,
        u.role_title as user_role_title
       FROM task_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at ASC`,
      [taskId]
    );

    res.json({
      ...task,
      subtasks: subtasksRes.rows,
      comments: commentsRes.rows
    });
  } catch (err) {
    console.error('getTaskById error:', err);
    res.status(500).json({ message: 'Error retrieving task details' });
  }
};

exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, priority, due_date, assigned_to, tags, estimated_hours } = req.body;
  const userId = req.user.id;

  try {
    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (!taskRes.rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const current = taskRes.rows[0];

    const updatedTitle = title !== undefined ? title.trim() : current.title;
    const updatedDesc = description !== undefined ? description : current.description;
    const updatedStatus = status !== undefined ? status : current.status;
    const updatedPriority = priority !== undefined ? priority : current.priority;
    const updatedDueDate = due_date !== undefined ? due_date : current.due_date;
    const updatedAssignee = assigned_to !== undefined ? (assigned_to ? parseInt(assigned_to, 10) : null) : current.assigned_to;
    const updatedTags = tags !== undefined ? (Array.isArray(tags) ? tags.join(',') : tags) : current.tags;
    const updatedHours = estimated_hours !== undefined ? parseFloat(estimated_hours) : current.estimated_hours;

    const result = await db.query(
      `UPDATE tasks
       SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, assigned_to = $6, tags = $7, estimated_hours = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        updatedTitle,
        updatedDesc,
        updatedStatus,
        updatedPriority,
        updatedDueDate,
        updatedAssignee,
        updatedTags,
        updatedHours,
        taskId
      ]
    );

    // If status changed, log activity
    if (current.status !== updatedStatus) {
      await db.query(
        'INSERT INTO activity_logs (project_id, task_id, user_id, action, details) VALUES ($1, $2, $3, $4, $5)',
        [
          current.project_id,
          taskId,
          userId,
          'updated_status',
          `Changed status of "${updatedTitle}" from ${current.status} to ${updatedStatus}`
        ]
      );
    }

    // If assignee changed, log activity
    if (Number(current.assigned_to) !== Number(updatedAssignee) && updatedAssignee) {
      const uRes = await db.query('SELECT name FROM users WHERE id = $1', [updatedAssignee]);
      const assigneeName = uRes.rows[0]?.name || 'team member';
      await db.query(
        'INSERT INTO activity_logs (project_id, task_id, user_id, action, details) VALUES ($1, $2, $3, $4, $5)',
        [current.project_id, taskId, userId, 'assigned_task', `Assigned "${updatedTitle}" to ${assigneeName}`]
      );
    }

    // Fetch updated assignee details
    let assigneeInfo = null;
    if (updatedAssignee) {
      const uRes = await db.query('SELECT name, email, avatar_color FROM users WHERE id = $1', [updatedAssignee]);
      if (uRes.rows.length) assigneeInfo = uRes.rows[0];
    }

    res.json({
      ...result.rows[0],
      assignee_name: assigneeInfo?.name || null,
      assignee_email: assigneeInfo?.email || null,
      assignee_avatar_color: assigneeInfo?.avatar_color || null
    });
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ message: 'Error updating task' });
  }
};

exports.deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const taskRes = await db.query('SELECT title, project_id FROM tasks WHERE id = $1', [taskId]);
    if (!taskRes.rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = taskRes.rows[0];
    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (project_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [task.project_id, req.user.id, 'deleted_task', `Deleted task "${task.title}"`]
    );

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ message: 'Error deleting task' });
  }
};

exports.getMyTasks = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT 
        t.*,
        p.name as project_name,
        p.color as project_color,
        u.name as assignee_name,
        u.avatar_color as assignee_avatar_color,
        (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id) as subtask_count,
        (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND completed = 1) as subtask_completed_count,
        (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comment_count
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.assigned_to = $1
       ORDER BY 
        CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END ASC,
        t.due_date ASC NULLS LAST,
        t.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getMyTasks error:', err);
    res.status(500).json({ message: 'Error retrieving your tasks' });
  }
};

// --- Subtask Handlers ---

exports.createSubtask = async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Subtask title is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO subtasks (task_id, title, completed) VALUES ($1, $2, 0) RETURNING *',
      [taskId, title.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createSubtask error:', err);
    res.status(500).json({ message: 'Error creating subtask' });
  }
};

exports.updateSubtask = async (req, res) => {
  const { subtaskId } = req.params;
  const { title, completed } = req.body;

  try {
    const currentRes = await db.query('SELECT * FROM subtasks WHERE id = $1', [subtaskId]);
    if (!currentRes.rows.length) {
      return res.status(404).json({ message: 'Subtask not found' });
    }
    const current = currentRes.rows[0];

    const updatedTitle = title !== undefined ? title.trim() : current.title;
    const updatedCompleted = completed !== undefined ? (completed ? 1 : 0) : current.completed;

    const result = await db.query(
      'UPDATE subtasks SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
      [updatedTitle, updatedCompleted, subtaskId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateSubtask error:', err);
    res.status(500).json({ message: 'Error updating subtask' });
  }
};

exports.deleteSubtask = async (req, res) => {
  const { subtaskId } = req.params;

  try {
    await db.query('DELETE FROM subtasks WHERE id = $1', [subtaskId]);
    res.json({ message: 'Subtask deleted' });
  } catch (err) {
    console.error('deleteSubtask error:', err);
    res.status(500).json({ message: 'Error deleting subtask' });
  }
};

// --- Comment Handlers ---

exports.getTaskComments = async (req, res) => {
  const { taskId } = req.params;

  try {
    const result = await db.query(
      `SELECT 
        tc.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar_color as user_avatar_color,
        u.role_title as user_role_title
       FROM task_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at ASC`,
      [taskId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getTaskComments error:', err);
    res.status(500).json({ message: 'Error retrieving comments' });
  }
};

exports.addComment = async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Comment content cannot be empty' });
  }

  try {
    const commentRes = await db.query(
      'INSERT INTO task_comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [taskId, userId, content.trim()]
    );

    const comment = commentRes.rows[0];

    // Fetch user details
    const uRes = await db.query('SELECT name, email, avatar_color, role_title FROM users WHERE id = $1', [userId]);
    const user = uRes.rows[0] || {};

    // Get project id for activity log
    const tRes = await db.query('SELECT project_id, title FROM tasks WHERE id = $1', [taskId]);
    if (tRes.rows.length) {
      await db.query(
        'INSERT INTO activity_logs (project_id, task_id, user_id, action, details) VALUES ($1, $2, $3, $4, $5)',
        [tRes.rows[0].project_id, taskId, userId, 'commented', `Commented on "${tRes.rows[0].title}"`]
      );
    }

    res.status(201).json({
      ...comment,
      user_name: user.name,
      user_email: user.email,
      user_avatar_color: user.avatar_color,
      user_role_title: user.role_title
    });
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ message: 'Error posting comment' });
  }
};