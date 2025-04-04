/**
 * Main Application Controller for Project-TMS
 * Initializes and coordinates all components
 */
class AppController {
    constructor() {
        this.componentRegistry = {};
        this.isInitialized = false;
        this.pageType = this._detectPageType();
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // Initialize the storage system first
            if (window.StorageManager) {
                StorageManager.initialize();
            }
            
            // Initialize components based on page type
            await this._initializePageComponents();
            
            // Set up global event handlers
            this._setupGlobalEvents();
            
            // Register keyboard shortcuts
            this._setupKeyboardShortcuts();
            
            // Signal completion
            if (window.EventBus) {
                EventBus.emit('app:initialized', { pageType: this.pageType });
            }
            
            // Show welcome message for first-time users
            this._showWelcomeMessage();
            
            this.isInitialized = true;
            console.info('Project-TMS initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            
            // Show error notification
            if (window.NotificationManager) {
                NotificationManager.error(
                    'There was a problem initializing the application. Please refresh the page.',
                    'Initialization Error'
                );
            }
        }
    }

    /**
     * Detect the current page type
     * @private
     * @returns {string} Page type ('dashboard', 'analytics', 'settings', etc.)
     */
    _detectPageType() {
        const path = window.location.pathname;
        
        if (path.includes('analytics')) {
            return 'analytics';
        } else if (path.includes('settings')) {
            return 'settings';
        } else {
            return 'dashboard'; // Default is dashboard
        }
    }

    /**
     * Initialize components for the current page
     * @private
     */
    async _initializePageComponents() {
        // Register global components (shared across all pages)
        this.registerComponent('themeManager', window.themeManager);
        this.registerComponent('notificationManager', window.NotificationManager);
        
        // Initialize page-specific components
        switch (this.pageType) {
            case 'dashboard':
                this._initializeDashboard();
                break;
            case 'analytics':
                this._initializeAnalytics();
                break;
            case 'settings':
                this._initializeSettings();
                break;
        }
    }

    /**
     * Initialize dashboard page components
     * @private
     */
    _initializeDashboard() {
        // Register core managers
        this.registerComponent('projectManager', window.projectManager);
        this.registerComponent('taskManager', window.taskManager);
        
        // Set up modals
        this._setupModals();
    }

    /**
     * Initialize analytics page components
     * @private
     */
    _initializeAnalytics() {
        // Initialize analytics charts when DOM is ready
        this._loadAnalyticsData();
    }

    /**
     * Initialize settings page components
     * @private
     */
    _initializeSettings() {
        // Initialize settings page components
        this._loadUserSettings();
    }

    /**
     * Set up global event handlers
     * @private
     */
    _setupGlobalEvents() {
        // Handle storage quota exceeded
        if (window.EventBus) {
            EventBus.subscribe('storage:quotaExceeded', () => {
                // Show storage management dialog
                this._showStorageManagementDialog();
            });
        }
        
        // Handle browser online/offline status
        window.addEventListener('online', () => {
            if (window.NotificationManager) {
                NotificationManager.success('You are back online');
            }
        });
        
        window.addEventListener('offline', () => {
            if (window.NotificationManager) {
                NotificationManager.warning('You are offline. Changes will be saved locally.');
            }
        });
    }

    /**
     * Set up keyboard shortcuts
     * @private
     */
    _setupKeyboardShortcuts() {
        document.addEventListener('keydown', e => {
            // ESC key to close active modals
            if (e.key === 'Escape') {
                const activeModals = document.querySelectorAll('.modal-container.active');
                if (activeModals.length > 0) {
                    activeModals.forEach(modal => {
                        modal.classList.remove('active');
                    });
                    e.preventDefault();
                }
            }
            
            // Dashboard shortcuts
            if (this.pageType === 'dashboard') {
                // Ctrl+N to create a new project
                if (e.ctrlKey && e.key === 'n') {
                    e.preventDefault();
                    const projectManager = this.getComponent('projectManager');
                    if (projectManager) {
                        projectManager.openProjectModal();
                    }
                }
                
                // Ctrl+T to create a new task
                if (e.ctrlKey && e.key === 't') {
                    e.preventDefault();
                    const taskManager = this.getComponent('taskManager');
                    if (taskManager && taskManager.currentProjectId) {
                        taskManager.openTaskModal();
                    } else {
                        if (window.NotificationManager) {
                            NotificationManager.warning('Please select a project first');
                        }
                    }
                }
            }
        });
    }

    /**
     * Set up modal functionality
     * @private
     */
    _setupModals() {
        // Find all modals
        const modals = document.querySelectorAll('.modal-container');
        
        // Close modals when clicking outside content
        modals.forEach(modal => {
            modal.addEventListener('click', e => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    /**
     * Register a component
     * @param {string} name - Component name
     * @param {Object} component - Component instance
     */
    registerComponent(name, component) {
        if (!component) return false;
        
        this.componentRegistry[name] = component;
        return true;
    }

    /**
     * Get a registered component
     * @param {string} name - Component name
     * @returns {Object|null} Component instance or null if not found
     */
    getComponent(name) {
        return this.componentRegistry[name] || null;
    }

    /**
     * Load analytics data
     * @private
     */
    _loadAnalyticsData() {
        if (this.pageType !== 'analytics' || !window.StorageManager) return;
        
        // Get data from storage
        const projects = StorageManager.getProjects();
        const tasks = StorageManager.getTasks();
        
        // Update analytics overview
        this._updateAnalyticsOverview(projects, tasks);
        
        // Initialize charts
        this._initializeCharts(projects, tasks);
    }

    /**
     * Update analytics overview metrics
     * @private
     * @param {Array} projects - Projects data
     * @param {Array} tasks - Tasks data
     */
    _updateAnalyticsOverview(projects, tasks) {
        // Update total projects
        const totalProjectsEl = document.getElementById('totalProjects');
        if (totalProjectsEl) {
            totalProjectsEl.textContent = projects.length;
        }
        
        // Update active tasks
        const activeTasksEl = document.getElementById('activeTasks');
        if (activeTasksEl) {
            const activeTasks = tasks.filter(t => t.status !== 'done').length;
            activeTasksEl.textContent = activeTasks;
        }
        
        // Update completion rate
        const completionRateEl = document.getElementById('completionRate');
        if (completionRateEl) {
            const completedTasks = tasks.filter(t => t.status === 'done').length;
            const completionRate = tasks.length > 0 ? 
                Math.round((completedTasks / tasks.length) * 100) : 0;
            
            completionRateEl.textContent = `${completionRate}%`;
        }
    }

    /**
     * Initialize analytics charts
     * @private
     * @param {Array} projects - Projects data
     * @param {Array} tasks - Tasks data
     */
    _initializeCharts(projects, tasks) {
        // Project Progress Chart
        const progressCtx = document.getElementById('projectProgressChart')?.getContext('2d');
        if (progressCtx && window.Chart) {
            // Format data for chart
            const projectsWithCompletion = projects.map(project => {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const completedTasks = projectTasks.filter(t => t.status === 'done').length;
                const completionRate = projectTasks.length > 0 ? 
                    (completedTasks / projectTasks.length) * 100 : 0;
                
                return {
                    name: project.name,
                    completion: Math.round(completionRate)
                };
            });
            
            // Sort by completion rate (highest first)
            projectsWithCompletion.sort((a, b) => b.completion - a.completion);
            
            // Limit to top 10 projects
            const topProjects = projectsWithCompletion.slice(0, 10);
            
            // Create chart
            new Chart(progressCtx, {
                type: 'bar',
                data: {
                    labels: topProjects.map(p => p.name),
                    datasets: [{
                        label: 'Completion %',
                        data: topProjects.map(p => p.completion),
                        backgroundColor: 'rgba(99, 102, 241, 0.7)',
                        borderColor: 'rgb(99, 102, 241)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Completion Percentage'
                            }
                        }
                    }
                }
            });
        }
        
        // Task Distribution Chart
        const distributionCtx = document.getElementById('taskDistributionChart')?.getContext('2d');
        if (distributionCtx && window.Chart) {
            // Count tasks by status
            const taskCounts = {
                todo: tasks.filter(t => t.status === 'todo').length,
                inProgress: tasks.filter(t => t.status === 'in-progress').length,
                review: tasks.filter(t => t.status === 'review').length,
                done: tasks.filter(t => t.status === 'done').length
            };
            
            // Create chart
            new Chart(distributionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['To Do', 'In Progress', 'Review', 'Done'],
                    datasets: [{
                        data: [
                            taskCounts.todo, 
                            taskCounts.inProgress, 
                            taskCounts.review, 
                            taskCounts.done
                        ],
                        backgroundColor: [
                            'rgba(107, 114, 128, 0.7)',
                            'rgba(147, 51, 234, 0.7)',
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(16, 185, 129, 0.7)'
                        ],
                        borderColor: [
                            'rgb(107, 114, 128)',
                            'rgb(147, 51, 234)',
                            'rgb(59, 130, 246)',
                            'rgb(16, 185, 129)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    /**
     * Load user settings
     * @private
     */
    _loadUserSettings() {
        if (this.pageType !== 'settings' || !window.StorageManager) return;
        
        const settings = StorageManager.getSettings();
        
        // Initialize form fields with current settings
        this._populateSettingsForm(settings);
        
        // Set up settings form submission
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this._saveUserSettings();
            });
        }
    }

    /**
     * Populate settings form with current values
     * @private
     * @param {Object} settings - User settings
     */
    _populateSettingsForm(settings) {
        // Interface settings
        const animationsToggle = document.getElementById('animationsToggle');
        const glowEffectsToggle = document.getElementById('glowEffectsToggle');
        const glassEffectsToggle = document.getElementById('glassEffectsToggle');
        const blurSlider = document.getElementById('blurSlider');
        
        if (animationsToggle) animationsToggle.checked = settings.animations !== false;
        if (glowEffectsToggle) glowEffectsToggle.checked = settings.glowEffects !== false;
        if (glassEffectsToggle) glassEffectsToggle.checked = settings.glassEffects !== false;
        if (blurSlider) blurSlider.value = settings.blurIntensity || 10;
        
        // Notification settings
        const emailNotifications = document.getElementById('emailNotifications');
        const browserNotifications = document.getElementById('browserNotifications');
        const soundEffects = document.getElementById('soundEffects');
        
        if (emailNotifications) emailNotifications.checked = settings.emailNotifications !== false;
        if (browserNotifications) browserNotifications.checked = settings.browserNotifications || false;
        if (soundEffects) soundEffects.checked = settings.soundEffects || false;
    }

    /**
     * Save user settings from form
     * @private
     */
    _saveUserSettings() {
        if (!window.StorageManager) return;
        
        // Get form values
        const settings = {
            animations: document.getElementById('animationsToggle')?.checked,
            glowEffects: document.getElementById('glowEffectsToggle')?.checked,
            glassEffects: document.getElementById('glassEffectsToggle')?.checked,
            blurIntensity: parseInt(document.getElementById('blurSlider')?.value || 10),
            emailNotifications: document.getElementById('emailNotifications')?.checked,
            browserNotifications: document.getElementById('browserNotifications')?.checked,
            soundEffects: document.getElementById('soundEffects')?.checked
        };
        
        // Get theme settings
        const themeManager = this.getComponent('themeManager');
        if (themeManager) {
            settings.theme = themeManager.currentTheme;
            
            // Apply interface settings
            themeManager.applyInterfaceSettings(settings);
        }
        
        // Save settings
        const success = StorageManager.updateSettings(settings);
        
        if (success) {
            if (window.NotificationManager) {
                NotificationManager.success('Settings saved successfully');
            }
        } else {
            if (window.NotificationManager) {
                NotificationManager.error('Failed to save settings');
            }
        }
    }

    /**
     * Show welcome message for first-time users
     * @private
     */
    _showWelcomeMessage() {
        if (!window.StorageManager) return;
        
        const settings = StorageManager.getSettings();
        
        // Check if this is the first run
        if (!settings.hasSeenWelcome) {
            if (window.NotificationManager) {
                NotificationManager.info(
                    'Welcome to Project-TMS! Get started by creating your first project.',
                    'Welcome'
                );
            }
            
            // Mark welcome message as seen
            StorageManager.updateSettings({ hasSeenWelcome: true });
        }
    }

    /**
     * Show storage management dialog
     * @private
     */
    _showStorageManagementDialog() {
        // Create a dialog offering storage management options
        alert('Storage space is running low. Please consider deleting old projects or exporting and clearing data.');
        
        // TODO: Implement a proper dialog with options to manage storage
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
    window.app.init();
});