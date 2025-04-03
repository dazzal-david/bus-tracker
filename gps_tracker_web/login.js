import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
    'https://yrocmxeoqzstzsxwlrlj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyb2NteGVvcXpzdHpzeHdscmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTU4NTcsImV4cCI6MjA1OTA5MTg1N30.bHaLlzdnbFpWD52VASU4YNGc4YqDj8923689NIpKMcI'
);

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Store admin session
        localStorage.setItem('adminEmail', data.user.email);
        
        // Redirect to users page
        window.location.href = 'users.html';
    } catch (error) {
        alert('Error logging in: ' + error.message);
    }
});

// Check if already logged in
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        window.location.href = 'users.html';
    }
});