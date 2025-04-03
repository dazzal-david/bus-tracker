import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
    'https://yrocmxeoqzstzsxwlrlj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyb2NteGVvcXpzdHpzeHdscmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTU4NTcsImV4cCI6MjA1OTA5MTg1N30.bHaLlzdnbFpWD52VASU4YNGc4YqDj8923689NIpKMcI'
);

let selectedUsers = new Set();

async function loadUsers() {
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';

        profiles.forEach(profile => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <div class="user-info">
                    <img src="${profile.avatar_url || 'default-avatar.png'}" alt="Avatar" class="user-avatar">
                    <div class="user-details">
                        <h3>${profile.display_name || profile.username}</h3>
                        <p>${profile.email}</p>
                    </div>
                </div>
                <label class="track-checkbox">
                    <input type="checkbox" data-user-id="${profile.id}">
                    Track
                </label>
            `;
            usersList.appendChild(userCard);
        });

        // Add checkbox listeners
        document.querySelectorAll('.track-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const userId = e.target.dataset.userId;
                if (e.target.checked) {
                    selectedUsers.add(userId);
                } else {
                    selectedUsers.delete(userId);
                }
                updateTrackButton();
            });
        });
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Error loading users. Please try again.');
    }
}

function updateTrackButton() {
    const trackBtn = document.getElementById('trackSelectedBtn');
    trackBtn.disabled = selectedUsers.size === 0;
}

document.getElementById('trackSelectedBtn').addEventListener('click', () => {
    if (selectedUsers.size > 0) {
        const userIds = Array.from(selectedUsers);
        localStorage.setItem('trackedUsers', JSON.stringify(userIds));
        window.location.href = 'tracking.html';
    }
});

document.getElementById('refreshUsersBtn').addEventListener('click', loadUsers);

document.getElementById('logoutButton').addEventListener('click', async () => {
    try {
        await supabase.auth.signOut();
        localStorage.removeItem('adminEmail');
        window.location.href = 'login.html';
    } catch (error) {
        alert('Error logging out: ' + error.message);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const adminEmail = localStorage.getItem('adminEmail');
    if (!adminEmail) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('adminEmail').textContent = adminEmail;
    loadUsers();
});