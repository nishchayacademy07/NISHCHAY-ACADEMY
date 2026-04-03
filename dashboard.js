// ============================================================
// dashboard.js - Student Dashboard Logic (FIXED)
// Nishchay Academy
// ============================================================

import { supabase } from './supabase.js';
import { redirectIfNotLoggedIn, logout, sanitize } from './auth.js';
import { getEnrolledCourses } from './enrollment.js';

// Load student dashboard (call this on dashboard.html page)
export async function loadStudentDashboard() {
  const session = await redirectIfNotLoggedIn();
  if (!session) return;
  const userId = session.user.id;

  // Load user profile
  const { data: profile } = await supabase
    .from('users')
    .select('name, email, role')
    .eq('id', userId)
    .single();

  // Bug #12 fix: Update welcome message with real name
  if (profile) {
    const safeName = sanitize(profile.name || 'Student');

    const el = document.getElementById('dashboardUserName');
    if (el) el.innerText = safeName;

    const avatarEl = document.getElementById('dashboardAvatar');
    if (avatarEl) avatarEl.innerText = (profile.name || 'S').charAt(0).toUpperCase();

    // Bug #12: Update the welcome header
    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl) welcomeEl.innerText = `Welcome back, ${safeName}! 👋`;

    // Bug #12 fix: Populate profile form with real data
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    if (profileName) profileName.value = profile.name || '';
    if (profileEmail) profileEmail.value = profile.email || '';

    // Final Refinement: Show Admin Link if user is an admin
    if (profile.role === 'admin') {
        const adminLink = document.getElementById('adminPanelLink');
        if (adminLink) adminLink.style.display = 'flex';
    }
  }

  // Bug #13 fix: fetch enrolled courses once and reuse
  let enrollments = [];
  try {
    enrollments = await getEnrolledCourses(userId);
  } catch (err) {
    console.error('Failed to load enrollments:', err);
  }

  showEnrolledCourses(enrollments);
  showProgress(enrollments);
}

// Render enrolled courses list in dashboard
function showEnrolledCourses(enrollments) {
  const container = document.getElementById('enrolledCoursesContainer');
  if (!container) return;

  if (!enrollments || enrollments.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-light);">
        <i class="fa-solid fa-book-open" style="font-size: 3rem; margin-bottom: 15px; display:block;"></i>
        <p>You have not enrolled in any courses yet.</p>
        <a href="courses.html" class="btn btn-primary" style="margin-top: 10px;">Browse Courses</a>
      </div>`;
    return;
  }

  container.innerHTML = enrollments.map(e => {
    const course = e.courses;
    if (!course) return '';
    const progress = e.progress || 0;
    // Bug #8 fix: sanitize all user/db data before rendering
    const safeTitle = sanitize(course.title);
    const safeSubject = sanitize(course.subject);
    return `
      <div class="course-progress-card">
        <div class="course-header">
          <h4>${safeTitle}</h4>
          <span class="course-badge" style="margin: 0; background: ${progress >= 100 ? '#28a745' : '#ffc107'}; color: ${progress >= 100 ? '#fff' : '#000'};">
            ${progress >= 100 ? 'Completed' : 'In Progress'}
          </span>
        </div>
        <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 15px;">Subject: ${safeSubject}</p>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${Math.min(progress, 100)}%;"></div>
        </div>
        <div class="progress-text">${progress}% Completed</div>
      </div>`;
  }).join('');
}

// Display progress stats at top of dashboard — Bug #13 fix: accept data instead of re-fetching
function showProgress(enrollments) {
  const totalEnrolled = enrollments ? enrollments.length : 0;
  const completed = enrollments ? enrollments.filter(e => e.progress >= 100).length : 0;
  const totalHours = totalEnrolled * 8; // Estimated hours

  const enrolledEl = document.getElementById('statEnrolled');
  const completedEl = document.getElementById('statCompleted');
  const hoursEl = document.getElementById('statHours');

  if (enrolledEl) enrolledEl.innerText = totalEnrolled;
  if (completedEl) completedEl.innerText = completed;
  if (hoursEl) hoursEl.innerText = totalHours + 'h';
}

// Bug #4 fix: Export logout for use in dashboard HTML
export { logout };
