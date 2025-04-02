/**
 * Settings Manager for Project-TMS
 * Handles settings UI and storage
 */
class SettingsManager {
    constructor() {
        this.activeSection = 'theme-settings';
        this.init();
    }

    /**
     * Initialize the settings manager
     */
    init() {
        this._setupNavigation();
        this._setupThemeSettings();
        this._setupAppearanceSettings();
        this._setupDataSettings();
        this._setupNotificationSettings();
        this._setupSaveButton();
        
        // Load settings from storage
        this._loadSettings();
    }

    /**
     * Set up navigation between settings sections
     * @private
     */
    _setupNavigation() {
        const navItems = document.querySelectorAll('.settings-nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get section ID from href
                const sectionId = item.getAttribute('href').slice(1);
                this._showSection(sectionId);
                
                // Update active state
                navItems.forEach(navItem => {
                    navItem.classList.toggle('active', navItem === item);
                });
            });
        });
    }

    /**
     * Show a specific settings section
     * @private
     * @param {string} sectionId - ID of the section to show
     */
    _showSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('main section');
        sections.forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show requested section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
            this.activeSection = sectionId;
        }
    }

    /**
     * Set up theme settings UI
     * @private
     */
    _setupThemeSettings() {
        // Set up theme options
        const themeOptions = document.querySelectorAll('.theme-option');
        
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.dataset.theme;
                
                // Apply theme
                if (window.themeSwitcher) {
                    themeSwitcher.applyTheme(themeId);
                }
                
                // Update UI
                themeOptions.forEach(opt => {
                    opt.classList.toggle('border-accent-primary', opt === option);
                });
            });
        });
        
        // Set up color pickers
        const colorPickers = document.querySelectorAll('.color-picker-input');
        
        colorPickers.forEach(picker => {
            picker.addEventListener('input', (e) => {
                const variable = e.target.dataset.var;
                document.documentElement.style.setProperty(variable, e.target.value);
                
                // Update preview elements
                this._updateColorPreview();
            });
        });
        
        // Theme export/import buttons
        const exportThemeBtn = document.getElementById('exportThemeBtn');
        if (exportThemeBtn) {
            exportThemeBtn.addEventListener('click', () => {
                this._exportTheme();
            });
        }
        
        const importThemeBtn = document.getElementById('importThemeBtn');
        if (importThemeBtn) {
            importThemeBtn.addEventListener('click', () => {
                this._showImportThemeModal();
            });
        }
        
        // Import theme modal
        const themeFileInput = document.getElementById('themeFileInput');
        const confirmImportThemeBtn = document.getElementById('confirmImportThemeBtn');
        const cancelImportThemeBtn = document.getElementById('cancelImportThemeBtn');
        const closeImportThemeModalBtn = document.getElementById('closeImportThemeModalBtn');
        
        if (confirmImportThemeBtn) {
            confirmImportThemeBtn.addEventListener('click', () => {
                this._importTheme();
            });
        }
        
        if (cancelImportThemeBtn) {
            cancelImportThemeBtn.addEventListener('click', () => {
                this._closeImportThemeModal();
            });
        }
        
        if (closeImportThemeModalBtn) {
            closeImportThemeModalBtn.addEventListener('click', () => {
                this._closeImportThemeModal();
            });
        }
    }

    /**
     * Set up appearance settings UI
     * @private
     */
    _setupAppearanceSettings() {
        // Blur slider
        const blurSlider = document.getElementById('blurSlider');
        if (blurSlider) {
            blurSlider.addEventListener('input', (e) => {
                const blurValue = `${e.target.value}px`;
                document.documentElement.style.setProperty('--glass-blur', blurValue);
            });
        }
    }

    /**
     * Set up data settings UI
     * @private
     */
    _setupDataSettings() {
        // Export data button
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this._exportData();
            });
        }
        
        // Import data input
        const importDataInput = document.getElementById('importDataInput');
        if (importDataInput) {
            importDataInput.addEventListener('change', (e) => {
                this._importData(e.target.files[0]);
            });
        }
        
        // Clear data button
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this._showClearDataModal();
            });
        }
        
        // Clear data confirmation
        const confirmClearData = document.getElementById('confirmClearData');
        const confirmClearDataBtn = document.getElementById('confirmClearDataBtn');
        
        if (confirmClearData && confirmClearDataBtn) {
            confirmClearData.addEventListener('change', (e) => {
                confirmClearDataBtn.disabled = !e.target.checked;
            });
        }
        
        if (confirmClearDataBtn) {
            confirmClearDataBtn.addEventListener('click', () => {
                this._clearAllData();
                this._closeClearDataModal();
            });
        }
        
        const cancelClearDataBtn = document.getElementById('cancelClearDataBtn');
        if (cancelClearDataBtn) {
            cancelClearDataBtn.addEventListener('click', () => {
                this._closeClearDataModal();
            });
        }
        
        const closeClearDataModalBtn = document.getElementById('closeClearDataModalBtn');
        if (closeClearDataModalBtn) {
            closeClearDataModalBtn.addEventListener('click', () => {
                this._closeClearDataModal();
            });
        }
    }

    /**
     * Set up notification settings UI
     * @private
     */
    _setupNotificationSettings() {
        // Browser notifications
        const browserNotificationsToggle = document.getElementById('browserNotificationsToggle');
        if (browserNotificationsToggle) {
            browserNotificationsToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this._requestNotificationPermission();
                }
            });
        }
    }

    /**
     * Set up save button
     * @private
     */
    _setupSaveButton() {
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this._saveSettings();
            });
        }
    }

    /**
     * Load settings from storage
     * @private
     */
    _loadSettings() {
        if (!window.StorageManager) return;
        
        const settings = StorageManager.getSettings();
        
        // Apply theme
        if (settings.theme && window.themeSwitcher) {
            themeSwitcher.applyTheme(settings.theme);
            this._updateThemeUI(settings.theme);
        }
        
        // Apply colors
        if (settings.colors) {
            const root = document.documentElement;
            if (settings.colors.primary) {
                root.style.setProperty('--accent-primary', settings.colors.primary);
            }
            if (settings.colors.secondary) {
                root.style.setProperty('--accent-secondary', settings.colors.secondary);
            }
            
            // Update color pickers
            this._updateColorPickers();
            
            // Update preview
            this._updateColorPreview();
        }
        
        // Apply appearance settings
        const animationsToggle = document.getElementById('animationsToggle');
        const glowEffectsToggle = document.getElementById('glowEffectsToggle');
        const glassEffectsToggle = document.getElementById('glassEffectsToggle');
        const blurSlider = document.getElementById('blurSlider');
        
        if (animationsToggle) animationsToggle.checked = settings.animations !== false;
        if (glowEffectsToggle) glowEffectsToggle.checked = settings.glowEffects !== false;
        if (glassEffectsToggle) glassEffectsToggle.checked = settings.glassEffects !== false;
        if (blurSlider) blurSlider.value = settings.blurIntensity || 10;
        
        // Apply notification settings
        const browserNotificationsToggle = document.getElementById('browserNotificationsToggle');
        const inAppNotificationsToggle = document.getElementById('inAppNotificationsToggle');
        const soundEffectsToggle = document.getElementById('soundEffectsToggle');
        
        // Check Notification API permission
        if (browserNotificationsToggle && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                browserNotificationsToggle.checked = settings.browserNotifications !== false;
            } else {
                browserNotificationsToggle.checked = false;
            }
        }
        
        if (inAppNotificationsToggle) inAppNotificationsToggle.checked = settings.inAppNotifications !== false;
        if (soundEffectsToggle) soundEffectsToggle.checked = settings.soundEffects || false;
        
        // Notification types
        const notifyTaskDue = document.getElementById('notifyTaskDue');
        const notifyTaskStatus = document.getElementById('notifyTaskStatus');
        const notifyProjectUpdates = document.getElementById('notifyProjectUpdates');
        
        if (notifyTaskDue) notifyTaskDue.checked = settings.notifyTaskDue !== false;
        if (notifyTaskStatus) notifyTaskStatus.checked = settings.notifyTaskStatus !== false;
        if (notifyProjectUpdates) notifyProjectUpdates.checked = settings.notifyProjectUpdates !== false;
    }

    /**
     * Save settings to storage
     * @private
     */
    _saveSettings() {
        if (!window.StorageManager) return;
        
        // Get theme settings
        const theme = window.themeSwitcher ? themeSwitcher.getCurrentTheme() : 'light';
        
        // Get appearance settings
        const animations = document.getElementById('animationsToggle')?.checked;
        const glowEffects = document.getElementById('glowEffectsToggle')?.checked;
        const glassEffects = document.getElementById('glassEffectsToggle')?.checked;
        const blurIntensity = parseInt(document.getElementById('blurSlider')?.value || 10);
        
        // Get notification settings
        const browserNotifications = document.getElementById('browserNotificationsToggle')?.checked;
        const inAppNotifications = document.getElementById('inAppNotificationsToggle')?.checked;
        const soundEffects = document.getElementById('soundEffectsToggle')?.checked;
        const notifyTaskDue = document.getElementById('notifyTaskDue')?.checked;
        const notifyTaskStatus = document.getElementById('notifyTaskStatus')?.checked;
        const notifyProjectUpdates = document.getElementById('notifyProjectUpdates')?.checked;
        
        // Get colors
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
        const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
        
        // Build settings object
        const settings = {
            theme,
            animations,
            glowEffects,
            glassEffects,
            blurIntensity,
            browserNotifications,
            inAppNotifications,
            soundEffects,
            notifyTaskDue,
            notifyTaskStatus,
            notifyProjectUpdates,
            colors: {
                primary: primaryColor,
                secondary: secondaryColor
            }
        };
        
        // Save settings
        const success = StorageManager.updateSettings(settings);
        
        // Apply interface settings immediately
        if (window.themeSwitcher) {
            themeSwitcher.applyInterfaceSettings(settings);
        }
        
        // Show notification
        if (window.NotificationManager) {
            if (success) {
                NotificationManager.success('Settings saved successfully');
            } else {
                NotificationManager.error('Failed to save settings');
            }
        }
    }

    /**
     * Update theme UI based on current theme
     * @private
     * @param {string} themeId - Theme ID
     */
    _updateThemeUI(themeId) {
        const themeOptions = document.querySelectorAll('.theme-option');
        
        themeOptions.forEach(option => {
            const isSelected = option.dataset.theme === themeId;
            option.classList.toggle('border-accent-primary', isSelected);
        });
    }

    /**
     * Update color pickers to match current theme colors
     * @private
     */
    _updateColorPickers() {
        const primaryColorInput = document.getElementById('primaryColorInput');
        const secondaryColorInput = document.getElementById('secondaryColorInput');
        
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
        const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
        
        if (primaryColorInput) primaryColorInput.value = this._rgbToHex(primaryColor) || primaryColor;
        if (secondaryColorInput) secondaryColorInput.value = this._rgbToHex(secondaryColor) || secondaryColor;
    }

    /**
     * Update color preview elements
     * @private
     */
    _updateColorPreview() {
        // No specific implementation needed as the CSS variables automatically update the preview
    }

    /**
     * Convert RGB color to hex
     * @private
     * @param {string} rgb - RGB color string
     * @returns {string} Hex color or empty string if invalid
     */
    _rgbToHex(rgb) {
        if (!rgb || !rgb.startsWith('rgb')) return '';
        
        // Extract RGB values
        const match = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (!match) return '';
        
        // Convert to hex
        return '#' + 
            ('0' + parseInt(match[1], 10).toString(16)).slice(-2) +
            ('0' + parseInt(match[2], 10).toString(16)).slice(-2) +
            ('0' + parseInt(match[3], 10).toString(16)).slice(-2);
    }

    /**
     * Export the current theme
     * @private
     */
    _exportTheme() {
        const theme = {
            name: window.themeSwitcher ? themeSwitcher.getCurrentTheme() : 'light',
            colors: {
                primary: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim(),
                secondary: getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim()
            }
        };
        
        // Convert to JSON and download
        const json = JSON.stringify(theme, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-tms-theme-${theme.name}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Show the import theme modal
     * @private
     */
    _showImportThemeModal() {
        const modal = document.getElementById('importThemeModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Close the import theme modal
     * @private
     */
    _closeImportThemeModal() {
        const modal = document.getElementById('importThemeModal');
        if (modal) {
            modal.classList.remove('active');
            
            // Reset file input
            const fileInput = document.getElementById('themeFileInput');
            if (fileInput) fileInput.value = '';
        }
    }

    /**
     * Import a theme file
     * @private
     */
    _importTheme() {
        const fileInput = document.getElementById('themeFileInput');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            if (window.NotificationManager) {
                NotificationManager.warning('Please select a theme file');
            }
            return;
        }
        
        const file = fileInput.files[0];
        
        // Check file type
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            if (window.NotificationManager) {
                NotificationManager.error('Invalid file type. Please select a JSON file');
            }
            return;
        }
        
        // Read file
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const theme = JSON.parse(e.target.result);
                
                // Validate theme structure
                if (!theme.name || !theme.colors) {
                    throw new Error('Invalid theme format');
                }
                
                // Apply theme
                if (window.themeSwitcher) {
                    // Apply theme name
                    themeSwitcher.applyTheme(theme.name);
                    
                    // Apply custom colors
                    const root = document.documentElement;
                    if (theme.colors.primary) {
                        root.style.setProperty('--accent-primary', theme.colors.primary);
                    }
                    if (theme.colors.secondary) {
                        root.style.setProperty('--accent-secondary', theme.colors.secondary);
                    }
                    
                    // Update UI
                    this._updateThemeUI(theme.name);
                    this._updateColorPickers();
                }
                
                // Close modal
                this._closeImportThemeModal();
                
                // Show success notification
                if (window.NotificationManager) {
                    NotificationManager.success('Theme imported successfully');
                }
            } catch (error) {
                console.error('Error importing theme:', error);
                if (window.NotificationManager) {
                    NotificationManager.error('Failed to import theme: Invalid format');
                }
            }
        };
        
        reader.onerror = () => {
            if (window.NotificationManager) {
                NotificationManager.error('Failed to read theme file');
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * Export all application data
     * @private
     */
    _exportData() {
        if (!window.StorageManager) return;
        
        const exportData = StorageManager.exportData();
        
        // Create download file
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-tms-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show notification
        if (window.NotificationManager) {
            NotificationManager.success('Data exported successfully');
        }
    }

    /**
     * Import data from a file
     * @private
     * @param {File} file - Data file
     */
    _importData(file) {
        if (!file || !window.StorageManager) return;
        
        // Check file type
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            if (window.NotificationManager) {
                NotificationManager.error('Invalid file type. Please select a JSON file');
            }
            return;
        }
        
        // Read file
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = StorageManager.importData(e.target.result);
                
                if (success) {
                    // Reload settings
                    this._loadSettings();
                    
                    // Show success notification
                    if (window.NotificationManager) {
                        NotificationManager.success('Data imported successfully');
                    }
                    
                    // Reset file input
                    const fileInput = document.getElementById('importDataInput');
                    if (fileInput) fileInput.value = '';
                } else {
                    throw new Error('Import failed');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                if (window.NotificationManager) {
                    NotificationManager.error('Failed to import data: Invalid format');
                }
            }
        };
        
        reader.onerror = () => {
            if (window.NotificationManager) {
                NotificationManager.error('Failed to read data file');
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * Show clear data confirmation modal
     * @private
     */
    _showClearDataModal() {
        const modal = document.getElementById('clearDataModal');
        if (modal) {
            modal.classList.add('active');
            
            // Reset checkbox
            const checkbox = document.getElementById('confirmClearData');
            const confirmBtn = document.getElementById('confirmClearDataBtn');
            
            if (checkbox) checkbox.checked = false;
            if (confirmBtn) confirmBtn.disabled = true;
        }
    }

    /**
     * Close clear data confirmation modal
     * @private
     */
    _closeClearDataModal() {
        const modal = document.getElementById('clearDataModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Clear all application data
     * @private
     */
    _clearAllData() {
        if (!window.StorageManager) return;
        
        // Clear all localStorage
        localStorage.clear();
        
        // Reinitialize storage with default values
        StorageManager.initialize();
        
        // Reload settings
        this._loadSettings();
        
        // Show notification
        if (window.NotificationManager) {
            NotificationManager.success('All data has been cleared');
        }
    }

    /**
     * Request browser notification permission
     * @private
     */
    _requestNotificationPermission() {
        if (!('Notification' in window)) {
            if (window.NotificationManager) {
                NotificationManager.warning('Browser notifications are not supported in this browser');
            }
            return;
        }
        
        Notification.requestPermission().then(permission => {
            if (permission !== 'granted') {
                // If permission is denied, update toggle
                const toggle = document.getElementById('browserNotificationsToggle');
                if (toggle) toggle.checked = false;
                
                if (window.NotificationManager) {
                    NotificationManager.warning('Browser notifications permission denied');
                }
            }
        });
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on settings page
    if (window.location.pathname.includes('settings')) {
        window.settingsManager = new SettingsManager();
    }
});