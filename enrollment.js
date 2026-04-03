// ============================================================
// enrollment.js - Enrollment & Progress Logic
// Nishchay Academy
// ============================================================

import { supabase } from './supabase.js';

// Enroll student into a course
export async function enrollStudent(userId, courseId) {
  // Prevent duplicate enrollment
  const already = await checkEnrollment(userId, courseId);
  if (already) throw new Error('Already enrolled in this course.');

  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      progress: 0
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get enrolled courses for a specific student
export async function getEnrolledCourses(userId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrolled_at,
      progress,
      courses (
        id, title, subject, description, price, image_url
      )
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Check if student is already enrolled in a course
export async function checkEnrollment(userId, courseId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

// Update student progress for a course (0-100)
export async function updateProgress(userId, courseId, progress) {
  const { data, error } = await supabase
    .from('enrollments')
    .update({ progress })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
