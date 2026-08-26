const db = require('../config/db');

exports.createProject = async (req, res) => {
  const { name, description, color, category, target_date } = req.body;
  const owner_id = req.user.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  try {
    const projColor = color || '#6366F1';
    const projCategory = category || 'General';

    const projectRes = await db.query(
      `INSERT INTO projects (name, description, color, category, status, target_date, owner_id)
       VALUES ($1, $2, $3, $4, 'active', $5, $6)
       RETURNING *`,
      [name.trim(), description || '', projColor, projCategory, target_date || null, owner_id]
    );

    const project = projectRes.rows[0];
    const projectId = project.id || projectRes.lastID;

    // Add creator as Admin
    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [projectId, owner_id, 'Admin']
    );

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (project_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [projectId, owner_id, 'created_project', `Created project "${name.trim()}"`]
    );

    res.status(201).json({
      ...project,
      id: projectId,
      role: 'Admin',
      task_count: 0,
      completed_task_count: 0,
      member_count: 1
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: 'Error creating project' });
  }
};

exports.getMyProjects = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      `SELECT 
        p.*,
        pm.role as user_role,
        u.name as owner_name,
        u.email as owner_email,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'in_progress') as in_progress_task_count
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getMyProjects error:', err);
    res.status(500).json({ message: 'Error fetching projects' });
  }
};

exports.getProjectById = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    const projRes = await db.query(
      `SELECT 
        p.*,
        pm.role as user_role,
        u.name as owner_name,
        u.email as owner_email,
        u.avatar_color as owner_avatar_color
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
       LEFT JOIN users u ON p.owner_id = u.id
       WHERE p.id = $2`,
      [userId, projectId]
    );

    if (!projRes.rows.length) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projRes.rows[0];

    // Fetch members with user details
    const membersRes = await db.query(
      `SELECT 
        pm.id as member_id,
        pm.role,
        pm.joined_at,
        u.id as user_id,
        u.name,
        u.email,
        u.avatar_color,
        u.role_title,
        (SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND assigned_to = u.id) as assigned_tasks_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND assigned_to = u.id AND status = 'completed') as completed_tasks_count
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.role ASC, u.name ASC`,
      [projectId]
    );

    // Fetch tasks summary counts
    const taskStatsRes = await db.query(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review_tasks,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks
       FROM tasks
       WHERE project_id = $1`,
      [projectId]
    );

    const stats = taskStatsRes.rows[0] || {};
    const total = parseInt(stats.total_tasks || 0, 10);
    const completed = parseInt(stats.completed_tasks || 0, 10);
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      ...project,
      progress_percent: progressPercent,
      stats: {
        total,
        completed,
        in_progress: parseInt(stats.in_progress_tasks || 0, 10),
        review: parseInt(stats.review_tasks || 0, 10),
        todo: parseInt(stats.todo_tasks || 0, 10)
      },
      members: membersRes.rows
    });
  } catch (err) {
    console.error('getProjectById error:', err);
    res.status(500).json({ message: 'Error retrieving project details' });
  }
};

exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { name, description, color, category, status, target_date } = req.body;

  try {
    const currentRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (!currentRes.rows.length) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const current = currentRes.rows[0];

    const updatedName = name ? name.trim() : current.name;
    const updatedDesc = description !== undefined ? description : current.description;
    const updatedColor = color || current.color;
    const updatedCat = category || current.category;
    const updatedStatus = status || current.status;
    const updatedTarget = target_date !== undefined ? target_date : current.target_date;

    const result = await db.query(
      `UPDATE projects 
       SET name = $1, description = $2, color = $3, category = $4, status = $5, target_date = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [updatedName, updatedDesc, updatedColor, updatedCat, updatedStatus, updatedTarget, projectId]
    );

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (project_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [projectId, req.user.id, 'updated_project', `Updated project details for "${updatedName}"`]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateProject error:', err);
    res.status(500).json({ message: 'Error updating project' });
  }
};

exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const projRes = await db.query('SELECT name FROM projects WHERE id = $1', [projectId]);
    if (!projRes.rows.length) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    res.json({ message: `Project "${projRes.rows[0].name}" deleted successfully` });
  } catch (err) {
    console.error('deleteProject error:', err);
    res.status(500).json({ message: 'Error deleting project' });
  }
};

exports.addMember = async (req, res) => {
  const { projectId } = req.params;
  const { email, user_id, role } = req.body;

  try {
    let targetUser = null;
    if (user_id) {
      const uRes = await db.query('SELECT id, name, email FROM users WHERE id = $1', [user_id]);
      if (uRes.rows.length) targetUser = uRes.rows[0];
    } else if (email) {
      const uRes = await db.query('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
      if (uRes.rows.length) targetUser = uRes.rows[0];
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found with provided email or ID' });
    }

    const assignedRole = role === 'Admin' ? 'Admin' : 'Member';

    // Check if already a member
    const existing = await db.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, targetUser.id]
    );

    if (existing.rows.length > 0) {
      // Update role
      await db.query(
        'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3',
        [assignedRole, projectId, targetUser.id]
      );
      return res.json({ message: `${targetUser.name}'s role updated to ${assignedRole}` });
    }

    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectId, targetUser.id, assignedRole]
    );

    // Log Activity
    await db.query(
      'INSERT INTO activity_logs (project_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [projectId, req.user.id, 'added_member', `Added ${targetUser.name} as ${assignedRole}`]
    );

    res.status(201).json({ message: `${targetUser.name} added to project as ${assignedRole}` });
  } catch (err) {
    console.error('addMember error:', err);
    res.status(500).json({ message: 'Error adding team member' });
  }
};

exports.updateMemberRole = async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;

  if (!['Admin', 'Member', 'Viewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be Admin, Member, or Viewer' });
  }

  try {
    await db.query(
      'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3',
      [role, projectId, userId]
    );
    res.json({ message: 'Member role updated successfully' });
  } catch (err) {
    console.error('updateMemberRole error:', err);
    res.status(500).json({ message: 'Error updating member role' });
  }
};

exports.removeMember = async (req, res) => {
  const { projectId, userId } = req.params;

  try {
    // Check if user is project owner
    const projRes = await db.query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
    if (projRes.rows.length && Number(projRes.rows[0].owner_id) === Number(userId)) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    await db.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    // Also unassign tasks
    await db.query(
      'UPDATE tasks SET assigned_to = NULL WHERE project_id = $1 AND assigned_to = $2',
      [projectId, userId]
    );

    res.json({ message: 'Member removed from project' });
  } catch (err) {
    console.error('removeMember error:', err);
    res.status(500).json({ message: 'Error removing member' });
  }
};

exports.getProjectActivity = async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await db.query(
      `SELECT 
        a.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar_color as user_avatar_color,
        t.title as task_title
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN tasks t ON a.task_id = t.id
       WHERE a.project_id = $1
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getProjectActivity error:', err);
    res.status(500).json({ message: 'Error fetching project activity' });
  }
};