const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  const userId = req.user.id;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // 1. Projects count
    const projRes = await db.query(
      `SELECT p.id, p.name, p.color, p.category, p.status, p.target_date,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    const projects = projRes.rows.map(p => {
      const total = parseInt(p.total_tasks || 0, 10);
      const done = parseInt(p.completed_tasks || 0, 10);
      return {
        ...p,
        progress_percent: total > 0 ? Math.round((done / total) * 100) : 0
      };
    });

    const projectIds = projects.map(p => p.id);

    if (projectIds.length === 0) {
      return res.json({
        total_projects: 0,
        total_tasks: 0,
        completed_tasks: 0,
        in_progress_tasks: 0,
        review_tasks: 0,
        todo_tasks: 0,
        overdue_tasks: 0,
        urgent_tasks: 0,
        completion_rate: 0,
        my_tasks_count: 0,
        upcoming_deadlines: [],
        recent_activity: [],
        projects: []
      });
    }

    // 2. Global task stats across these projects
    const placeholders = projectIds.map((_, i) => `$${i + 1}`).join(',');
    const taskStatsRes = await db.query(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review_tasks,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
        SUM(CASE WHEN status != 'completed' AND due_date IS NOT NULL AND due_date < '${todayStr}' THEN 1 ELSE 0 END) as overdue_tasks,
        SUM(CASE WHEN status != 'completed' AND priority = 'urgent' THEN 1 ELSE 0 END) as urgent_tasks
       FROM tasks
       WHERE project_id IN (${placeholders})`,
      projectIds
    );

    const stats = taskStatsRes.rows[0] || {};
    const total = parseInt(stats.total_tasks || 0, 10);
    const completed = parseInt(stats.completed_tasks || 0, 10);

    // 3. User's own assigned tasks count
    const myTasksCountRes = await db.query(
      `SELECT COUNT(*) as count FROM tasks WHERE assigned_to = $1 AND status != 'completed'`,
      [userId]
    );
    const myTasksCount = parseInt(myTasksCountRes.rows[0]?.count || 0, 10);

    // 4. Upcoming Deadlines
    const deadlinesRes = await db.query(
      `SELECT 
        t.id, t.title, t.status, t.priority, t.due_date,
        p.id as project_id, p.name as project_name, p.color as project_color,
        u.name as assignee_name, u.avatar_color as assignee_avatar_color
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id IN (${placeholders})
         AND t.status != 'completed'
         AND t.due_date IS NOT NULL
       ORDER BY t.due_date ASC
       LIMIT 6`,
      projectIds
    );

    // 5. Recent Activity
    const activityRes = await db.query(
      `SELECT 
        a.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar_color as user_avatar_color,
        t.title as task_title,
        p.name as project_name
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN tasks t ON a.task_id = t.id
       LEFT JOIN projects p ON a.project_id = p.id
       WHERE a.project_id IN (${placeholders})
       ORDER BY a.created_at DESC
       LIMIT 10`,
      projectIds
    );

    res.json({
      total_projects: projects.length,
      total_tasks: total,
      completed_tasks: completed,
      in_progress_tasks: parseInt(stats.in_progress_tasks || 0, 10),
      review_tasks: parseInt(stats.review_tasks || 0, 10),
      todo_tasks: parseInt(stats.todo_tasks || 0, 10),
      overdue_tasks: parseInt(stats.overdue_tasks || 0, 10),
      urgent_tasks: parseInt(stats.urgent_tasks || 0, 10),
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      my_tasks_count: myTasksCount,
      upcoming_deadlines: deadlinesRes.rows,
      recent_activity: activityRes.rows,
      projects
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ message: 'Error calculating dashboard metrics' });
  }
};

