# Team Task Manager 🚀

A modern, full-stack collaborative project management platform with interactive Kanban sprints, role-based access control, checklist subtasks, comments discussion feed, overdue milestone detection, and instant zero-config database execution.

---

## 🌟 Key Features

- **Executive Workspace Dashboard**: Real-time KPI cards, completion velocity rate, active sprint breakdown, overdue task alerts, upcoming deadlines calendar, and recent team activity feed.
- **Interactive Kanban Board**: 4-column sprint management (`To Do`, `In Progress`, `In Review`, `Done`) with priority badges, overdue indicators, subtask progress, and quick move state transitions.
- **List / Table View**: Sortable and filterable task spreadsheet with inline status selectors and priority tags.
- **Role-Based Access Control (RBAC)**: Distinct permissions for **Admin / Project Lead** (create/edit/delete projects, manage members, assign tasks) and **Team Member** (status updates, comments, subtasks, work logging).
- **Task Detail Drawer**: Subtasks checklist with completion percentage bar, live activity timeline, and comments discussion thread.
- **My Tasks View**: Unified aggregation of all tasks assigned to the logged-in user across all workspaces, filterable by *Overdue*, *Due Today*, *In Progress*, and *Completed*.
- **Team Directory**: Organization-wide member directory with custom avatar colors and professional role titles.
- **Appearance & Themes**: Seamless Dark Mode & Light Mode support with persistent storage.
- **Universal Dual Database Engine**: Zero-configuration local **SQLite** for instant 1-click startup + automatic **PostgreSQL** support for cloud deployments (Render, Supabase, Railway).
- **1-Click Demo Logins**: Pre-loaded with realistic demo team members (`Alex Rivera` [Admin], `Sarah Chen` [Frontend], `Mike Ross` [Design], `Elena Rostova` [DevOps]) and sample active sprints.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Plus Jakarta Sans typography.
- **Backend**: Node.js, Express, JWT Authentication, bcryptjs password hashing.
- **Database**: Universal adapter supporting PostgreSQL (`pg`) and SQLite (`sqlite3`) with automatic table creation and data seeding.
- **Deployment**: Vercel-ready frontend configuration (`vercel.json`) and Render-ready Blueprint (`render.yaml`).

---

## 🚀 Local Development

### 1. Backend Server
```bash
cd server
npm install
npm run dev
```
*Runs on `http://localhost:5000`. If `DATABASE_URL` is omitted, it automatically uses local SQLite (`server/taskmanager.sqlite`) with auto-created tables and seed data.*

### 2. Frontend Client
```bash
cd client
npm install
npm run dev
```
*Vite dev server starts on `http://localhost:3000` with API proxy configured.*

---

## 🌐 Deployment Guide (Vercel & Render)

### Option 1: Frontend on Vercel + Backend on Render (Recommended)

#### A. Deploy Backend & Database on Render
1. Push your code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) ➜ **New** ➜ **Web Service**.
3. Connect your repository and configure:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: *(A random secure string)*
   - `DATABASE_URL`: *(Your PostgreSQL database connection string, e.g. from Render PostgreSQL or Supabase/Neon)*
5. Click **Create Web Service**. Note your backend URL (e.g. `https://team-task-manager-api.onrender.com`).

#### B. Deploy Frontend on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/) ➜ **Add New Project** ➜ Import your GitHub repository.
2. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client` *(or leave as root; `vercel.json` is configured for both)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://team-task-manager-api.onrender.com/api` *(Your Render backend URL + `/api`)*
4. Click **Deploy**!

---

### Option 2: 1-Click Render Blueprint (Full-Stack + PostgreSQL)

Render Blueprint automatically provisions the Node.js API, PostgreSQL database, and React static frontend in one go:
1. In Render Dashboard, click **New** ➜ **Blueprint**.
2. Select your repository.
3. Render reads [`render.yaml`](file:///c:/Users/Homeasy/Documents/GitHub/Team-Task-Manager/render.yaml) and automatically creates:
   - `team-task-manager-api` (Backend Web Service)
   - `team-task-manager-db` (Free Managed PostgreSQL Database)
   - `team-task-manager-web` (Frontend Static Site)
4. Click **Apply** to deploy!

---

## 🔑 Pre-Loaded Demo Accounts

On the login screen, click any of the 1-Click Demo Login cards:
- **Alex Rivera (Project Lead / Admin)**: `alex@example.com` / `password123`
- **Sarah Chen (Senior Frontend Engineer)**: `sarah@example.com` / `password123`
- **Mike Ross (UI/UX Product Designer)**: `mike@example.com` / `password123`
- **Elena Rostova (Backend Infrastructure Lead)**: `elena@example.com` / `password123`