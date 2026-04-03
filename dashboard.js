// ============================================================
// dashboard.js - Student Dashboard Logic
// Nishchay Academy
// ============================================================

import { supabase } from './supabase.js';
import { redirectIfNotLoggedIn } from './auth.js';
import { getEnrolledCourses } from './enrollment.js';

// Load student dashboard (call this on dashboard.html page)
export async function loadStudentDashboard() {
  const session = await redirectIfNotLoggedIn();
  const userId = session.user.id;

  // Load user profile
  const { data: profile } = await supabase
    .from('users')
    .select('name, email, role')
    .eq('id', userId)
    .single();

  // Update name in UI
  if (profile) {
    const el = document.getElementById('dashboardUserName');
    if (el) el.innerText = profile.name || 'Student';

    const avatarEl = document.getElementById('dashboardAvatar');
    if (avatarEl) avatarEl.innerText = (profile.name || 'S').charAt(0).toUpperCase();
  }

  await showEnrolledCourses(userId);
  await showProgress(userId);
}

// Render enrolled courses list in dashboard
export async function showEnrolledCourses(userId) {
  const enrollments = await getEnrolledCourses(userId);
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
    const progress = e.progress || 0;
    return `
      <div class="course-progress-card">
        <div class="course-header">
          <h4>${course.title}</h4>
          <span class="course-badge" style="margin: 0; background: ${progress >= 100 ? '#28a745' : '#ffc107'}; color: ${progress >= 100 ? '#fff' : '#000'};">
            ${progress >= 100 ? 'Completed' : 'In Progress'}
          </span>
        </div>
        <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 15px;">Subject: ${course.subject}</p>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${progress}%;"></div>
        </div>
        <div class="progress-text">${progress}% Completed</div>
        <button class="btn btn-primary" style="width: 100%; margin-top: 15px; padding: 8px;" onclick="resumeCourse('${course.id}')">Resume Course</button>
      </div>`;
  }).join('');
}

// Display progress stats at top of dashboard
export async function showProgress(userId) {
  const enrollments = await getEnrolledCourses(userId);

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

// Placeholder: resume course
function resumeCourse(courseId) {
  console.log('Resuming course:', courseId);
  // Future: navigate to course player page
}
