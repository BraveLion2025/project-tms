/**
 * Time Tracker for Project-TMS
 * Handles time tracking for tasks and updates displays
 * Updated for async storage operations
 */
class TimeTracker {
    constructor() {
        this.activeTimerId = null;
        this.tickInterval = null;
        this.init();
    }

    /**
     * Initialize time tracker
     */
    async init() {
        this._setupEventListeners();
        this._startTimerUpdates();
        this._setupBeforeUnload();
        
        // Find active task on load
        await this._findActiveTask();
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        if (window.EventBus) {
            // Listen for time tracking events
            EventBus.subscribe('timeTracking:started', (data) => {
                this.activeTimerId = data.taskId;
                this._startTickInterval();
            });
            
            EventBus.subscribe('timeTracking:stopped', () => {
                this.activeTimerId = null;
                this._stopTickInterval();
            });
            
            // Listen for task status changes
            EventBus.subscribe('task:updated', (task) => {
                // If task was active and now not in progress, stop tracking
                if (this.activeTimerId === task.id && task.status !== 'in-progress') {
                    this.activeTimerId = null;
                    this._stopTickInterval();
                }
            });
        }
    }

    /**
     * Find and set active task on load
     * @private
     */
    async _findActiveTask() {
        if (!window.StorageManager) return;
        
        try {
            const tasks = await StorageManager.getTasks();
            const activeTask = tasks.find(task => 
                task.timeTracking && 
                task.timeTracking.isActive
            );
            
            if (activeTask) {
                this.activeTimerId = activeTask.id;
                this._startTickInterval();
            }
        } catch (error) {
            console.error('Error finding active task:', error);
        }
    }

    /**
     * Start interval for updating timer displays
     * @private
     */
    _startTimerUpdates() {
        // Update timer displays once per second
        setInterval(() => {
            if (!this.activeTimerId) return;
            
            this._updateTimerDisplays();
        }, 1000);
    }

    /**
     * Set up beforeunload handler to save timers
     * @private
     */
    _setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            this._handleUnload();
        });
    }

    /**
     * Handle actions before page unload
     * @private
     */
    async _handleUnload() {
        // Automatically pause any active timers when the page is closed
        if (this.activeTimerId && window.StorageManager) {
            try {
                const task = await StorageManager.getTaskById(this.activeTimerId);
                
                if (task && task.timeTracking && task.timeTracking.isActive) {
                    // Calculate final time
                    const now = new Date();
                    const lastStarted = new Date(task.timeTracking.lastStarted);
                    const timeSpentThisSession = now - lastStarted;
                    
                    const updatedTimeTracking = {
                        ...task.timeTracking,
                        isActive: false,
                        totalTime: (task.timeTracking.totalTime || 0) + timeSpentThisSession,
                        lastStarted: null
                    };
                    
                    // Update task with new time tracking data
                    await StorageManager.updateTask(task.id, {
                        timeTracking: updatedTimeTracking
                    });
                }
            } catch (error) {
                console.error('Error handling unload:', error);
            }
        }
    }

    /**
     * Start interval for updating timer in real-time
     * @private
     */
    _startTickInterval() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
        
        // Create a tick interval for fast updates
        this.tickInterval = setInterval(() => {
            this._updateActiveTimerElement();
        }, 1000);
    }

    /**
     * Stop the tick interval
     * @private
     */
    _stopTickInterval() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    /**
     * Update timer displays
     * @private
     */
    async _updateTimerDisplays() {
        if (!this.activeTimerId || !window.StorageManager) return;
        
        try {
            const task = await StorageManager.getTaskById(this.activeTimerId);
            if (!task) return;
            
            // Find all timer displays for this task
            const timeDisplays = document.querySelectorAll(`.task-time-display[data-task-id="${this.activeTimerId}"]`);
            timeDisplays.forEach(display => {
                const timeSpent = this._calculateTimeSpent(task);
                const formattedTime = window.DateFormatter ? 
                    DateFormatter.formatDuration(timeSpent) : 
                    this._formatDuration(timeSpent);
                
                display.textContent = `Time spent: ${formattedTime}`;
            });
        } catch (error) {
            console.error('Error updating timer displays:', error);
        }
    }

    /**
     * Update the active timer element in the view modal
     * @private
     */
    async _updateActiveTimerElement() {
        if (!this.activeTimerId || !window.StorageManager) return;
        
        try {
            const task = await StorageManager.getTaskById(this.activeTimerId);
            if (!task) return;
            
            // Find time display in view task modal
            const timeInfoEl = document.getElementById('viewTaskTimeInfo');
            if (!timeInfoEl) return;
            
            const timeSpentEl = timeInfoEl.querySelector('.time-spent-value');
            if (timeSpentEl) {
                const timeSpent = this._calculateTimeSpent(task);
                const formattedTime = window.DateFormatter ? 
                    DateFormatter.formatDuration(timeSpent) : 
                    this._formatDuration(timeSpent);
                
                timeSpentEl.textContent = `Time spent: ${formattedTime}`;
            }
        } catch (error) {
            console.error('Error updating active timer element:', error);
        }
    }

    /**
     * Calculate time spent on a task
     * @private
     * @param {Object} task - Task data
     * @returns {number} Time spent in milliseconds
     */
    _calculateTimeSpent(task) {
        if (!task.timeTracking) return 0;
        
        let totalTime = task.timeTracking.totalTime || 0;
        
        // If timer is currently active, add the time since last start
        if (task.timeTracking.isActive && task.timeTracking.lastStarted) {
            const now = new Date();
            const lastStarted = new Date(task.timeTracking.lastStarted);
            totalTime += (now - lastStarted);
        }
        
        return totalTime;
    }

    /**
     * Format duration helper
     * @private
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration string
     */
    _formatDuration(ms) {
        if (!ms) return '0h 0m';
        
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    /**
     * Toggle time tracking for a task
     * @param {string} taskId - Task ID
     * @returns {Promise<boolean>} Success status
     */
    async toggleTracking(taskId) {
        if (!taskId || !window.StorageManager) return false;
        
        try {
            const success = await StorageManager.toggleTimeTracking(taskId);
            return !!success;
        } catch (error) {
            console.error('Error toggling time tracking:', error);
            return false;
        }
    }

    /**
     * Get active task ID
     * @returns {string|null} Active task ID or null
     */
    getActiveTaskId() {
        return this.activeTimerId;
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global TimeTracker instance
    window.timeTracker = new TimeTracker();
});