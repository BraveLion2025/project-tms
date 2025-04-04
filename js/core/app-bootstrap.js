/**
 * App Bootstrap Script
 * Initializes the application and components with async storage support
 */

// Wait for DOM content loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Project-TMS...');

    try {
        // First initialize storage
        if (window.StorageManager) {
            await StorageManager.initialize();
            console.log('Storage initialized');
        } else {
            console.error('StorageManager not found');
        }

        // Initialize UI components
        if (window.NotificationManager) {
            console.log('Notifications ready');
        }

        // Initialize theme
        if (window.themeSwitcher) {
            console.log('Theme system ready');
        }

        // Create managers based on page type
        const path = window.location.pathname;
        
        if (path.includes('analytics')) {
            // Analytics page
            if (window.analyticsManager) {
                console.log('Analytics manager ready');
            }
        } else if (path.includes('settings')) {
            // Settings page
            if (window.settingsManager) {
                console.log('Settings manager ready');
            }
        } else {
            // Dashboard page (default)
            if (window.projectManager) {
                console.log('Project manager ready');
            }
            
            if (window.taskManager) {
                console.log('Task manager ready');
            }
            
            if (window.timeTracker) {
                console.log('Time tracker ready');
            }
        }

        console.log('Project-TMS initialized successfully');
        
        // Show welcome message for first-time users
        const isFirstVisit = localStorage.getItem('hasVisitedBefore') !== 'true';
        if (isFirstVisit) {
            localStorage.setItem('hasVisitedBefore', 'true');
            setTimeout(() => {
                alert('Welcome to Project-TMS! Get started by creating your first project.');
            }, 1000);
        }
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('There was a problem initializing the application. Please check the console for details.');
    }
});