// ============================================================
// admin.js - Admin Panel Logic
// Nishchay Academy
// ============================================================

import { supabase } from './supabase.js';

// Get all registered students
export async function getAllStudents() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Get all enrollments (with student and course details)
export async function getAllEnrollments() {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrolled_at,
      progress,
      users ( id, name, email ),
      courses ( id, title, subject )
    `)
    .order('enrolled_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Delete a student account and their data
export async function deleteStudent(id) {
  // Delete enrollments first (FK constraint)
  await supabase.from('enrollments').delete().eq('user_id', id);

  // Delete from users table
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  if (userError) throw userError;

  return true;
}

// Get aggregate stats for admin dashboard
export async function getDashboardStats() {
  const [studentsRes, coursesRes, enrollmentsRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('id', { count: 'exact', head: true })
  ]);

  return {
    totalStudents: studentsRes.count || 0,
    totalCourses: coursesRes.count || 0,
    totalEnrollments: enrollmentsRes.count || 0
  };
}

// Update user details (admin only)
export async function updateUser(id, userData) {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

