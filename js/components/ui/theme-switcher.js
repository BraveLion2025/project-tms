/**
 * Theme Switcher Component for Project-TMS
 * Manages theme selection and customization
 */
class ThemeSwitcher {
    constructor() {
        this.themes = [
            { id: 'light', name: 'Light', icon: '☀️' },
            { id: 'dark', name: 'Dark', icon: '🌙' },
            { id: 'digital-void', name: 'Digital Void', icon: '🌌' },
            { id: 'neo-synth', name: 'Neo Synth', icon: '🌈' },
            { id: 'aurora', name: 'Aurora', icon: '✨' }
        ];
        
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    /**
     * Initialize the theme switcher
     */
    init() {
        // Apply saved theme
        this.applyTheme(this.currentTheme);
        
        // Create the theme switcher UI
        this._createSwitcher();
        
        // Apply saved interface settings
        this._applyInterfaceSettings();
        
        // Add class for initial animations to run
        document.body.classList.add('theme-initialized');
        
        // Subscribe to events
        if (window.EventBus) {
            EventBus.subscribe('settings:updated', (settings) => {
                this.applyInterfaceSettings(settings);
            });
        }
    }

    /**
     * Apply a theme
     * @param {string} themeId - Theme ID to apply
     */
    applyTheme(themeId) {
        // Validate theme
        if (!this.themeExists(themeId)) {
            themeId = 'light'; // Default to light if invalid
        }
        
        // Remove all theme classes
        this.themes.forEach(theme => {
            document.body.classList.remove(`theme-${theme.id}`);
        });
        
        // Add new theme class
        document.body.classList.add(`theme-${themeId}`);
        
        // Store current theme
        this.currentTheme = themeId;
        localStorage.setItem('theme', themeId);
        
        // Update switcher UI
        this._updateSwitcherUI(themeId);
        
        // Dispatch theme change event
        if (window.EventBus) {
            EventBus.emit('theme:changed', { theme: themeId });
        }
    }

    /**
     * Create the theme switcher UI
     * @private
     */
    _createSwitcher() {
        const existingSwitcher = document.getElementById('theme-switcher');
        
        // Only create if it doesn't exist
        if (!existingSwitcher) {
            const switcher = document.createElement('div');
            switcher.id = 'theme-switcher';
            switcher.className = 'fixed bottom-4 right-4 z-50 transition-all duration-300 hover:scale-105';
            
            // Create the switcher UI
            switcher.innerHTML = `
                <div class="bg-white dark:bg-gray-800 glass-effect rounded-lg shadow-lg p-2">
                    <div class="flex space-x-2">
                        ${this.themes.map(theme => `
                            <button 
                                class="theme-btn w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                                data-theme="${theme.id}" 
                                title="${theme.name} Theme">
                                ${theme.icon}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            
            document.body.appendChild(switcher);
            
            // Add event listeners
            this.themes.forEach(theme => {
                const btn = switcher.querySelector(`[data-theme="${theme.id}"]`);
                if (btn) {
                    btn.addEventListener('click', () => {
                        this.applyTheme(theme.id);
                    });
                }
            });
        }
    }

    /**
     * Update the theme switcher UI to reflect current theme
     * @private
     * @param {string} themeId - Current theme ID
     */
    _updateSwitcherUI(themeId) {
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            if (btn.dataset.theme === themeId) {
                btn.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500', 'glow-primary');
            } else {
                btn.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500', 'glow-primary');
            }
        });
    }

    /**
     * Apply interface settings from local storage
     * @private
     */
    _applyInterfaceSettings() {
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        this.applyInterfaceSettings(settings);
    }

    /**
     * Apply interface settings
     * @param {Object} settings - User interface settings
     */
    applyInterfaceSettings(settings) {
        if (!settings) return;
        
        // Apply animations toggle
        if (settings.animations === false) {
            document.body.classList.add('disable-animations');
        } else {
            document.body.classList.remove('disable-animations');
        }
        
        // Apply glow effects toggle
        if (settings.glowEffects === false) {
            document.body.classList.add('disable-glow');
        } else {
            document.body.classList.remove('disable-glow');
        }
        
        // Apply glass effects toggle
        if (settings.glassEffects === false) {
            document.body.classList.add('disable-glass');
        } else {
            document.body.classList.remove('disable-glass');
        }
        
        // Apply blur intensity
        if (settings.blurIntensity !== undefined) {
            const blurValue = `${settings.blurIntensity}px`;
            document.documentElement.style.setProperty('--glass-blur', blurValue);
        }
    }

    /**
     * Get current theme ID
     * @returns {string} Current theme ID
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Get theme data by ID
     * @param {string} themeId - Theme ID
     * @returns {Object|null} Theme data or null if not found
     */
    getTheme(themeId) {
        return this.themes.find(theme => theme.id === themeId) || null;
    }

    /**
     * Get all available themes
     * @returns {Array} List of theme objects
     */
    getThemes() {
        return this.themes;
    }

    /**
     * Check if a theme exists
     * @param {string} themeId - Theme ID
     * @returns {boolean} True if theme exists
     */
    themeExists(themeId) {
        return this.themes.some(theme => theme.id === themeId);
    }

    /**
     * Hide the theme switcher
     * Useful if you want to control it manually
     */
    hideSwitcher() {
        const switcher = document.getElementById('theme-switcher');
        if (switcher) {
            switcher.style.display = 'none';
        }
    }

    /**
     * Show the theme switcher
     */
    showSwitcher() {
        const switcher = document.getElementById('theme-switcher');
        if (switcher) {
            switcher.style.display = '';
        }
    }
}

// Initialize theme switcher when DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global theme switcher instance
    window.themeSwitcher = new ThemeSwitcher();
});