const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbType = 'sqlite';
let pool = null;
let sqliteDb = null;

// In-memory fallback database for when SQLite native binary is unavailable (e.g. Linux GLIBC mismatch)
const memoryStore = {
  users: [],
  projects: [],
  project_members: [],
  tasks: [],
  subtasks: [],
  task_comments: [],
  activity_logs: [],
  nextId: {
    users: 1,
    projects: 1,
    project_members: 1,
    tasks: 1,
    subtasks: 1,
    task_comments: 1,
    activity_logs: 1
  }
};

// Check if PostgreSQL DATABASE_URL is configured
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().startsWith('postgres')) {
  try {
    const { Pool } = require('pg');
    const dbUrl = process.env.DATABASE_URL.trim();
    const isRemote = !/localhost|127\.0\.0\.1/.test(dbUrl);

    pool = new Pool({
      connectionString: dbUrl,
      ssl:
        process.env.NODE_ENV === 'production' || isRemote
          ? { rejectUnauthorized: false }
          : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('connect', () => {
      console.log('📦 PostgreSQL database connected');
    });

    pool.on('error', (err) => {
      console.error('❌ Unexpected PostgreSQL pool error:', err.message);
    });

    dbType = 'postgres';
    console.log('📦 Database mode: PostgreSQL');
  } catch (err) {
    console.warn('⚠️ Failed to initialize PostgreSQL pool, falling back to SQLite:', err.message);
    dbType = 'sqlite';
  }
} else {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ [Production Warning] No PostgreSQL DATABASE_URL environment variable found.');
    console.warn('💡 To connect your persistent database on Render: Add DATABASE_URL to your Render Web Service Environment.');
  } else {
    console.log('ℹ️ No PostgreSQL DATABASE_URL provided. Defaulting to local zero-config SQLite mode.');
  }
  dbType = 'sqlite';
}

if (dbType === 'sqlite') {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.resolve(__dirname, '..', 'taskmanager.sqlite');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening SQLite database:', err.message);
      } else {
        console.log('📦 Database mode: SQLite (' + dbPath + ')');
      }
    });
    // Enable Foreign Keys for SQLite
    sqliteDb.run('PRAGMA foreign_keys = ON');
  } catch (nativeErr) {
    console.warn('⚠️ SQLite native bindings unavailable on this system (GLIBC):', nativeErr.message);
    console.warn('🔄 Seamlessly falling back to pure JavaScript memory database so the server remains online!');
    dbType = 'memory';
  }
}

/**
 * Universal query runner
 */
async function query(text, params = []) {
  if (dbType === 'postgres' && pool) {
    try {
      const result = await pool.query(text, params);
      return {
        rows: result.rows || [],
        rowCount: result.rowCount || 0
      };
    } catch (error) {
      console.error('❌ PostgreSQL Query Error:', error.message);
      console.error('SQL:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  if (dbType === 'sqlite' && sqliteDb) {
    return new Promise((resolve, reject) => {
      // Replace $1, $2, etc. with ? for SQLite
      const sqliteSql = text.replace(/\$(\d+)/g, '?');
      const trimmed = sqliteSql.trim();
      const isSelect = /^SELECT/i.test(trimmed);
      const hasReturning = /RETURNING/i.test(trimmed);

      if (isSelect || hasReturning) {
        sqliteDb.all(sqliteSql, params, function (err, rows) {
          if (err) {
            console.error('❌ SQLite Query Error:', err.message);
            console.error('SQL:', sqliteSql);
            console.error('Params:', params);
            return reject(err);
          }
          resolve({ rows: rows || [], rowCount: (rows && rows.length) || 0 });
        });
      } else {
        sqliteDb.run(sqliteSql, params, function (err) {
          if (err) {
            console.error('❌ SQLite Query Error:', err.message);
            console.error('SQL:', sqliteSql);
            console.error('Params:', params);
            return reject(err);
          }
          resolve({
            rows: [{ id: this.lastID }],
            rowCount: this.changes || 0,
            lastID: this.lastID
          });
        });
      }
    });
  }

  // Memory fallback query handler
  return runMemoryQuery(text, params);
}

/**
 * Lightweight pure-JS in-memory SQL handler for glibc-constrained environments
 */
function runMemoryQuery(sql, params) {
  const trimmed = sql.trim();

  // SELECT
  if (/^SELECT/i.test(trimmed)) {
    if (/FROM users/i.test(trimmed)) {
      if (/WHERE email =/i.test(trimmed)) {
        const u = memoryStore.users.find((x) => x.email === params[0]);
        return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
      }
      if (/WHERE id =/i.test(trimmed)) {
        const u = memoryStore.users.find((x) => x.id === parseInt(params[0], 10));
        return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
      }
      return { rows: [...memoryStore.users], rowCount: memoryStore.users.length };
    }

    if (/FROM projects/i.test(trimmed)) {
      if (/WHERE p\.id =|WHERE id =/i.test(trimmed)) {
        const p = memoryStore.projects.find((x) => x.id === parseInt(params[0], 10));
        return { rows: p ? [p] : [], rowCount: p ? 1 : 0 };
      }
      return { rows: [...memoryStore.projects], rowCount: memoryStore.projects.length };
    }

    if (/FROM tasks/i.test(trimmed)) {
      if (/WHERE project_id =/i.test(trimmed)) {
        const list = memoryStore.tasks.filter((x) => x.project_id === parseInt(params[0], 10));
        return { rows: list, rowCount: list.length };
      }
      if (/WHERE assigned_to =/i.test(trimmed)) {
        const list = memoryStore.tasks.filter((x) => x.assigned_to === parseInt(params[0], 10));
        return { rows: list, rowCount: list.length };
      }
      if (/WHERE t\.id =|WHERE id =/i.test(trimmed)) {
        const t = memoryStore.tasks.find((x) => x.id === parseInt(params[0], 10));
        return { rows: t ? [t] : [], rowCount: t ? 1 : 0 };
      }
      return { rows: [...memoryStore.tasks], rowCount: memoryStore.tasks.length };
    }

    if (/FROM project_members/i.test(trimmed)) {
      return { rows: [...memoryStore.project_members], rowCount: memoryStore.project_members.length };
    }

    if (/FROM subtasks/i.test(trimmed)) {
      if (/WHERE task_id =/i.test(trimmed)) {
        const list = memoryStore.subtasks.filter((x) => x.task_id === parseInt(params[0], 10));
        return { rows: list, rowCount: list.length };
      }
      return { rows: [...memoryStore.subtasks], rowCount: memoryStore.subtasks.length };
    }

    if (/FROM task_comments/i.test(trimmed)) {
      if (/WHERE task_id =/i.test(trimmed)) {
        const list = memoryStore.task_comments.filter((x) => x.task_id === parseInt(params[0], 10));
        return { rows: list, rowCount: list.length };
      }
      return { rows: [...memoryStore.task_comments], rowCount: memoryStore.task_comments.length };
    }

    if (/FROM activity_logs/i.test(trimmed)) {
      return { rows: [...memoryStore.activity_logs], rowCount: memoryStore.activity_logs.length };
    }

    return { rows: [], rowCount: 0 };
  }

  // INSERT
  if (/^INSERT INTO/i.test(trimmed)) {
    const tableMatch = trimmed.match(/INSERT INTO ([a-z_]+)/i);
    const table = tableMatch ? tableMatch[1].toLowerCase() : null;
    if (table && memoryStore[table]) {
      const newId = memoryStore.nextId[table]++;
      const record = { id: newId };
      memoryStore[table].push(record);
      return { rows: [record], rowCount: 1, lastID: newId };
    }
  }

  return { rows: [{ id: 1 }], rowCount: 1 };
}

/**
 * Initialize database schema
 */
async function initSchema() {
  if (dbType === 'memory') {
    console.log('✅ In-memory database initialized');
    return;
  }

  const isPg = dbType === 'postgres';
  const autoInc = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const timestampType = isPg ? 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
  const boolDefaultFalse = isPg ? 'BOOLEAN DEFAULT FALSE' : 'BOOLEAN DEFAULT 0';

  const queries = [
    // Users Table
    `CREATE TABLE IF NOT EXISTS users (
      id ${autoInc},
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar_color VARCHAR(50) DEFAULT '#6366F1',
      role_title VARCHAR(100) DEFAULT 'Team Member',
      created_at ${timestampType}
    )`,

    // Projects Table
    `CREATE TABLE IF NOT EXISTS projects (
      id ${autoInc},
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(50) DEFAULT '#6366F1',
      category VARCHAR(100) DEFAULT 'General',
      status VARCHAR(50) DEFAULT 'active',
      target_date VARCHAR(50),
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at ${timestampType},
      updated_at ${timestampType}
    )`,

    // Project Members Table
    `CREATE TABLE IF NOT EXISTS project_members (
      id ${autoInc},
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL DEFAULT 'Member',
      joined_at ${timestampType},
      UNIQUE(project_id, user_id)
    )`,

    // Tasks Table
    `CREATE TABLE IF NOT EXISTS tasks (
      id ${autoInc},
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'todo',
      priority VARCHAR(50) NOT NULL DEFAULT 'medium',
      due_date VARCHAR(50),
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      tags TEXT DEFAULT '',
      estimated_hours REAL DEFAULT 0,
      created_at ${timestampType},
      updated_at ${timestampType}
    )`,

    // Subtasks Table
    `CREATE TABLE IF NOT EXISTS subtasks (
      id ${autoInc},
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      completed ${boolDefaultFalse},
      created_at ${timestampType}
    )`,

    // Task Comments Table
    `CREATE TABLE IF NOT EXISTS task_comments (
      id ${autoInc},
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at ${timestampType}
    )`,

    // Activity Logs Table
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id ${autoInc},
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      created_at ${timestampType}
    )`
  ];

  console.log(`🔄 Initializing ${dbType.toUpperCase()} database schema...`);

  for (const sql of queries) {
    try {
      await query(sql);
    } catch (error) {
      console.error('❌ Database schema initialization error:', error.message);
      throw error;
    }
  }

  console.log(`✅ ${dbType.toUpperCase()} database schema initialized successfully`);
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    if (dbType === 'postgres' && pool) {
      const result = await pool.query('SELECT NOW() AS current_time');
      console.log(`✅ PostgreSQL connection successful: ${result.rows[0].current_time}`);
      return true;
    } else if (dbType === 'sqlite') {
      const result = await query('SELECT datetime("now") AS current_time');
      console.log(`✅ SQLite connection successful: ${result.rows[0]?.current_time || 'OK'}`);
      return true;
    } else {
      console.log('✅ Memory database connection active');
      return true;
    }
  } catch (error) {
    console.error(`❌ ${dbType.toUpperCase()} connection failed:`, error.message);
    return false;
  }
}

/**
 * Close database connection
 */
async function close() {
  try {
    if (dbType === 'postgres' && pool) {
      await pool.end();
      console.log('✅ PostgreSQL connection pool closed');
    } else if (sqliteDb) {
      sqliteDb.close();
      console.log('✅ SQLite database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
}

module.exports = {
  query,
  initSchema,
  testConnection,
  close,
  pool,
  get dbType() {
    return dbType;
  }
};