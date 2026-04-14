/**
 * APP.JS — Shared application logic
 * Theme toggle, toasts, auth guard, nav, utilities
 */

// ── Theme Toggle ───────────────────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('wms_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('wms_theme', next);
    });
  });
})();

// ── Toast Notifications ────────────────────────────────────────────────
const Toast = (() => {
  let container;
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(msg, type = 'success', duration = 3500) {
    const c = getContainer();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    el.innerHTML = `<span>${icons[type] || '✅'}</span><span>${msg}</span>`;
    c.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'slideOut .3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  return { show };
})();

// ── Navigation (sidebar tab switching) ────────────────────────────────
function initNav() {
  const items = document.querySelectorAll('.nav-item[data-section]');
  const sections = document.querySelectorAll('.page-section');
  const topbarTitle = document.getElementById('topbar-title');

  function activate(sectionId) {
    sections.forEach(s => s.classList.toggle('active', s.id === sectionId));
    items.forEach(i => i.classList.toggle('active', i.dataset.section === sectionId));
    if (topbarTitle) {
      const activeItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
      topbarTitle.textContent = activeItem ? activeItem.dataset.label || '' : '';
    }
  }

  items.forEach(item => {
    item.addEventListener('click', () => {
      activate(item.dataset.section);
      // Close sidebar on mobile after nav click
      closeSidebar();
    });
  });

  // Activate first section by default
  if (items.length) {
    const first = items[0].dataset.section;
    activate(first);
  }

  // Initialize mobile sidebar toggle
  initSidebarToggle();
}

// ── Mobile Sidebar Toggle (Hamburger) ─────────────────────────────────
function initSidebarToggle() {
  const topbar = document.querySelector('.topbar');
  const sidebar = document.querySelector('.sidebar');
  if (!topbar || !sidebar) return;

  // Create hamburger button
  const hamburger = document.createElement('button');
  hamburger.className = 'sidebar-toggle';
  hamburger.setAttribute('aria-label', 'Toggle navigation');
  hamburger.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
  topbar.insertBefore(hamburger, topbar.firstChild);

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  document.body.appendChild(backdrop);

  hamburger.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    backdrop.classList.toggle('show', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  backdrop.addEventListener('click', closeSidebar);
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const hamburger = document.querySelector('.sidebar-toggle');
  const backdrop = document.querySelector('.sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (hamburger) hamburger.classList.remove('active');
  if (backdrop) backdrop.classList.remove('show');
  document.body.style.overflow = '';
}

// ── Image Preview Helper ───────────────────────────────────────────────
function initImageUpload(areaId, inputId, previewId) {
  const area = document.getElementById(areaId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!area || !input) return;

  function showPreview(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      if (preview) { preview.src = e.target.result; preview.classList.add('show'); }
    };
    reader.readAsDataURL(file);
  }

  input.addEventListener('change', () => showPreview(input.files[0]));
  area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (file) { input.files = e.dataTransfer.files; showPreview(file); }
  });
}

// ── Read image as data URL (for local preview only) ───────────────────
function readImageFile(input, callback) {
  const file = input.files[0];
  if (!file) { callback(null); return; }
  const reader = new FileReader();
  reader.onload = e => callback(e.target.result);
  reader.readAsDataURL(file);
}

// ── Get raw File from input ────────────────────────────────────────────
function getImageFile(input) {
  return input.files[0] || null;
}

// ── Upload image to Cloudinary via backend ─────────────────────────────
async function uploadImageFile(input, folder) {
  const file = getImageFile(input);
  if (!file) return null;
  try {
    const result = await WMS.uploadImage(file, folder);
    return result.url;
  } catch (err) {
    console.error('Image upload failed:', err);
    Toast.show('Image upload failed. Please try again.', 'error');
    return null;
  }
}

// ── Date formatter ─────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Status badge HTML ──────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    'pending': ['badge-pending', 'dot-pending', '⏳ Pending'],
    'in-progress': ['badge-progress', 'dot-progress', '🔄 In Progress'],
    'completed': ['badge-done', 'dot-done', '✅ Completed']
  };
  const [cls, dot, label] = map[status] || ['badge-pending', 'dot-pending', status];
  return `<span class="badge ${cls}"><span class="status-dot ${dot}"></span>${label}</span>`;
}

// ── Sidebar user footer ────────────────────────────────────────────────
function renderSidebarUser(user) {
  const el = document.getElementById('sidebar-user');
  if (!el || !user) return;
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  el.innerHTML = `
    <div class="sidebar-user">
      ${user.avatar
      ? `<img class="sidebar-avatar" src="${user.avatar}" alt="${user.name}">`
      : `<div class="sidebar-avatar">${initials}</div>`}
      <div>
        <div class="sidebar-username">${user.name}</div>
        <div class="sidebar-role">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
      </div>
    </div>
    <button class="btn btn-ghost btn-sm btn-full mt-1" onclick="WMS.logout()">🚪 Sign Out</button>
  `;
}

// ── Profile avatar uploader ────────────────────────────────────────────
function initAvatarUpload(inputId, userId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    readImageFile(input, dataUrl => {
      WMS.updateUser(userId, { avatar: dataUrl });
      document.querySelectorAll('.profile-avatar-img, .sidebar-avatar').forEach(el => {
        if (el.tagName === 'IMG') el.src = dataUrl;
      });
      Toast.show('Profile picture updated!');
    });
  });
}

// ── Modal helpers ──────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});
