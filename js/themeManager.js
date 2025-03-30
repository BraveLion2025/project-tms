/**
 * Enhanced Theme Manager for Project-TMS
 * Handles theme switching and custom styling
 */
class ThemeManager {
    constructor() {
        this.themes = [
            { id: 'light', name: 'Light', icon: '☀️' },
            { id: 'dark', name: 'Dark', icon: '🌙' },
            { id: 'digital-void', name: 'Digital Void', icon: '🌌' },
            { id: 'neo-synth', name: 'Neo Synth', icon: '🌈' },
            { id: 'aurora', name: 'Aurora', icon: '✨' }
        ];
        
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        // Initialize the theme system
        this.init();
    }

    /**
     * Initialize theme system
     */
    init() {
        // Apply saved theme
        this.applyTheme(this.currentTheme);
        
        // Initialize theme switcher
        this.setupThemeSwitcher();
        
        // Add class for initial animations to run
        document.body.classList.add('theme-initialized');
        
        // Apply saved custom colors if any
        this.loadCustomColors();
    }

    /**
     * Apply theme to the document
     * @param {string} themeId - Theme identifier
     */
    applyTheme(themeId) {
        // Validate theme
        if (!this.themes.some(theme => theme.id === themeId)) {
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
        this.updateSwitcherUI(themeId);
        
        // Apply predefined colors for this theme
        this.applyThemeColors(themeId);
        
        // Dispatch theme change event
        const event = new CustomEvent('themechange', { detail: { theme: themeId } });
        document.dispatchEvent(event);
    }

    /**
     * Apply predefined colors for the specified theme
     * @param {string} themeId - Theme identifier
     */
    applyThemeColors(themeId) {
        const root = document.documentElement;
        
        // Reset any custom colors
        if (themeId === 'light') {
            root.style.setProperty('--accent-primary', '#3b82f6');
            root.style.setProperty('--accent-secondary', '#60a5fa');
            root.style.setProperty('--success-color', '#10b981');
            root.style.setProperty('--warning-color', '#f59e0b');
            root.style.setProperty('--danger-color', '#ef4444');
        } else if (themeId === 'dark') {
            root.style.setProperty('--accent-primary', '#60a5fa');
            root.style.setProperty('--accent-secondary', '#93c5fd');
            root.style.setProperty('--success-color', '#34d399');
            root.style.setProperty('--warning-color', '#fbbf24');
            root.style.setProperty('--danger-color', '#f87171');
        } else if (themeId === 'digital-void') {
            root.style.setProperty('--accent-primary', '#6366f1');
            root.style.setProperty('--accent-secondary', '#00ffcc');
            root.style.setProperty('--success-color', '#00ff88');
            root.style.setProperty('--warning-color', '#ffcc00');
            root.style.setProperty('--danger-color', '#ff3366');
        } else if (themeId === 'neo-synth') {
            root.style.setProperty('--accent-primary', '#01cdfe');
            root.style.setProperty('--accent-secondary', '#05ffa1');
            root.style.setProperty('--success-color', '#05ffa1');
            root.style.setProperty('--warning-color', '#fffb96');
            root.style.setProperty('--danger-color', '#ff71ce');
        } else if (themeId === 'aurora') {
            root.style.setProperty('--accent-primary', '#6ee7b7');
            root.style.setProperty('--accent-secondary', '#38bdf8');
            root.style.setProperty('--success-color', '#6ee7b7');
            root.style.setProperty('--warning-color', '#fcd34d');
            root.style.setProperty('--danger-color', '#fb7185');
        }
        
        // Apply custom colors if saved
        this.loadCustomColors();
    }

    /**
     * Load and apply custom colors from settings
     */
    loadCustomColors() {
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        
        if (settings.colors) {
            const root = document.documentElement;
            if (settings.colors.primary) {
                root.style.setProperty('--accent-primary', settings.colors.primary);
            }
            if (settings.colors.secondary) {
                root.style.setProperty('--accent-secondary', settings.colors.secondary);
            }
            
            // Update color picker inputs if they exist
            this.updateColorPickerInputs();
        }
    }

    /**
     * Update color picker inputs to match current theme colors
     */
    updateColorPickerInputs() {
        const colorPickers = document.querySelectorAll('.color-picker-input');
        colorPickers.forEach(picker => {
            const variable = picker.dataset.var;
            const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
            picker.value = this.rgbToHex(value) || value;
        });
    }
    
    /**
     * Convert RGB color to HEX
     * @param {string} rgb - RGB color string (e.g. "rgb(0, 0, 0)")
     * @returns {string} HEX color or empty string if invalid
     */
    rgbToHex(rgb) {
        if (!rgb || !rgb.startsWith('rgb')) return '';
        
        // Extract RGB values
        const match = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (!match) return '';
        
        // Convert to HEX
        return '#' + 
            ('0' + parseInt(match[1], 10).toString(16)).slice(-2) +
            ('0' + parseInt(match[2], 10).toString(16)).slice(-2) +
            ('0' + parseInt(match[3], 10).toString(16)).slice(-2);
    }
    
    /**
     * Save custom colors to settings
     * @param {string} primary - Primary accent color
     * @param {string} secondary - Secondary accent color
     */
    saveCustomColors(primary, secondary) {
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        
        settings.colors = {
            ...settings.colors,
            primary,
            secondary
        };
        
        localStorage.setItem('settings', JSON.stringify(settings));
        
        // Apply the colors
        const root = document.documentElement;
        root.style.setProperty('--accent-primary', primary);
        root.style.setProperty('--accent-secondary', secondary);
        
        // Update glow colors based on primary color
        this.updateGlowColors(primary);
    }
    
    /**
     * Update glow colors based on primary accent color
     * @param {string} primaryColor - Primary accent color
     */
    updateGlowColors(primaryColor) {
        // Convert to RGBA with opacity for glow
        let rgbaColor = primaryColor;
        
        // If it's a hex color, convert to rgba
        if (primaryColor.startsWith('#')) {
            const r = parseInt(primaryColor.slice(1, 3), 16);
            const g = parseInt(primaryColor.slice(3, 5), 16);
            const b = parseInt(primaryColor.slice(5, 7), 16);
            rgbaColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
        }
        // If it's already rgb, convert to rgba
        else if (primaryColor.startsWith('rgb(')) {
            rgbaColor = primaryColor.replace('rgb(', 'rgba(').replace(')', ', 0.4)');
        }
        
        // Set the glow color
        document.documentElement.style.setProperty('--glow-primary', rgbaColor);
    }
    
    /**
     * Export current theme settings
     * @returns {Object} Theme settings object
     */
    exportThemeSettings() {
        const root = document.documentElement;
        return {
            name: this.currentTheme,
            colors: {
                primary: getComputedStyle(root).getPropertyValue('--accent-primary').trim(),
                secondary: getComputedStyle(root).getPropertyValue('--accent-secondary').trim(),
                success: getComputedStyle(root).getPropertyValue('--success-color').trim(),
                warning: getComputedStyle(root).getPropertyValue('--warning-color').trim(),
                danger: getComputedStyle(root).getPropertyValue('--danger-color').trim()
            }
        };
    }
    
    /**
     * Import theme settings
     * @param {Object} settings - Theme settings object
     */
    importThemeSettings(settings) {
        if (!settings || !settings.name) return false;
        
        try {
            // Apply the theme
            this.applyTheme(settings.name);
            
            // Apply custom colors if provided
            if (settings.colors) {
                const root = document.documentElement;
                
                if (settings.colors.primary) {
                    root.style.setProperty('--accent-primary', settings.colors.primary);
                }
                if (settings.colors.secondary) {
                    root.style.setProperty('--accent-secondary', settings.colors.secondary);
                }
                if (settings.colors.success) {
                    root.style.setProperty('--success-color', settings.colors.success);
                }
                if (settings.colors.warning) {
                    root.style.setProperty('--warning-color', settings.colors.warning);
                }
                if (settings.colors.danger) {
                    root.style.setProperty('--danger-color', settings.colors.danger);
                }
                
                // Update glow colors
                this.updateGlowColors(settings.colors.primary);
                
                // Save to settings
                this.saveCustomColors(settings.colors.primary, settings.colors.secondary);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing theme settings:', error);
            return false;
        }
    }

    /**
     * Setup theme switcher UI
     */
    setupThemeSwitcher() {
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
     * Update the theme switcher UI to show current theme
     * @param {string} themeId - Current theme ID
     */
    updateSwitcherUI(themeId) {
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
     * Apply interface settings from user preferences
     * @param {Object} settings - User settings object
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
     * Remove theme switcher from DOM
     * Useful when you want to manually control theme placement
     */
    removeThemeSwitcher() {
        const switcher = document.getElementById('theme-switcher');
        if (switcher) {
            switcher.remove();
        }
    }

    /**
     * Get a list of all available themes
     * @returns {Array} List of theme objects
     */
    getThemes() {
        return this.themes;
    }

    /**
     * Check if a theme exists
     * @param {string} themeId - Theme identifier to check
     * @returns {boolean} True if theme exists
     */
    themeExists(themeId) {
        return this.themes.some(theme => theme.id === themeId);
    }

    /**
     * Reset all custom colors to theme defaults
     */
    resetCustomColors() {
        this.applyThemeColors(this.currentTheme);
        
        // Remove custom colors from settings
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        if (settings.colors) {
            delete settings.colors;
            localStorage.setItem('settings', JSON.stringify(settings));
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.themeManager) {
        window.themeManager = new ThemeManager();
    }
});