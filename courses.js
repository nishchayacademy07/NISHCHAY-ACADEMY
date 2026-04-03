// ============================================================
// courses.js - Course Management Logic
// Nishchay Academy
// ============================================================

import { supabase } from './supabase.js';

// Get all courses
export async function getAllCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Get single course by ID
export async function getCourseById(id) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// Add new course (admin only)
export async function addCourse(courseData) {
  const { data, error } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Edit existing course (admin only)
export async function editCourse(id, courseData) {
  const { data, error } = await supabase
    .from('courses')
    .update(courseData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete course (admin only)
export async function deleteCourse(id) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// Filter courses by subject
export async function filterBySubject(subject) {
  if (!subject || subject === 'all') return getAllCourses();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('subject', subject)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
