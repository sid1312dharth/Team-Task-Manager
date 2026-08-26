import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { api } from './api';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProjectsHub from './pages/ProjectsHub';
import ProjectWorkspace from './pages/ProjectWorkspace';
import MyTasks from './pages/MyTasks';
import TeamDirectory from './pages/TeamDirectory';
import ProfileSettings from './pages/ProfileSettings';

import TaskModal from './components/TaskModal';
import CreateTaskModal from './components/CreateTaskModal';
import CreateProjectModal from './components/CreateProjectModal';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();

  // Active view: 'dashboard' | 'projects' | 'project-detail' | 'my-tasks' | 'team' | 'profile'
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Global search
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile sidebar toggle
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Projects list cache
  const [projects, setProjects] = useState([]);

  // Active task detail modal
  const [activeTaskId, setActiveTaskId] = useState(null);

  // Create modals state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskDefaultProjectId, setCreateTaskDefaultProjectId] = useState(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const loadProjectsList = async () => {
    try {
      const data = await api.projects.list();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      // Ignore initial background load errors
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProjectsList();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wide">Starting Team Task Manager...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const projectList = Array.isArray(projects) ? projects : [];

  const handleOpenProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveView('project-detail');
  };

  const handleOpenTask = (taskId) => {
    setActiveTaskId(taskId);
  };

  const handleOpenCreateTask = (projectId = null) => {
    setCreateTaskDefaultProjectId(projectId || selectedProjectId || (projectList[0]?.id || null));
    setIsCreateTaskOpen(true);
  };

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => (Array.isArray(prev) ? [newProject, ...prev] : [newProject]));
    setSelectedProjectId(newProject.id);
    setActiveView('project-detail');
  };

  const handleTaskCreated = (newTask, pId) => {
    loadProjectsList();
  };

  // Get active page titles
  let pageTitle = 'Dashboard';
  let pageSubtitle = 'Overview & Sprint Metrics';

  if (activeView === 'projects') {
    pageTitle = 'Projects Hub';
    pageSubtitle = 'All Workspaces & Deliverables';
  } else if (activeView === 'project-detail') {
    const currentProj = projectList.find((p) => p.id === selectedProjectId);
    pageTitle = currentProj ? currentProj.name : 'Project Workspace';
    pageSubtitle = currentProj?.category ? `${currentProj.category} Workspace` : 'Tasks & Team';
  } else if (activeView === 'my-tasks') {
    pageTitle = 'My Tasks';
    pageSubtitle = 'Your Assigned Tasks Across Projects';
  } else if (activeView === 'team') {
    pageTitle = 'Team Directory';
    pageSubtitle = 'Workspace Members & Roles';
  } else if (activeView === 'profile') {
    pageTitle = 'Settings & Profile';
    pageSubtitle = 'Preferences & Account Information';
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        projects={projectList}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Sticky Header */}
        <Header
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenCreateTask={() => handleOpenCreateTask()}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
          setIsOpenMobile={setIsOpenMobile}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 pb-16">
          {activeView === 'dashboard' && (
            <Dashboard
              onOpenProject={handleOpenProject}
              onOpenTask={handleOpenTask}
              onOpenCreateTask={() => handleOpenCreateTask()}
              onOpenCreateProject={() => setIsCreateProjectOpen(true)}
            />
          )}

          {activeView === 'projects' && (
            <ProjectsHub
              onOpenProject={handleOpenProject}
              onOpenCreateProject={() => setIsCreateProjectOpen(true)}
            />
          )}

          {activeView === 'project-detail' && selectedProjectId && (
            <ProjectWorkspace
              projectId={selectedProjectId}
              onOpenTask={handleOpenTask}
              onOpenCreateTask={(pId) => handleOpenCreateTask(pId)}
              onBackToProjects={() => {
                setSelectedProjectId(null);
                setActiveView('projects');
              }}
            />
          )}

          {activeView === 'my-tasks' && (
            <MyTasks onOpenTask={handleOpenTask} />
          )}

          {activeView === 'team' && (
            <TeamDirectory />
          )}

          {activeView === 'profile' && (
            <ProfileSettings />
          )}
        </main>
      </div>

      {/* --- Global Modals --- */}

      {/* 1. Task Detail Drawer / Modal */}
      {activeTaskId && (
        <TaskModal
          taskId={activeTaskId}
          isOpen={!!activeTaskId}
          onClose={() => setActiveTaskId(null)}
          onTaskUpdated={() => {
            loadProjectsList();
          }}
          onTaskDeleted={() => {
            setActiveTaskId(null);
            loadProjectsList();
          }}
          projectMembers={
            projectList.find((p) => p.id === selectedProjectId)?.members || []
          }
        />
      )}

      {/* 2. Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreated={handleTaskCreated}
        defaultProjectId={createTaskDefaultProjectId}
        projects={projectList}
        members={
          projectList.find((p) => p.id === (createTaskDefaultProjectId || selectedProjectId))
            ?.members || []
        }
      />

      {/* 3. Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
