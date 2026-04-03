// ============================================================
// auth.js - Authentication Logic (FIXED)
// Nishchay Academy
// ============================================================

import { supabase } from './supabase.js';

// Utility: sanitize text to prevent XSS (Bug #8, #9)
export function sanitize(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Sign Up new user (Bug #3 fix: check insert error)
export async function signUp(name, email, password) {
  // Bug #14 fix: validate password length before calling Supabase
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!name || name.trim().length === 0) {
    throw new Error('Please enter your full name.');
  }
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });
  if (error) throw error;

  // Bug #3 fix: Check for insert error and throw if it fails
  if (data.user) {
    // AUTOMATION: Check if this is the first user ever using RPC (bypasses RLS limits)
    const { data: count, error: countError } = await supabase.rpc('get_user_count');
    
    // Default to student, but if it's the first user (count 0), make them admin
    const role = (count === 0 && !countError) ? 'admin' : 'student';

    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      name: name.trim(),
      email,
      role: role
    });
    if (insertError) {
      console.error('Failed to create user profile:', insertError);
      throw new Error('Account created but profile setup failed. Please contact support.');
    }
  }
  return data;
}

// Login existing user
export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Logout (Bug #5, #6 fix: this function must be called from logout buttons)
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
    return null;
  }
  return session;
}

// Bug #15 fix: Redirect to dashboard if already logged in (for login page)
export async function redirectIfLoggedIn() {
  const session = await getSession();
  if (session) {
    window.location.href = 'dashboard.html';
  }
}

// Redirect if not admin
export async function redirectIfNotAdmin() {
  const session = await redirectIfNotLoggedIn();
  if (!session) return null;

  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error || !user || user.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return null;
  }
  return session;
}
