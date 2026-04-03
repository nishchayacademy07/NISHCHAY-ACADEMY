// ============================================================
// auth.js - Authentication Logic
// Nishchay Academy
// ============================================================

import { supabase } from './supabase.js';

// Sign Up new user
export async function signUp(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });
  if (error) throw error;

  // Insert into users table
  if (data.user) {
    await supabase.from('users').insert({
      id: data.user.id,
      name,
      email,
      role: 'student'
    });
  }
  return data;
}

// Login existing user
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = 'login.html';
}

// Get current session
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Listen to auth state changes
export function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

// Redirect to login if not authenticated
export async function redirectIfNotLoggedIn() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
  }
  return session;
}

// Redirect if not admin
export async function redirectIfNotAdmin() {
  const session = await redirectIfNotLoggedIn();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!user || user.role !== 'admin') {
    window.location.href = 'dashboard.html';
  }
  return session;
}
