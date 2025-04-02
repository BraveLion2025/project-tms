/**
 * Date Formatter Utility for Project-TMS
 * Provides consistent date and time formatting across the application
 */
const DateFormatter = {
    /**
     * Format a date as a short date (e.g., "Jan 1, 2023")
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatShortDate: function(date) {
        if (!date) return 'Not set';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString(undefined, options);
    },
    
    /**
     * Format a date as a long date (e.g., "January 1, 2023")
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatLongDate: function(date) {
        if (!date) return 'Not set';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString(undefined, options);
    },
    
    /**
     * Format a date and time (e.g., "Jan 1, 2023, 1:30 PM")
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date and time string
     */
    formatDateTime: function(date) {
        if (!date) return 'Not set';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
        
        return `${dateObj.toLocaleDateString(undefined, dateOptions)}, ${dateObj.toLocaleTimeString(undefined, timeOptions)}`;
    },
    
    /**
     * Format a time duration in hours and minutes (e.g., "2h 30m")
     * @param {number} durationMs - Duration in milliseconds
     * @returns {string} Formatted duration string
     */
    formatDuration: function(durationMs) {
        if (!durationMs || isNaN(durationMs)) return "0h 0m";
        
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    },
    
    /**
     * Get a relative time string (e.g., "2 days ago", "in 3 hours")
     * @param {string|Date} date - Date to format
     * @returns {string} Relative time string
     */
    getRelativeTime: function(date) {
        if (!date) return 'Not set';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffMs = dateObj - now;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            // Today
            return 'Today';
        } else if (diffDays === 1) {
            // Tomorrow
            return 'Tomorrow';
        } else if (diffDays === -1) {
            // Yesterday
            return 'Yesterday';
        } else if (diffDays > 0 && diffDays < 7) {
            // Within the next week
            return `In ${diffDays} days`;
        } else if (diffDays < 0 && diffDays > -7) {
            // Within the past week
            return `${Math.abs(diffDays)} days ago`;
        } else {
            // Default to formatted date
            return this.formatShortDate(dateObj);
        }
    },
    
    /**
     * Check if a date is overdue
     * @param {string|Date} date - Date to check
     * @returns {boolean} True if the date is in the past
     */
    isOverdue: function(date) {
        if (!date) return false;
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        
        // Set time to end of day for comparison
        dateObj.setHours(23, 59, 59, 999);
        
        return dateObj < now;
    },
    
    /**
     * Check if a date is approaching within the specified days
     * @param {string|Date} date - Date to check
     * @param {number} daysThreshold - Days threshold
     * @returns {boolean} True if the date is approaching
     */
    isApproaching: function(date, daysThreshold = 3) {
        if (!date) return false;
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        
        // Set times to start of day for comparison
        dateObj.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        
        const diffDays = Math.round((dateObj - now) / (1000 * 60 * 60 * 24));
        
        return diffDays >= 0 && diffDays <= daysThreshold;
    }
};

// Make DateFormatter available globally
window.DateFormatter = DateFormatter;