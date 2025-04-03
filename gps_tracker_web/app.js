import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase Client
const supabaseUrl = 'https://yrocmxeoqzstzsxwlrlj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyb2NteGVvcXpzdHpzeHdscmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTU4NTcsImV4cCI6MjA1OTA5MTg1N30.bHaLlzdnbFpWD52VASU4YNGc4YqDj8923689NIpKMcI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Global variables
let map;
let markers = [];
let path;
let updateInterval;


let latestMarker = null;
const redArrowIcon = L.icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
            <path fill="red" d="M12 0L24 24L12 18L0 24L12 0z"/>
        </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});


// Map Controller Class
class MapController {
    static initMap() {
        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }

    static checkRequiredElements() {
        const requiredElements = [
            'totalPoints',
            'lastUpdated',
            'currentLocationTime'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Missing required DOM elements:', missingElements);
            return false;
        }
        return true;
    }

    static updateMap(locations) {
        this.clearMap();

        if (locations.length === 0) return;

        const coordinates = locations.map(loc => [loc.latitude, loc.longitude]);

        // Add regular markers for historical points
        locations.slice(0, -1).forEach(loc => {
            const marker = L.marker([loc.latitude, loc.longitude])
                .bindPopup(`
                    Time: ${this.formatDateTime(loc.timestamp)}<br>
                    Accuracy: ${loc.accuracy ? loc.accuracy.toFixed(2) + 'm' : 'N/A'}
                `)
                .addTo(map);
            markers.push(marker);
        });

        // Add special marker for latest location
        if (locations.length > 0) {
            const latest = locations[locations.length - 1];
            latestMarker = L.marker([latest.latitude, latest.longitude], {
                icon: redArrowIcon
            }).bindPopup(`
                <strong>Current Location</strong><br>
                Time: ${this.formatDateTime(latest.timestamp)}<br>
                Accuracy: ${latest.accuracy ? latest.accuracy.toFixed(2) + 'm' : 'N/A'}
            `).addTo(map);
            markers.push(latestMarker);

            // Update current location timestamp in UI
            document.getElementById('currentLocationTime').textContent = 
                this.formatDateTime(latest.timestamp);
        }

        // Draw path
        path = L.polyline(coordinates, {color: 'blue'}).addTo(map);

        // Fit map to show all markers
        map.fitBounds(L.latLngBounds(coordinates));

        // Update stats
        document.getElementById('totalPoints').textContent = locations.length;
        document.getElementById('lastUpdated').textContent = this.formatDateTime(new Date());
    }

    static formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString()
            .replace('T', ' ')
            .slice(0, 19);
    }

    static clearMap() {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        if (path) map.removeLayer(path);
        if (latestMarker) map.removeLayer(latestMarker);
        latestMarker = null;
    }
}

// Location Controller Class
class LocationController {
    static async fetchLocations(isRefresh = false) {
        // Get the refresh button if it exists
        const refreshButton = document.getElementById('refreshButton');
        
        // If this is a refresh action, show loading state
        if (isRefresh && refreshButton) {
            refreshButton.classList.add('loading');
            refreshButton.disabled = true;
        }

        try {
            if (!MapController.checkRequiredElements()) {
                console.error('Required DOM elements missing. Cannot update UI.');
                return;
            }

            const startDate = document.getElementById('startDate')?.value;
            const endDate = document.getElementById('endDate')?.value;

            let query = supabase
                .from('locations')
                .select('*')
                .order('timestamp', { ascending: true });

            if (startDate) {
                query = query.gte('timestamp', startDate);
            }
            if (endDate) {
                query = query.lte('timestamp', endDate);
            }

            const { data, error } = await query;

            if (error) throw error;

            MapController.updateMap(data || []);
        } catch (error) {
            console.error('Error fetching locations:', error);
            alert('Error fetching locations. Please check console for details.');
        } finally {
            // Remove loading state if this was a refresh action
            if (isRefresh && refreshButton) {
                refreshButton.classList.remove('loading');
                refreshButton.disabled = false;
            }
        }
    }

    static setupAutoUpdate() {
        if (updateInterval) clearInterval(updateInterval);

        const autoUpdateCheckbox = document.getElementById('autoUpdate');
        if (autoUpdateCheckbox?.checked) {
            updateInterval = setInterval(() => {
                if (autoUpdateCheckbox.checked) {
                    this.fetchLocations();
                }
            }, 10000);
        }
    }
}

// Auth Controller Class
class AuthController {
    static async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('userInfo').style.display = 'flex';
            document.getElementById('userEmail').textContent = data.user.email;

            LocationController.fetchLocations();
            LocationController.setupAutoUpdate();
        } catch (error) {
            alert('Error logging in: ' + error.message);
        }
    }

    static async logout() {
        try {
            await supabase.auth.signOut();
            document.getElementById('loginForm').style.display = 'flex';
            document.getElementById('userInfo').style.display = 'none';
            MapController.clearMap();
            clearInterval(updateInterval);
        } catch (error) {
            alert('Error logging out: ' + error.message);
        }
    }
}

// Initialize application
function initializeApp() {
    MapController.initMap();
    
    // Set default date range (last 24 hours)
    const now = new Date();
    const yesterday = new Date(now - 24*60*60*1000);
    
    document.getElementById('startDate').value = yesterday.toISOString().slice(0, 16);
    document.getElementById('endDate').value = now.toISOString().slice(0, 16);
    
    // Add event listeners
    document.getElementById('loginButton')?.addEventListener('click', () => AuthController.login());
    document.getElementById('logoutButton')?.addEventListener('click', () => AuthController.logout());
    document.getElementById('filterButton')?.addEventListener('click', () => LocationController.fetchLocations());
    document.getElementById('autoUpdate')?.addEventListener('change', () => LocationController.setupAutoUpdate());
    document.getElementById('focusCurrentBtn')?.addEventListener('click', () => {
        if (latestMarker) {
            map.setView(latestMarker.getLatLng(), 15);
            latestMarker.openPopup();
        }
    });

    // Add refresh button listener
    document.getElementById('refreshButton')?.addEventListener('click', () => {
        LocationController.fetchLocations(true);
    });
    
    // Check if user is already logged in
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('userInfo').style.display = 'flex';
            document.getElementById('userEmail').textContent = session.user.email;
            LocationController.fetchLocations();
            LocationController.setupAutoUpdate();
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);