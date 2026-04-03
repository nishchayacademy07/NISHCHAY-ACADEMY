// ============================================================
// courses.js - Course Management Logic (FIXED)
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
  return data || [];
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

// Add new course (admin only) — Bug #21 fix: parse price to number
export async function addCourse(courseData) {
  const cleaned = {
    title: (courseData.title || '').trim(),
    subject: (courseData.subject || '').trim(),
    description: (courseData.description || '').trim(),
    price: parseFloat(courseData.price) || 0,
    image_url: courseData.image_url || ''
  };
  if (!cleaned.title) throw new Error('Course title is required.');
  if (!cleaned.subject) throw new Error('Course category is required.');

  const { data, error } = await supabase
    .from('courses')
    .insert(cleaned)
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

// Bug #2 fix: filterBySubject now uses case-insensitive matching
// Filter values from buttons use exact DB values now (matched in HTML)
export async function filterBySubject(subject) {
  if (!subject || subject === 'all') return getAllCourses();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .ilike('subject', subject)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
