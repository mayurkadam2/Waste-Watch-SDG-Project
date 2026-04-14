/**
 * DATA LAYER — Campus Waste Management System
 * All state lives in MongoDB Atlas via REST API.
 * JWT token stored in sessionStorage.
 */
const WMS = (() => {
  const API = 'https://waste-watch-sdg-project.onrender.com/api';
  const TOKEN_KEY = 'wms_token';
  const USER_KEY = 'wms_user';

  // ── Token helpers ──────────────────────────────────────────────────
  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  // ── Fetch wrapper ─────────────────────────────────────────────────
  async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = { ...options.headers };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets multipart boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API}${url}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw { status: res.status, error: data.error || 'Request failed' };
    }

    return data;
  }

  // ── Auth ───────────────────────────────────────────────────────────
  async function login(email, password) {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setSession(data.token, data.user);
      return data.user;
    } catch (err) {
      return null;
    }
  }

  async function register(name, email, password, dept) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, dept })
    });
    setSession(data.token, data.user);
    return data.user;
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  function currentUser() {
    try {
      const str = sessionStorage.getItem(USER_KEY);
      return str ? JSON.parse(str) : null;
    } catch { return null; }
  }

  function requireAuth(role) {
    const u = currentUser();
    if (!u) { window.location.href = 'index.html'; return null; }
    if (role && u.role !== role) { window.location.href = 'index.html'; return null; }
    return u;
  }

  // ── Users ─────────────────────────────────────────────────────────
  async function getUsers(role) {
    const query = role ? `?role=${role}` : '';
    return apiFetch(`/users${query}`);
  }

  async function getUserById(id) {
    return apiFetch(`/users/${id}`);
  }

  async function getMe() {
    const user = await apiFetch('/users/me');
    // Update session cache
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  async function createUser(data) {
    try {
      const user = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return { user };
    } catch (err) {
      return { error: err.error || 'Failed to create user' };
    }
  }

  async function deleteUser(id) {
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
    return true;
  }

  async function updateUser(id, fields) {
    const user = await apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify(fields)
    });
    // Refresh session
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  async function changePassword(currentPassword, newPassword) {
    try {
      await apiFetch('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return { ok: true };
    } catch (err) {
      return { error: err.error || 'Failed to change password' };
    }
  }

  // ── Complaints ─────────────────────────────────────────────────────
  async function getComplaints(filter = {}) {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.reporterId) params.set('reporterId', filter.reporterId);
    const query = params.toString() ? `?${params}` : '';
    return apiFetch(`/complaints${query}`);
  }

  async function getComplaintById(id) {
    try {
      return await apiFetch(`/complaints/${id}`);
    } catch { return null; }
  }

  async function submitComplaint(data) {
    return apiFetch('/complaints', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async function updateComplaintStatus(complaintId, status, proofPhotoUrl) {
    return apiFetch(`/complaints/${complaintId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, proofPhotoUrl })
    });
  }

  // ── Rewards ────────────────────────────────────────────────────────
  async function getRewards(studentId) {
    const query = studentId ? `?studentId=${studentId}` : '';
    return apiFetch(`/rewards${query}`);
  }

  async function addReward(studentId, activity, points) {
    return apiFetch('/rewards', {
      method: 'POST',
      body: JSON.stringify({ studentId, activity, points })
    });
  }

  // ── Stats ──────────────────────────────────────────────────────────
  async function getStats() {
    return apiFetch('/admin/dashboard');
  }

  // ── Image Upload ───────────────────────────────────────────────────
  async function uploadImage(file, folder) {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);
    return apiFetch('/upload', {
      method: 'POST',
      body: formData
    });
  }

  return {
    login, register, logout, currentUser, requireAuth,
    getUsers, getUserById, getMe, createUser, deleteUser, updateUser, changePassword,
    getComplaints, getComplaintById, submitComplaint, updateComplaintStatus,
    getRewards, addReward,
    getStats, uploadImage
  };
})();
