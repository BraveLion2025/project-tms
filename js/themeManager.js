// Theme Manager
class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'digital-void'];
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Apply saved theme
        this.applyTheme(this.currentTheme);
        
        // Initialize theme switcher
        this.initThemeSwitcher();
        
        // Load saved settings
        this.loadSettings();
    }

    applyTheme(theme) {
        // Remove all theme classes
        this.themes.forEach(t => document.body.classList.remove(`theme-${t}`));
        
        // Add new theme class
        document.body.classList.add(`theme-${theme}`);
        
        // Save theme preference
        localStorage.setItem('theme', theme);
        
        // Update theme switcher UI
        this.updateThemeSwitcherUI(theme);
        
        // Apply theme-specific styles
        this.applyThemeStyles(theme);
    }

    initThemeSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'fixed bottom-4 right-4 z-50';
        switcher.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
                <div class="flex space-x-2">
                    ${this.themes.map(theme => `
                        <button 
                            class="theme-btn w-8 h-8 rounded-full transition-all duration-300"
                            data-theme="${theme}"
                            title="${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme">
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(switcher);
        
        // Add click handlers
        switcher.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.applyTheme(theme);
            });
        });
    }

    updateThemeSwitcherUI(theme) {
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            if (btn.dataset.theme === theme) {
                btn.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500');
            } else {
                btn.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500');
            }
        });
    }

    applyThemeStyles(theme) {
        // Apply theme-specific styles
        const root = document.documentElement;
        
        if (theme === 'digital-void') {
            // Digital Void specific styles
            root.style.setProperty('--bg-primary', '#0a0f1a');
            root.style.setProperty('--bg-secondary', '#141e2c');
            root.style.setProperty('--text-primary', '#00ff95');
            root.style.setProperty('--text-secondary', '#00cc88');
            root.style.setProperty('--accent-primary', '#6366f1');
            root.style.setProperty('--accent-secondary', '#00ffbb');
            root.style.setProperty('--border-color', '#1e293b');
            root.style.setProperty('--success-color', '#00ff88');
            root.style.setProperty('--warning-color', '#ffcc00');
            root.style.setProperty('--danger-color', '#ff3366');
        } else if (theme === 'dark') {
            // Dark theme styles
            root.style.setProperty('--bg-primary', '#1f2937');
            root.style.setProperty('--bg-secondary', '#111827');
            root.style.setProperty('--text-primary', '#f9fafb');
            root.style.setProperty('--text-secondary', '#e5e7eb');
            root.style.setProperty('--accent-primary', '#60a5fa');
            root.style.setProperty('--accent-secondary', '#93c5fd');
            root.style.setProperty('--border-color', '#374151');
            root.style.setProperty('--success-color', '#34d399');
            root.style.setProperty('--warning-color', '#fbbf24');
            root.style.setProperty('--danger-color', '#f87171');
        } else {
            // Light theme styles
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f3f4f6');
            root.style.setProperty('--text-primary', '#1f2937');
            root.style.setProperty('--text-secondary', '#4b5563');
            root.style.setProperty('--accent-primary', '#3b82f6');
            root.style.setProperty('--accent-secondary', '#60a5fa');
            root.style.setProperty('--border-color', '#e5e7eb');
            root.style.setProperty('--success-color', '#10b981');
            root.style.setProperty('--warning-color', '#f59e0b');
            root.style.setProperty('--danger-color', '#ef4444');
        }
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        
        // Apply saved theme colors if they exist
        if (settings.colors) {
            const root = document.documentElement;
            root.style.setProperty('--accent-primary', settings.colors.primary);
            root.style.setProperty('--accent-secondary', settings.colors.secondary);
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
}); 