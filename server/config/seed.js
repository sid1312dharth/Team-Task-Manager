const bcrypt = require('bcryptjs');
const db = require('./db');

async function seedData() {
  try {
    const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
    const count = parseInt(existingUsers.rows[0].count || existingUsers.rows[0]['COUNT(*)'] || 0, 10);
    if (count > 0) {
      console.log(`ℹ️ Database already contains ${count} users. Skipping seed.`);
      return;
    }

    console.log('🌱 Seeding initial database records...');

    const hashedPw = await bcrypt.hash('password123', 10);

    // 1. Insert Users
    const usersData = [
      ['Alex Rivera', 'alex@example.com', hashedPw, '#6366F1', 'Lead Architect & Admin'],
      ['Sarah Chen', 'sarah@example.com', hashedPw, '#EC4899', 'Senior Frontend Engineer'],
      ['Mike Ross', 'mike@example.com', hashedPw, '#10B981', 'UI/UX Product Designer'],
      ['Elena Rostova', 'elena@example.com', hashedPw, '#F59E0B', 'Backend Infrastructure Lead']
    ];

    const userIds = [];
    for (const u of usersData) {
      const res = await db.query(
        'INSERT INTO users (name, email, password, avatar_color, role_title) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        u
      );
      userIds.push(res.rows[0].id || res.lastID);
    }
    const [alexId, sarahId, mikeId, elenaId] = userIds;

    // 2. Insert Projects
    const p1 = await db.query(
      `INSERT INTO projects (name, description, color, category, status, target_date, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [
        'Website Redesign & Brand Revamp',
        'Modernizing our core web experience with high-performance responsive UI, dark mode, and sleek task workflows.',
        '#6366F1',
        'Frontend',
        'active',
        '2026-09-15',
        alexId
      ]
    );
    const p1Id = p1.rows[0].id || p1.lastID;

    const p2 = await db.query(
      `INSERT INTO projects (name, description, color, category, status, target_date, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [
        'Mobile App 2.0 (iOS & Android)',
        'Next-gen mobile experience with biometric authentication, offline syncing, and instant notifications.',
        '#3B82F6',
        'Mobile',
        'active',
        '2026-10-30',
        alexId
      ]
    );
    const p2Id = p2.rows[0].id || p2.lastID;

    const p3 = await db.query(
      `INSERT INTO projects (name, description, color, category, status, target_date, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [
        'Cloud Infrastructure & CI/CD',
        'Zero-downtime automated deployment pipelines, automated backups, monitoring, and security hardening.',
        '#10B981',
        'DevOps',
        'active',
        '2026-09-01',
        alexId
      ]
    );
    const p3Id = p3.rows[0].id || p3.lastID;

    // 3. Insert Project Members
    const membersData = [
      [p1Id, alexId, 'Admin'],
      [p1Id, sarahId, 'Member'],
      [p1Id, mikeId, 'Member'],
      [p1Id, elenaId, 'Member'],

      [p2Id, alexId, 'Admin'],
      [p2Id, sarahId, 'Member'],
      [p2Id, elenaId, 'Member'],

      [p3Id, alexId, 'Admin'],
      [p3Id, elenaId, 'Member']
    ];

    for (const m of membersData) {
      await db.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        m
      );
    }

    // 4. Insert Tasks
    const tasksData = [
      // Project 1 Tasks
      [
        p1Id,
        'Design Dark Mode & High-Contrast Theme System',
        'Implement color palettes, CSS variables, and persistent local storage theme toggle.',
        'completed',
        'medium',
        '2026-08-20', // past date (completed)
        mikeId,
        alexId,
        'Design,UI',
        6
      ],
      [
        p1Id,
        'Build Interactive Kanban Board & Task Drag-Drop',
        'Create columns for To Do, In Progress, In Review, and Done with smooth state transitions and instant updates.',
        'in_progress',
        'urgent',
        '2026-08-28', // upcoming
        sarahId,
        alexId,
        'Frontend,Kanban',
        12
      ],
      [
        p1Id,
        'Implement JWT Authentication & Role Gate Middleware',
        'Support token verification, role permissions (Admin/Member), and secure password hashing with bcrypt.',
        'completed',
        'high',
        '2026-08-22',
        alexId,
        alexId,
        'Backend,Security',
        8
      ],
      [
        p1Id,
        'Audit Mobile Viewport & Touch Gesture Interactivity',
        'Ensure navigation drawer, modal dialogs, and task cards feel native and fluid on mobile screens.',
        'review',
        'high',
        '2026-08-25', // slightly overdue or due yesterday
        mikeId,
        alexId,
        'QA,Mobile',
        4
      ],
      [
        p1Id,
        'LCP & Core Web Vitals Optimization',
        'Optimize font fallbacks, script loading, and layout shifts for sub-second page rendering.',
        'todo',
        'low',
        '2026-09-05',
        sarahId,
        alexId,
        'Performance',
        5
      ],
      [
        p1Id,
        'Legacy API Deprecation & Migration Notice',
        'Prepare migration guide for v1 endpoints and broadcast deprecation timeline to API consumers.',
        'todo',
        'medium',
        '2026-08-21', // OVERDUE task for testing overdue alert!
        alexId,
        alexId,
        'Docs,API',
        3
      ],

      // Project 2 Tasks
      [
        p2Id,
        'Push Notification Background Service Setup',
        'Integrate Firebase Cloud Messaging / APNs for real-time task assignment alerts.',
        'in_progress',
        'high',
        '2026-09-10',
        elenaId,
        alexId,
        'Mobile,Push',
        10
      ],
      [
        p2Id,
        'Biometric Auth (FaceID / Fingerprint Lock)',
        'Provide secure keychain storage and biometric prompt on app resume.',
        'todo',
        'medium',
        '2026-09-20',
        sarahId,
        alexId,
        'Security,iOS,Android',
        8
      ],
      [
        p2Id,
        'Offline Local Cache & Conflict Resolution Engine',
        'Enable editing tasks while offline and syncing changes automatically on reconnection.',
        'todo',
        'urgent',
        '2026-08-24', // OVERDUE task
        elenaId,
        alexId,
        'Architecture,Offline',
        16
      ],

      // Project 3 Tasks
      [
        p3Id,
        'Automated Daily Database Snapshots & Retention',
        'Configure encrypted WAL archiving and daily automated dumps with test restore verification.',
        'completed',
        'high',
        '2026-08-15',
        elenaId,
        alexId,
        'DevOps,Postgres',
        6
      ],
      [
        p3Id,
        'Prometheus Metrics Exporter & Grafana Alerting',
        'Track API latency, error rates, CPU/Memory utilization, and database connection pool health.',
        'review',
        'medium',
        '2026-08-30',
        elenaId,
        alexId,
        'Monitoring,DevOps',
        8
      ]
    ];

    const taskIds = [];
    for (const t of tasksData) {
      const res = await db.query(
        `INSERT INTO tasks (project_id, title, description, status, priority, due_date, assigned_to, created_by, tags, estimated_hours)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        t
      );
      taskIds.push(res.rows[0].id || res.lastID);
    }

    // 5. Insert Subtasks for Task 2 (Kanban board) and Task 4 (Mobile audit)
    const subtasksData = [
      [taskIds[1], 'Define column drag boundaries and drop targets', 1],
      [taskIds[1], 'Add column header task count badges', 1],
      [taskIds[1], 'Implement quick-move dropdown on mobile cards', 0],
      [taskIds[1], 'Persist card position changes to database API', 0],

      [taskIds[3], 'Test drawer opening on iOS Safari', 1],
      [taskIds[3], 'Check backdrop click dismiss on Android Chrome', 1],
      [taskIds[3], 'Verify virtual keyboard padding on task input', 0]
    ];

    for (const st of subtasksData) {
      await db.query('INSERT INTO subtasks (task_id, title, completed) VALUES ($1,$2,$3)', st);
    }

    // 6. Insert Comments
    const commentsData = [
      [taskIds[1], alexId, 'Sarah, let me know if you need any API schema tweaks for the status transitions!'],
      [taskIds[1], sarahId, 'The status update endpoint is working great! Kanban columns are rendering cleanly.'],
      [taskIds[3], mikeId, 'Tested on iPhone 15 Pro and Pixel 8, layout responsiveness looks solid.'],
      [taskIds[6], elenaId, 'Configured FCM service worker credentials in staging environment.']
    ];

    for (const c of commentsData) {
      await db.query('INSERT INTO task_comments (task_id, user_id, content) VALUES ($1,$2,$3)', c);
    }

    // 7. Insert Activity Logs
    const activitiesData = [
      [p1Id, taskIds[1], alexId, 'created_task', 'Created task "Build Interactive Kanban Board & Task Drag-Drop"'],
      [p1Id, taskIds[1], sarahId, 'updated_status', 'Moved task to "in_progress"'],
      [p1Id, taskIds[0], mikeId, 'completed_task', 'Completed task "Design Dark Mode & High-Contrast Theme System"'],
      [p1Id, null, alexId, 'added_member', 'Added Sarah Chen as Project Member']
    ];

    for (const a of activitiesData) {
      await db.query(
        'INSERT INTO activity_logs (project_id, task_id, user_id, action, details) VALUES ($1,$2,$3,$4,$5)',
        a
      );
    }

    console.log('✅ Sample database records successfully seeded');
  } catch (err) {
    console.error('Error during database seed:', err);
  }
}

module.exports = seedData;

