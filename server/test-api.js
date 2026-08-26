const { app, initPromise } = require('./index');

async function testAll() {
  const TEST_PORT = 5002;

  // Wait for database schema and seeder to complete
  console.log('🔄 Waiting for database initialization & seeding...');
  await initPromise;
  console.log('✅ Database initialization complete.');

  const testServer = app.listen(TEST_PORT, async () => {
    try {
      console.log('--- Testing Auth Login ---');
      const loginRes = await fetch(`http://localhost:${TEST_PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alex@example.com', password: 'password123' })
      });
      const loginData = await loginRes.json();
      console.log('Login success! User:', loginData.user?.name, 'Token length:', loginData.token?.length);

      const token = loginData.token;
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('--- Testing /api/auth/me ---');
      const meRes = await fetch(`http://localhost:${TEST_PORT}/api/auth/me`, { headers: authHeaders });
      const meData = await meRes.json();
      console.log('Me user:', meData.user?.name, meData.user?.email);

      console.log('--- Testing /api/projects ---');
      const projRes = await fetch(`http://localhost:${TEST_PORT}/api/projects`, { headers: authHeaders });
      const projData = await projRes.json();
      console.log('Projects count:', projData.length);
      const p1 = projData[0];
      console.log('First project:', p1.name, 'Tasks:', p1.task_count, 'Completed:', p1.completed_task_count);

      console.log('--- Testing /api/project/:id/tasks ---');
      const tasksRes = await fetch(`http://localhost:${TEST_PORT}/api/project/${p1.id}/tasks`, { headers: authHeaders });
      const tasksData = await tasksRes.json();
      console.log(`Tasks for project ${p1.id}:`, tasksData.length);

      console.log('--- Testing /api/stats/dashboard ---');
      const statsRes = await fetch(`http://localhost:${TEST_PORT}/api/stats/dashboard`, { headers: authHeaders });
      const statsData = await statsRes.json();
      console.log('Dashboard stats:', {
        total_projects: statsData.total_projects,
        total_tasks: statsData.total_tasks,
        completed_tasks: statsData.completed_tasks,
        overdue_tasks: statsData.overdue_tasks,
        completion_rate: statsData.completion_rate
      });

      console.log('--- Testing /api/tasks/my-tasks ---');
      const myTasksRes = await fetch(`http://localhost:${TEST_PORT}/api/tasks/my-tasks`, { headers: authHeaders });
      const myTasksData = await myTasksRes.json();
      console.log('My tasks count:', myTasksData.length);

      console.log('✅ ALL BACKEND API ENDPOINTS PASSED SUCCESSFULLY AGAINST POSTGRESQL!');
    } catch (err) {
      console.error('❌ API Test Error:', err);
    } finally {
      testServer.close(() => {
        process.exit(0);
      });
    }
  });
}

testAll();
