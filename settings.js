// ============================================================
// settings.js - Dynamic Site Configuration
// Nishchay Academy
// ============================================================

import { supabase } from './supabase.js';
import { sanitize } from './auth.js';

// Get Site Settings
export async function getSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();
    
  if (error && error.code !== 'PGRST116') {
     console.warn('Error fetching settings:', error);
  }
  return data || {
      logo_url: '',
      primary_color: '#0d6efd',
      whatsapp_number: '919876543210',
      contact_email: 'hello@nishchayacademy.com'
  };
}

// Update Site Settings (admin only)
export async function updateSiteSettings(settings) {
  const { data, error } = await supabase
    .from('site_settings')
    .update(settings)
    .eq('id', 1)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// Apply settings to DOM automatically
export async function applyGlobalSettings() {
    try {
        const settings = await getSiteSettings();
        
        // Apply Theme Color
        if (settings.primary_color) {
            document.documentElement.style.setProperty('--primary-color', sanitize(settings.primary_color));
        }
        
        // Apply WhatsApp Link
        const waBtns = document.querySelectorAll('.whatsapp-btn');
        waBtns.forEach(btn => {
            btn.href = `https://wa.me/${sanitize(settings.whatsapp_number)}`;
        });
        
        // Apply Contact Email
        const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
        emailLinks.forEach(link => {
            if(link.classList.contains('dynamic-email')) {
                link.href = `mailto:${sanitize(settings.contact_email)}`;
                link.innerText = sanitize(settings.contact_email);
            }
        });
        
        // Apply site logos globally
        if (settings.logo_url) {
            const logoContainers = document.querySelectorAll('.navbar-brand, .footer-title, .auth-logo');
            logoContainers.forEach(container => {
                // If it contains an icon, replace the icon with an image, keeping the text
                const icon = container.querySelector('i');
                if (icon) {
                    const img = document.createElement('img');
                    img.src = sanitize(settings.logo_url);
                    img.alt = "Nishchay Academy Logo";
                    img.style.height = container.classList.contains('auth-logo') ? '50px' : '30px';
                    img.style.marginRight = '10px';
                    icon.replaceWith(img);
                }
            });
        }
        
    } catch(e) {
        console.error("Failed to apply global settings", e);
    }
}
