// ============================================================
// admin.js — Nishchay Academy Admin Panel Logic
// ============================================================

import { supabase } from './supabase.js';

// ── UTILS ──────────────────────────────────────────────────
const toast = (msg, type = 'info') => {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `show ${type}`;
  setTimeout(() => el.className = '', 3500);
};

const $ = id => document.getElementById(id);

// ── AUTH GUARD ─────────────────────────────────────────────
async function initAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }

  $('auth-guard').style.display = 'none';
  $('admin-app').style.display = 'block';

  setupNav();
  setupLogout();
  loadStats();
  loadCourses();
  loadStudents();
  loadSettings();
}

// ── NAVIGATION ─────────────────────────────────────────────
function setupNav() {
  const links = document.querySelectorAll('.sidebar-link[data-page]');
  const pages = document.querySelectorAll('.page');

  function activate(pageName) {
    links.forEach(l => l.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    const targetLink = document.querySelector(`.sidebar-link[data-page="${pageName}"]`);
    const targetPage = $(`page-${pageName}`);
    if (targetLink) targetLink.classList.add('active');
    if (targetPage) targetPage.classList.add('active');
    // Close sidebar on mobile
    $('sidebar').classList.remove('open');
  }

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      activate(link.dataset.page);
    });
  });

  $('mobileToggle').addEventListener('click', () => $('sidebar').classList.toggle('open'));
}

// ── LOGOUT ─────────────────────────────────────────────────
function setupLogout() {
  $('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });
}

// ── STATS ──────────────────────────────────────────────────
async function loadStats() {
  const [courses, students, enrollments] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
  ]);
  $('statCourses').textContent = courses.count ?? '—';
  $('statStudents').textContent = students.count ?? '—';
  $('statEnrollments').textContent = enrollments.count ?? '—';
}

// ── COURSES TABLE ──────────────────────────────────────────
let allCourses = [];

async function loadCourses() {
  const tbody = $('coursesTableBody');
  const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
  if (error) { tbody.innerHTML = `<tr><td colspan="4" style="color:#ef4444; text-align:center; padding:2rem;">Error loading courses.</td></tr>`; return; }
  allCourses = data || [];
  renderCourses();
}

function renderCourses() {
  const tbody = $('coursesTableBody');
  if (!allCourses.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:2rem;">No courses yet. Add your first course!</td></tr>`;
    return;
  }
  tbody.innerHTML = allCourses.map(c => `
    <tr>
      <td style="font-weight:600;">${c.title}</td>
      <td><span class="badge badge-blue">${c.subject}</span></td>
      <td><span class="badge badge-gold">${c.price > 0 ? '₹' + c.price : 'Free'}</span></td>
      <td style="display:flex; gap:0.5rem;">
        <button class="btn btn-outline btn-sm" onclick="openEdit('${c.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCourse('${c.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

window.openEdit = (id) => {
  const c = allCourses.find(x => x.id === id);
  if (!c) return;
  $('editCourseId').value = c.id;
  $('editCourseTitle').value = c.title;
  $('editCourseCategory').value = c.subject;
  $('editCoursePrice').value = c.price;
  $('editCourseDesc').value = c.description || '';
  $('editModal').classList.add('active');
};

window.deleteCourse = async (id) => {
  if (!confirm('Delete this course permanently?')) return;
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) { toast('Failed to delete course.', 'error'); return; }
  allCourses = allCourses.filter(c => c.id !== id);
  renderCourses();
  $('statCourses').textContent = allCourses.length;
  toast('Course deleted.', 'success');
};

$('closeEditModal').addEventListener('click', () => $('editModal').classList.remove('active'));
$('editModal').addEventListener('click', (e) => { if (e.target === $('editModal')) $('editModal').classList.remove('active'); });

$('editCourseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('editCourseId').value;
  const updates = {
    title: $('editCourseTitle').value,
    subject: $('editCourseCategory').value,
    price: parseFloat($('editCoursePrice').value),
    description: $('editCourseDesc').value,
  };
  const { error } = await supabase.from('courses').update(updates).eq('id', id);
  if (error) { toast('Update failed.', 'error'); return; }
  const idx = allCourses.findIndex(c => c.id === id);
  if (idx > -1) allCourses[idx] = { ...allCourses[idx], ...updates };
  renderCourses();
  $('editModal').classList.remove('active');
  toast('Course updated successfully!', 'success');
});

// ── ADD COURSE ────────────────────────────────────────────
let courseImageUrl = '';

$('courseImageInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $('imgUploadText').textContent = 'Uploading...';
  const ext = file.name.split('.').pop();
  const path = `courses/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('public').upload(path, file, { upsert: true });
  if (error) { toast('Image upload failed.', 'error'); return; }
  const { data: urlData } = supabase.storage.from('public').getPublicUrl(path);
  courseImageUrl = urlData.publicUrl;
  $('imgUploadText').textContent = `✓ ${file.name}`;
  toast('Image uploaded!', 'success');
});

$('cancelAddBtn').addEventListener('click', () => {
  document.querySelector('.sidebar-link[data-page="courses"]').click();
});

$('addCourseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('publishBtn');
  btn.textContent = 'Publishing...';
  btn.disabled = true;

  const newCourse = {
    title: $('addCourseTitle').value,
    subject: $('addCourseCategory').value,
    price: parseFloat($('addCoursePrice').value) || 0,
    description: $('addCourseDesc').value,
    image_url: courseImageUrl || '',
  };

  const { data, error } = await supabase.from('courses').insert(newCourse).select().single();
  btn.textContent = 'Publish Course';
  btn.disabled = false;

  if (error) { toast('Failed to publish: ' + error.message, 'error'); return; }
  allCourses.unshift(data);
  $('statCourses').textContent = allCourses.length;
  $('addCourseForm').reset();
  courseImageUrl = '';
  $('imgUploadText').textContent = 'Click or drag & drop image here';
  toast('Course published!', 'success');
  document.querySelector('.sidebar-link[data-page="courses"]').click();
});

// ── STUDENTS ──────────────────────────────────────────────
async function loadStudents() {
  const tbody = $('studentsTableBody');
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error || !data) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--muted);">No students yet.</td></tr>`; return; }
  tbody.innerHTML = data.map(s => `
    <tr>
      <td style="font-weight:600;">${s.name || '—'}</td>
      <td style="color:var(--muted); font-size:0.85rem;">${s.email}</td>
      <td><span class="badge ${s.role === 'admin' ? 'badge-gold' : 'badge-blue'}">${s.role}</span></td>
      <td style="color:var(--muted); font-size:0.82rem;">${new Date(s.created_at).toLocaleDateString('en-IN')}</td>
    </tr>
  `).join('');
}

// ── SETTINGS ─────────────────────────────────────────────
let settings = {};

async function loadSettings() {
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
  if (!data) return;
  settings = data;

  // Branding
  $('sitePrimaryColor').value = data.primary_color || '#C9A84C';
  updateColorPreview(data.primary_color || '#C9A84C');

  if (data.logo_url) {
    $('currentLogoWrap').style.display = 'block';
    $('currentLogoImg').src = data.logo_url;
    $('logoUploadText').textContent = '✓ Logo uploaded. Click to change.';
  }

  // Homepage
  $('siteHeroTitle').value = data.hero_title || '';
  $('siteHeroSubtitle').value = data.hero_subtitle || '';
  $('siteAboutHeading').value = data.about_heading || '';
  $('siteAboutContent').value = data.about_content || '';
  $('siteFooterText').value = data.footer_text || '';

  // Contact
  $('siteWhatsapp').value = data.whatsapp_number || '';
  $('siteContactEmail').value = data.contact_email || '';

  // Update preview
  if (data.hero_title) $('previewHeroText').textContent = data.hero_title.substring(0, 20) + '...';
}

// Color preview
function updateColorPreview(color) {
  $('colorSwatch').style.background = color;
  $('colorHexLabel').textContent = color;
  $('previewBrandBtn').style.background = color;
  document.documentElement.style.setProperty('--gold', color);
}

$('sitePrimaryColor').addEventListener('input', (e) => updateColorPreview(e.target.value));

// Logo upload
let newLogoUrl = '';
$('siteLogoInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $('logoUploadText').textContent = 'Uploading...';
  const ext = file.name.split('.').pop();
  const path = `logos/logo_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('public').upload(path, file, { upsert: true });
  if (error) { toast('Logo upload failed.', 'error'); return; }
  const { data: urlData } = supabase.storage.from('public').getPublicUrl(path);
  newLogoUrl = urlData.publicUrl;
  $('logoUploadText').textContent = `✓ ${file.name} uploaded!`;
  $('currentLogoWrap').style.display = 'block';
  $('currentLogoImg').src = newLogoUrl;
  toast('Logo uploaded!', 'success');
});

// Save branding
$('saveBrandingBtn').addEventListener('click', async () => {
  const updates = { primary_color: $('sitePrimaryColor').value };
  if (newLogoUrl) updates.logo_url = newLogoUrl;
  const { error } = await supabase.from('site_settings').update(updates).eq('id', 1);
  if (error) { toast('Save failed.', 'error'); return; }
  toast('Branding saved! Changes are now live.', 'success');
});

// Save homepage
$('saveHomepageBtn').addEventListener('click', async () => {
  const updates = {
    hero_title: $('siteHeroTitle').value,
    hero_subtitle: $('siteHeroSubtitle').value,
    about_heading: $('siteAboutHeading').value,
    about_content: $('siteAboutContent').value,
    footer_text: $('siteFooterText').value,
  };
  const { error } = await supabase.from('site_settings').update(updates).eq('id', 1);
  if (error) { toast('Save failed.', 'error'); return; }
  toast('Homepage content saved!', 'success');
});

// Save contact
$('saveContactBtn').addEventListener('click', async () => {
  const updates = {
    whatsapp_number: $('siteWhatsapp').value,
    contact_email: $('siteContactEmail').value,
  };
  const { error } = await supabase.from('site_settings').update(updates).eq('id', 1);
  if (error) { toast('Save failed.', 'error'); return; }
  toast('Contact info saved!', 'success');
});

// INIT
initAdmin();
