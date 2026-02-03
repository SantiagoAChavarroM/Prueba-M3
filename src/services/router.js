// Router SPA CRUDTASK (dashboard tipo Figma) + roles + CRUD tasks + admin users + create-task view + profile figma.
import { ROLES, TASK_STATUS } from "../constants/config.js";
import { qs, setHTML } from "../helpers/dom.js";
import { isEmail, isEmpty, minLength } from "../helpers/validators.js";
import { isAuthenticated, getUser, getRole, loginWithEmail, registerUser, logout } from "./auth.service.js";
import { http } from "./http.js";

const LOGO_URL = new URL("../assets/logo.svg", import.meta.url).href;

let tableState = { q: "", filter: "all" };

/* =========================
    Helpers
========================= */
function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderLoading() {
  return `
    <h3 style="margin-top:0;">Loading...</h3>
    <p class="small">Please wait.</p>
  `;
}

function renderMessage(type, title, message) {
  const cls = type === "error" ? "error" : "success";
  return `
    <h3 style="margin-top:0;">${title}</h3>
    <p class="${cls}">${message}</p>
    <a href="#/">Go Home</a>
  `;
}

function navigate(to) {
  window.location.hash = `#${to}`;
}

function redirectByRole() {
  const role = getRole();
  if (role === ROLES.ADMIN) return navigate("/admin/dashboard");
  return navigate("/user/dashboard");
}

function isPublicAuthRoute(pathname) {
  return pathname === "/login" || pathname === "/register" || pathname === "/";
}

function initials(name) {
  const parts = String(name || "").trim().split(" ").filter(Boolean);
  const a = (parts[0] || "U")[0];
  const b = (parts[1] || "")[0] || "";
  return (a + b).toUpperCase();
}

function toId(v) {
  return String(v ?? "");
}

function sortByCreatedAtDesc(items) {
  return [...(items || [])].sort((a, b) => {
    const da = new Date(a?.createdAt || 0).getTime();
    const db = new Date(b?.createdAt || 0).getTime();
    return db - da;
  });
}

/* =========================
    Layouts
========================= */
function layoutPublic(contentHTML) {
  return `
    <div class="auth-page">
      <div class="auth-card">
        ${contentHTML}
      </div>
    </div>
  `;
}

function layoutUserApp(contentHTML, activeKey) {
  const user = getUser();

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img src="${LOGO_URL}" alt="Logo" />
          <div class="title">CRUDTASK</div>
        </div>

        <nav class="side-nav">
          <a class="side-link ${activeKey === "dashboard" ? "active" : ""}" href="#/user/dashboard">Dashboard</a>
          <a class="side-link ${activeKey === "tasks" ? "active" : ""}" href="#/user/tasks">My Tasks</a>
          <a class="side-link ${activeKey === "profile" ? "active" : ""}" href="#/user/profile">Profile</a>
        </nav>
      </aside>

      <main class="main">
        <div class="mobile-top">
          <div class="sidebar-brand">
            <img src="${LOGO_URL}" alt="Logo" />
            <div class="title">CRUDTASK</div>
          </div>
        </div>

        <div class="topbar">
          <div class="crumbs">
            <span>Home</span>
            <span>/</span>
            <span>${
              activeKey === "dashboard"
                ? "Dashboard"
                : activeKey === "tasks"
                ? "My Tasks"
                : activeKey === "create"
                ? "Create Task"
                : "Profile"
            }</span>
          </div>

          <div class="user-chip">
            <div class="avatar">${initials(user.name)}</div>
            <div class="user-info">
              <div class="user-name">${escapeHTML(user.name)}</div>
              <div class="user-role">${escapeHTML(user.role)}</div>
            </div>

            <button id="logoutBtn" class="icon-btn" type="button" title="Logout">⎋</button>
          </div>
        </div>

        ${contentHTML}
      </main>
    </div>
  `;
}

function layoutAdminApp(contentHTML, activeKey) {
  const user = getUser();

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img src="${LOGO_URL}" alt="Logo" />
          <div class="title">CRUDTASK</div>
        </div>

        <nav class="side-nav">
          <a class="side-link ${activeKey === "dashboard" ? "active" : ""}" href="#/admin/dashboard">Dashboard</a>
          <a class="side-link ${activeKey === "tasks" ? "active" : ""}" href="#/admin/tasks">Tasks</a>
          <a class="side-link ${activeKey === "users" ? "active" : ""}" href="#/admin/users">Users</a>
        </nav>
      </aside>

      <main class="main">
        <div class="mobile-top">
          <div class="sidebar-brand">
            <img src="${LOGO_URL}" alt="Logo" />
            <div class="title">CRUDTASK</div>
          </div>
        </div>

        <div class="topbar">
          <div class="crumbs">
            <span>Home</span>
            <span>/</span>
            <span>${activeKey === "dashboard" ? "Dashboard" : activeKey === "tasks" ? "Tasks" : "Users"}</span>
          </div>

          <div class="user-chip">
            <div class="avatar">${initials(user.name)}</div>
            <div class="user-info">
              <div class="user-name">${escapeHTML(user.name)}</div>
              <div class="user-role">${escapeHTML(user.role)}</div>
            </div>

            <button id="logoutBtn" class="icon-btn" type="button" title="Logout">⎋</button>
          </div>
        </div>

        ${contentHTML}
      </main>
    </div>
  `;
}

/* =========================
    Views - AUTH
========================= */
function LoginView() {
  return `
    <div class="brand">
      <img src="${LOGO_URL}" alt="CRUDTASK logo" />
      <div class="brand-name">CRUDTASK</div>
    </div>

    <h3 class="auth-title">Welcome back</h3>
    <p class="auth-subtitle">Enter your credentials to access the platform</p>

    <form id="loginForm" class="grid">
      <div>
        <label class="small">Email or username</label>
        <input id="email" type="email" placeholder="student@university.edu" />
      </div>

      <div>
        <label class="small">Password</label>
        <input id="password" type="password" placeholder="••••••••" />
      </div>

      <div class="auth-actions">
        <label class="remember">
          <input id="rememberMe" type="checkbox" />
          Remember me
        </label>

        <a id="forgotPassword" href="javascript:void(0)">Forgot password?</a>
      </div>

      <p id="formError" class="error" style="margin:0; display:none;"></p>

      <button class="primary btn-full" type="submit">Sign in</button>

      <p class="small" style="text-align:center; margin:0;">
        Don't have an account? <a href="#/register"><b>Register</b></a>
      </p>
    </form>
  `;
}

function RegisterView() {
  return `
    <div class="brand">
      <img src="${LOGO_URL}" alt="CRUDTASK logo" />
      <div class="brand-name">CRUDTASK</div>
    </div>

    <h3 class="auth-title">Create account</h3>
    <p class="auth-subtitle">Join the academic performance platform today</p>

    <form id="registerForm" class="grid">
      <div>
        <label class="small">Full Name</label>
        <input id="name" type="text" placeholder="John Doe" />
      </div>

      <div>
        <label class="small">Email address</label>
        <input id="email" type="email" placeholder="student@university.edu" />
      </div>

      <div>
        <label class="small">Password</label>
        <input id="password" type="password" placeholder="Create a password" />
      </div>

      <div>
        <label class="small">Confirm Password</label>
        <input id="confirmPassword" type="password" placeholder="Confirm password" />
      </div>

      <p id="formError" class="error" style="margin:0; display:none;"></p>

      <button class="primary btn-full" type="submit">Register</button>

      <p class="small" style="text-align:center; margin:0;">
        Already have an account? <a href="#/login"><b>Sign in</b></a>
      </p>

      <p class="small" style="text-align:center; margin:0;">
        Role is assigned automatically as <code>user</code>.
      </p>
    </form>
  `;
}

/* =========================
    Views - USER
========================= */
function statusBadge(status) {
  const cls =
    status === TASK_STATUS.PENDING ? "pending" : status === TASK_STATUS.IN_PROGRESS ? "in_progress" : "completed";
  const label =
    status === TASK_STATUS.PENDING ? "Pending" : status === TASK_STATUS.IN_PROGRESS ? "In Progress" : "Completed";
  return `<span class="badge ${cls}">${label}</span>`;
}

function computeStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;
  const pending = tasks.filter((t) => t.status === TASK_STATUS.PENDING).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, pending, progress };
}

function filterTasks(tasks) {
  const q = tableState.q.trim().toLowerCase();

  let filtered = [...tasks];

  if (tableState.filter === "pending") filtered = filtered.filter((t) => t.status === TASK_STATUS.PENDING);
  if (tableState.filter === "completed") filtered = filtered.filter((t) => t.status === TASK_STATUS.COMPLETED);

  if (q) {
    filtered = filtered.filter(
      (t) =>
        String(t.title || "").toLowerCase().includes(q) || String(t.description || "").toLowerCase().includes(q)
    );
  }

  return filtered;
}

function UserDashboardView({ tasks }) {
  const stats = computeStats(tasks);
  const list = filterTasks(tasks);

  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">Task Manager</h1>
        <p class="page-subtitle">Overview of your current academic performance tasks.</p>
      </div>

      <button id="goCreateTask" class="primary btn-icon" type="button">＋ New Task</button>
    </div>

    <div class="stats">
      <div class="stat-card">
        <p class="stat-label">Total Tasks</p>
        <p class="stat-value">${stats.total}</p>
        <p class="stat-foot">Keep adding tasks</p>
      </div>

      <div class="stat-card">
        <p class="stat-label">Completed</p>
        <p class="stat-value">${stats.completed}</p>
        <p class="stat-foot">Great progress</p>
      </div>

      <div class="stat-card">
        <p class="stat-label">Pending</p>
        <p class="stat-value">${stats.pending}</p>
        <p class="stat-foot">Focus on priorities</p>
      </div>

      <div class="stat-card">
        <p class="stat-label">Overall Progress</p>
        <p class="stat-value">${stats.progress}%</p>
        <p class="stat-foot">Keep it up</p>
      </div>
    </div>

    <div class="panel" style="margin-top:14px;">
      <div id="editTaskBox"></div>

      <div class="panel-top">
        <div class="search">
          <input id="searchInput" type="text" placeholder="Search tasks..." value="${escapeHTML(tableState.q)}" />
        </div>

        <div class="pills" role="tablist">
          <button class="pill ${tableState.filter === "all" ? "active" : ""}" data-filter="all" type="button">All Tasks</button>
          <button class="pill ${tableState.filter === "pending" ? "active" : ""}" data-filter="pending" type="button">Pending</button>
          <button class="pill ${tableState.filter === "completed" ? "active" : ""}" data-filter="completed" type="button">Completed</button>
        </div>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Task name</th>
              <th>Status</th>
              <th>Due date</th>
              <th style="width:140px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              list.length === 0
                ? `<tr><td colspan="4" class="small">No tasks found.</td></tr>`
                : list
                    .map(
                      (t) => `
                        <tr>
                          <td>
                            <div style="font-weight:800;">${escapeHTML(t.title)}</div>
                            <div class="small">${escapeHTML(t.description || "")}</div>
                          </td>
                          <td>${statusBadge(t.status)}</td>
                          <td>${escapeHTML(t.dueDate || "-")}</td>
                          <td>
                            <div class="actions">
                              <button class="icon-btn editBtn" data-id="${t.id}" type="button" title="Edit">✎</button>
                              <button class="icon-btn deleteBtn" data-id="${t.id}" type="button" title="Delete">🗑</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function CreateTaskView() {
  return `
    <div style="margin-top:18px;">
      <a class="back-link" href="#/user/tasks">← Back to Tasks</a>
      <div style="height:10px;"></div>

      <h1 class="page-title" style="margin-top:0;">Create New Task</h1>

      <div class="form-wrap">
        <div class="form-card">
          <form id="createTaskPageForm">
            <div class="form-grid">
              <div class="full">
                <label class="small">Task Title<span class="req">*</span></label>
                <input id="title" type="text" placeholder="e.g., Complete Quarter 3 Report" />
              </div>

              <div>
                <label class="small">Category</label>
                <select id="category">
                  <option value="">Select category...</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="History">History</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Literature">Literature</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label class="small">Priority</label>
                <select id="priority">
                  <option value="Low">Low</option>
                  <option value="Medium" selected>Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label class="small">Status</label>
                <select id="status">
                  <option value="${TASK_STATUS.PENDING}" selected>pending</option>
                  <option value="${TASK_STATUS.IN_PROGRESS}">in_progress</option>
                  <option value="${TASK_STATUS.COMPLETED}">completed</option>
                </select>
              </div>

              <div>
                <label class="small">Due Date</label>
                <input id="dueDate" type="date" />
              </div>

              <div class="full">
                <label class="small">Description</label>
                <textarea id="description" rows="5" placeholder="Add details about this task..."></textarea>
              </div>
            </div>

            <p id="formError" class="error" style="margin:10px 0 0 0; display:none;"></p>

            <div class="form-actions">
              <button id="cancelCreate" class="secondary" type="button">Cancel</button>
              <button class="primary" type="submit">Save Task</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function UserProfileFigmaView({ tasksCount }) {
  const user = getUser();

  // Comentario (ES): Datos “bonitos” para parecerse al Figma (no obligatorios en examen).
  const roleLabel = user.role === ROLES.ADMIN ? "System Admin" : "Student";
  const employeeId = `CZ-${String(user.id).padStart(6, "0")}`;
  const department = user.role === ROLES.ADMIN ? "Computer Science" : "Student Affairs";
  const joinDate = "September 14, 2020";
  const phone = "+1 (555) 123-4567";

  return `
    <div style="margin-top:18px;">
      <h1 class="page-title" style="margin-top:0;">My Profile</h1>

      <div class="profile-grid">
        <div class="profile-left">
          <div class="profile-banner"></div>
          <div class="profile-body">
            <div class="profile-avatar-lg">${initials(user.name)}</div>
            <p class="profile-name">${escapeHTML(user.name)}</p>
            <div class="role-pill">${escapeHTML(roleLabel)}</div>

            <div class="profile-email">
              <span>✉</span>
              <span>${escapeHTML(user.email)}</span>
            </div>

            <div class="profile-kpi">
              <div class="kpi-value">${tasksCount}</div>
              <div class="kpi-label">Tasks</div>
            </div>

            <div style="height:12px;"></div>
            <button id="logoutProfileBtn" class="secondary" type="button">Logout</button>
          </div>
        </div>

        <div class="profile-right">
          <div class="profile-right-head">
            <p class="profile-right-title">Personal Information</p>
            <button id="editProfileBtn" class="secondary" type="button">✎ Edit Profile</button>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <p class="label">Full Name</p>
              <p class="value">${escapeHTML(user.name)}</p>
            </div>

            <div class="info-item">
              <p class="label">Employee ID</p>
              <p class="value">${escapeHTML(employeeId)}</p>
            </div>

            <div class="info-item">
              <p class="label">Phone</p>
              <p class="value">${escapeHTML(phone)}</p>
            </div>

            <div class="info-item">
              <p class="label">Department</p>
              <p class="value"><span class="tag">${escapeHTML(department)}</span></p>
            </div>

            <div class="info-item">
              <p class="label">Role Level</p>
              <p class="value">${escapeHTML(user.role === ROLES.ADMIN ? "Senior Administrator" : "Student User")}</p>
            </div>

            <div class="info-item">
              <p class="label">Join Date</p>
              <p class="value">${escapeHTML(joinDate)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* =========================
    Views - ADMIN
========================= */
function AdminDashboardView({ total, pending, completed }) {
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">Admin Dashboard</h1>
        <p class="page-subtitle">System metrics overview.</p>
      </div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <p class="stat-label">Total tasks</p>
        <p class="stat-value">${total}</p>
        <p class="stat-foot">All users</p>
      </div>

      <div class="stat-card">
        <p class="stat-label">Pending</p>
        <p class="stat-value">${pending}</p>
        <p class="stat-foot">Needs attention</p>
      </div>

      <div class="stat-card">
        <p class="stat-label">Completed</p>
        <p class="stat-value">${completed}</p>
        <p class="stat-foot">Delivered tasks</p>
      </div>

      <div class="stat-card">
        <p class="stat-label">Overall Progress</p>
        <p class="stat-value">${progress}%</p>
        <p class="stat-foot">System completion</p>
      </div>
    </div>
  `;
}

function AdminTasksView({ tasks }) {
  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">Tasks</h1>
        <p class="page-subtitle">Manage all tasks in the system.</p>
      </div>
    </div>

    <div class="panel">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Task name</th>
              <th>Status</th>
              <th>Due date</th>
              <th>UserId</th>
              <th style="width:140px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              tasks.length === 0
                ? `<tr><td colspan="5" class="small">No tasks found.</td></tr>`
                : tasks
                    .map(
                      (t) => `
                        <tr>
                          <td>
                            <div style="font-weight:800;">${escapeHTML(t.title)}</div>
                            <div class="small">${escapeHTML(t.description || "")}</div>
                          </td>
                          <td>${statusBadge(t.status)}</td>
                          <td>${escapeHTML(t.dueDate || "-")}</td>
                          <td>${t.userId}</td>
                          <td>
                            <div class="actions">
                              <button class="icon-btn editBtn" data-id="${t.id}" type="button" title="Edit">✎</button>
                              <button class="icon-btn deleteBtn" data-id="${t.id}" type="button" title="Delete">🗑</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>

      <div id="editTaskBox" style="margin-top:12px;"></div>
    </div>
  `;
}

function AdminUsersView({ users }) {
  return `
    <div class="page-head">
      <div>
        <h1 class="page-title">Users</h1>
        <p class="page-subtitle">Registered users (bonus).</p>
      </div>
    </div>

    <div class="panel">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${
              users.length === 0
                ? `<tr><td colspan="5" class="small">No users found.</td></tr>`
                : users
                    .map(
                      (u) => `
                        <tr>
                          <td>${u.id}</td>
                          <td>${escapeHTML(u.name)}</td>
                          <td>${escapeHTML(u.email)}</td>
                          <td><b>${escapeHTML(u.role)}</b></td>
                          <td>${escapeHTML((u.createdAt || "").slice(0, 10) || "-")}</td>
                        </tr>
                      `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function NotFoundView() {
  return `
    <h3 style="margin-top:0;">Not Found</h3>
    <p class="error">This route does not exist.</p>
    <a href="#/">Go Home</a>
  `;
}

/* =========================
    Handlers (API)
========================= */
async function userTasksHandler() {
  const user = getUser();
  if (!user || user.id == null) return [];

  // Traemos TODO y filtramos en frontend (evita problemas por tipos number/string y json-server v1)
  const all = await http.get(`/tasks`);
  const mine = (all || []).filter((t) => toId(t.userId) === toId(user.id));
  return sortByCreatedAtDesc(mine);
}

async function adminAllTasksHandler() {
  // Traemos TODO y ordenamos en frontend (evita inconsistencias con _sort/_order)
  const all = await http.get(`/tasks`);
  return sortByCreatedAtDesc(all);
}

/* =========================
    Router core
========================= */
function getPathFromHash() {
  const hash = window.location.hash || "#/";
  const path = hash.replace("#", "");
  return path === "" ? "/" : path;
}

const routes = [
  { path: "/", publicOnly: true, handler: () => LoginView() },
  { path: "/login", publicOnly: true, handler: () => LoginView() },
  { path: "/register", publicOnly: true, handler: () => RegisterView() },

  { path: "/logout", protected: true, handler: () => "<p>Signing out...</p>" },

  { path: "/user/dashboard", protected: true, role: ROLES.USER, handler: (p) => userDashboardRoute(p) },
  { path: "/user/tasks", protected: true, role: ROLES.USER, handler: (p) => userDashboardRoute(p) },
  { path: "/user/tasks/new", protected: true, role: ROLES.USER, handler: () => layoutUserApp(CreateTaskView(), "create") },
  { path: "/user/profile", protected: true, role: ROLES.USER, handler: () => userProfileRoute() },

  { path: "/admin/dashboard", protected: true, role: ROLES.ADMIN, handler: () => adminDashboardRoute() },
  { path: "/admin/tasks", protected: true, role: ROLES.ADMIN, handler: () => adminTasksRoute() },
  { path: "/admin/users", protected: true, role: ROLES.ADMIN, handler: () => adminUsersRoute() },

  { path: "*", handler: () => NotFoundView() }
];

function matchRoute(pathname) {
  return routes.find((r) => r.path === pathname) || routes.find((r) => r.path === "*");
}

async function userDashboardRoute(pathname) {
  const tasks = await userTasksHandler();
  const active = pathname === "/user/tasks" ? "tasks" : "dashboard";
  const html = UserDashboardView({ tasks });
  return layoutUserApp(html, active);
}

async function userProfileRoute() {
  const tasks = await userTasksHandler();
  const html = UserProfileFigmaView({ tasksCount: tasks.length });
  return layoutUserApp(html, "profile");
}

async function adminDashboardRoute() {
  const tasks = await adminAllTasksHandler();
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === TASK_STATUS.PENDING).length;
  const completed = tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;
  return layoutAdminApp(AdminDashboardView({ total, pending, completed }), "dashboard");
}

async function adminTasksRoute() {
  const tasks = await adminAllTasksHandler();
  return layoutAdminApp(AdminTasksView({ tasks }), "tasks");
}

async function adminUsersRoute() {
  // igual: traemos todo y ordenamos aquí si quieres
  const users = await http.get(`/users`);
  // orden opcional por createdAt
  const sorted = sortByCreatedAtDesc(users);
  return layoutAdminApp(AdminUsersView({ users: sorted }), "users");
}

async function render() {
  const app = qs("#app");
  const pathname = getPathFromHash();
  const route = matchRoute(pathname);

  if (route.protected && !isAuthenticated()) return navigate("/login");
  if (route.publicOnly && isAuthenticated()) return redirectByRole();
  if (route.role && getRole() !== route.role) return redirectByRole();

  if (isPublicAuthRoute(pathname)) setHTML(app, layoutPublic(renderLoading()));
  else setHTML(app, renderLoading());

  try {
    if (pathname === "/logout") {
      logout();
      return navigate("/login");
    }

    const html = await route.handler(pathname);
    setHTML(app, isPublicAuthRoute(pathname) ? layoutPublic(html) : html);

    wireListeners(pathname);
  } catch (err) {
    const html = renderMessage("error", "Something went wrong", err.message || "Unknown error.");
    setHTML(app, isPublicAuthRoute(pathname) ? layoutPublic(html) : html);
  }
}

/* =========================
    Listeners
========================= */
function showFormError(id, message) {
  const el = qs(id);
  if (!el) return;
  el.style.display = "block";
  el.textContent = message;
}

function hideFormError(id) {
  const el = qs(id);
  if (!el) return;
  el.style.display = "none";
  el.textContent = "";
}

function wireListeners(pathname) {
  // Logout buttons
  const logoutBtn = qs("#logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => navigate("/logout"));

  const logoutProfileBtn = qs("#logoutProfileBtn");
  if (logoutProfileBtn) logoutProfileBtn.addEventListener("click", () => navigate("/logout"));

  // Profile UI only
  const editProfileBtn = qs("#editProfileBtn");
  if (editProfileBtn) editProfileBtn.addEventListener("click", () => alert("Edit Profile is UI-only in this demo."));

  // Forgot password (UI only)
  const forgot = qs("#forgotPassword");
  if (forgot) forgot.addEventListener("click", () => alert("Password recovery is not available in this demo."));

  // Login
  if (pathname === "/" || pathname === "/login") {
    const form = qs("#loginForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideFormError("#formError");

        const email = qs("#email").value.trim();
        const password = qs("#password").value;

        if (!isEmail(email)) return showFormError("#formError", "Please enter a valid email.");
        if (isEmpty(password)) return showFormError("#formError", "Password is required.");

        try {
          await loginWithEmail(email, password);
          redirectByRole();
        } catch (err) {
          showFormError("#formError", err.message);
        }
      });
    }
  }

  // Register
  if (pathname === "/register") {
    const form = qs("#registerForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideFormError("#formError");

        const name = qs("#name").value.trim();
        const email = qs("#email").value.trim();
        const password = qs("#password").value;
        const confirmPassword = qs("#confirmPassword").value;

        if (isEmpty(name)) return showFormError("#formError", "Full name is required.");
        if (!isEmail(email)) return showFormError("#formError", "Please enter a valid email.");
        if (!minLength(password, 8)) return showFormError("#formError", "Password must be at least 8 characters.");
        if (password !== confirmPassword) return showFormError("#formError", "Passwords do not match.");

        try {
          await registerUser({ name, email, password });
          navigate("/login");
        } catch (err) {
          showFormError("#formError", err.message);
        }
      });
    }
  }

  // Dashboard/Tasks: New Task button navigates to create page
  if (pathname === "/user/dashboard" || pathname === "/user/tasks") {
    const btn = qs("#goCreateTask");
    if (btn) btn.addEventListener("click", () => navigate("/user/tasks/new"));

    const search = qs("#searchInput");
    if (search) {
      search.addEventListener("input", async (e) => {
        tableState.q = e.target.value;
        await render();
      });
    }

    document.querySelectorAll(".pill").forEach((b) => {
      b.addEventListener("click", async (e) => {
        tableState.filter = e.target.dataset.filter;
        await render();
      });
    });

    document.querySelectorAll(".editBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        // id puede ser string (ej. "1b76"); no convertir a Number.
        const id = e.currentTarget.dataset.id;

        try {
          const task = await http.get(`/tasks/${id}`);

          if (toId(task.userId) !== toId(getUser().id)) {
            alert("You can only edit your own tasks.");
            return;
          }

          const slot = qs("#editTaskBox");
          slot.innerHTML = `
            <div class="card" style="box-shadow:none; border:1px solid var(--border); margin-bottom:12px;">
              <div class="row">
                <h4 style="margin:0;">Edit Task</h4>
                <button id="closeEditTask" class="secondary" type="button">Close</button>
              </div>

              <div style="height:10px;"></div>

              <form id="editTaskForm" class="grid">
                <div>
                  <label class="small">Task name</label>
                  <input id="editTitle" type="text" value="${escapeHTML(task.title)}" />
                </div>

                <div>
                  <label class="small">Description</label>
                  <textarea id="editDescription" rows="3">${escapeHTML(task.description || "")}</textarea>
                </div>

                <div class="grid two">
                  <div>
                    <label class="small">Due date</label>
                    <input id="editDueDate" type="date" value="${escapeHTML(task.dueDate || "")}" />
                  </div>
                  <div>
                    <label class="small">Status</label>
                    <select id="editStatus">
                      <option value="${TASK_STATUS.PENDING}" ${task.status === TASK_STATUS.PENDING ? "selected" : ""}>pending</option>
                      <option value="${TASK_STATUS.IN_PROGRESS}" ${task.status === TASK_STATUS.IN_PROGRESS ? "selected" : ""}>in_progress</option>
                      <option value="${TASK_STATUS.COMPLETED}" ${task.status === TASK_STATUS.COMPLETED ? "selected" : ""}>completed</option>
                    </select>
                  </div>
                </div>

                <p id="editError" class="error" style="margin:0; display:none;"></p>

                <div class="row" style="justify-content:flex-start;">
                  <button class="primary" type="submit">Save changes</button>
                </div>
              </form>
            </div>
          `;

          qs("#closeEditTask").addEventListener("click", () => (slot.innerHTML = ""));

          qs("#editTaskForm").addEventListener("submit", async (ev) => {
            ev.preventDefault();

            const editError = qs("#editError");
            editError.style.display = "none";
            editError.textContent = "";

            const title = qs("#editTitle").value.trim();
            const description = qs("#editDescription").value.trim();
            const dueDate = qs("#editDueDate").value;
            const status = qs("#editStatus").value;

            if (isEmpty(title)) {
              editError.style.display = "block";
              editError.textContent = "Task name is required.";
              return;
            }

            try {
              await http.patch(`/tasks/${id}`, {
                title,
                description,
                dueDate,
                status,
                updatedAt: new Date().toISOString()
              });
              await render();
            } catch (err) {
              editError.style.display = "block";
              editError.textContent = err.message;
            }
          });
        } catch (err) {
          alert(err.message);
        }
      });
    });

    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;

        try {
          const task = await http.get(`/tasks/${id}`);

          if (toId(task.userId) !== toId(getUser().id)) {
            alert("You can only delete your own tasks.");
            return;
          }

          await http.del(`/tasks/${id}`);
          await render();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }

  // Create Task page
  if (pathname === "/user/tasks/new") {
    const cancel = qs("#cancelCreate");
    if (cancel) cancel.addEventListener("click", () => navigate("/user/tasks"));

    const form = qs("#createTaskPageForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideFormError("#formError");

        const user = getUser();
        const title = qs("#title").value.trim();
        const category = qs("#category").value;
        const priority = qs("#priority").value;
        const status = qs("#status").value;
        const dueDate = qs("#dueDate").value;
        const description = qs("#description").value.trim();

        if (isEmpty(title)) return showFormError("#formError", "Task title is required.");

        try {
          const now = new Date().toISOString();

          await http.post("/tasks", {
            title,
            category,
            priority,
            status,
            dueDate,
            description,
            // consistente para que SIEMPRE filtre bien
            userId: toId(user.id),
            createdAt: now,
            updatedAt: now
          });

          navigate("/user/tasks");
        } catch (err) {
          showFormError("#formError", err.message);
        }
      });
    }
  }

  // ADMIN tasks
  if (pathname === "/admin/tasks") {
    document.querySelectorAll(".editBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;

        try {
          const task = await http.get(`/tasks/${id}`);

          const slot = qs("#editTaskBox");
          slot.innerHTML = `
            <div class="card" style="box-shadow:none; border:1px solid var(--border); margin-bottom:12px;">
              <div class="row">
                <h4 style="margin:0;">Edit Task</h4>
                <button id="closeEditTask" class="secondary" type="button">Close</button>
              </div>

              <div style="height:10px;"></div>

              <form id="editTaskForm" class="grid">
                <div>
                  <label class="small">Task name</label>
                  <input id="editTitle" type="text" value="${escapeHTML(task.title)}" />
                </div>

                <div>
                  <label class="small">Description</label>
                  <textarea id="editDescription" rows="3">${escapeHTML(task.description || "")}</textarea>
                </div>

                <div class="grid two">
                  <div>
                    <label class="small">Due date</label>
                    <input id="editDueDate" type="date" value="${escapeHTML(task.dueDate || "")}" />
                  </div>
                  <div>
                    <label class="small">Status</label>
                    <select id="editStatus">
                      <option value="${TASK_STATUS.PENDING}" ${task.status === TASK_STATUS.PENDING ? "selected" : ""}>pending</option>
                      <option value="${TASK_STATUS.IN_PROGRESS}" ${task.status === TASK_STATUS.IN_PROGRESS ? "selected" : ""}>in_progress</option>
                      <option value="${TASK_STATUS.COMPLETED}" ${task.status === TASK_STATUS.COMPLETED ? "selected" : ""}>completed</option>
                    </select>
                  </div>
                </div>

                <p id="editError" class="error" style="margin:0; display:none;"></p>

                <div class="row" style="justify-content:flex-start;">
                  <button class="primary" type="submit">Save changes</button>
                </div>
              </form>
            </div>
          `;

          qs("#closeEditTask").addEventListener("click", () => (slot.innerHTML = ""));

          qs("#editTaskForm").addEventListener("submit", async (ev) => {
            ev.preventDefault();

            const editError = qs("#editError");
            editError.style.display = "none";
            editError.textContent = "";

            const title = qs("#editTitle").value.trim();
            const description = qs("#editDescription").value.trim();
            const dueDate = qs("#editDueDate").value;
            const status = qs("#editStatus").value;

            if (isEmpty(title)) {
              editError.style.display = "block";
              editError.textContent = "Task name is required.";
              return;
            }

            try {
              await http.patch(`/tasks/${id}`, {
                title,
                description,
                dueDate,
                status,
                updatedAt: new Date().toISOString()
              });
              await render();
            } catch (err) {
              editError.style.display = "block";
              editError.textContent = err.message;
            }
          });
        } catch (err) {
          alert(err.message);
        }
      });
    });

    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;

        try {
          await http.del(`/tasks/${id}`);
          await render();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }
}

export function startRouter() {
  window.addEventListener("hashchange", render);
  window.addEventListener("load", render);
  render();
}