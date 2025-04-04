/**
 * Notifications Component for Project-TMS
 * Provides toast messages and notification functionality
 */
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = 3;
        this.init();
    }

    /**
     * Initialize the notification manager
     */
    init() {
        this._createContainer();
        this._setupEventListeners();
    }

    /**
     * Create the notification container
     * @private
     */
    _createContainer() {
        // Check if container already exists
        if (document.getElementById('notification-container')) {
            this.container = document.getElementById('notification-container');
            return;
        }

        // Create container for notifications
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-3';
        document.body.appendChild(this.container);
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for storage events
        if (window.EventBus) {
            EventBus.subscribe('storage:quotaExceeded', () => {
                this.show({
                    type: 'error',
                    title: 'Storage Full',
                    message: 'Local storage is full. Please delete some items.',
                    duration: 8000
                });
            });

            EventBus.subscribe('data:imported', (data) => {
                this.show({
                    type: 'success',
                    title: 'Import Successful',
                    message: `Imported ${data.projectCount} projects and ${data.taskCount} tasks.`,
                    duration: 5000
                });
            });

            EventBus.subscribe('data:importFailed', (data) => {
                this.show({
                    type: 'error',
                    title: 'Import Failed',
                    message: data.error || 'Failed to import data.',
                    duration: 8000
                });
            });
        }
    }

    /**
     * Show a notification
     * @param {Object} options - Notification options
     * @param {string} options.type - Type of notification ('success', 'error', 'warning', 'info')
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {number} options.duration - Duration in milliseconds
     */
    show({ type = 'info', title = '', message = '', duration = 5000 }) {
        // Limit number of notifications
        if (this.notifications.length >= this.maxNotifications) {
            this._removeOldest();
        }

        // Create notification element
        const notificationId = Date.now().toString();
        const notification = document.createElement('div');
        notification.id = `notification-${notificationId}`;
        notification.className = this._getNotificationClasses(type);
        notification.setAttribute('role', 'alert');
        notification.innerHTML = this._getNotificationContent(type, title, message);

        // Add dismiss button
        const dismissBtn = notification.querySelector('.notification-dismiss');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                this.dismiss(notificationId);
            });
        }

        // Add to container
        this.container.appendChild(notification);
        this.notifications.push({ id: notificationId, element: notification });

        // Trigger enter animation
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 10);

        // Auto dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(notificationId);
            }, duration);
        }

        return notificationId;
    }

    /**
     * Show a success notification
     * @param {string} message - Notification message
     * @param {string} title - Notification title
     * @param {number} duration - Duration in milliseconds
     */
    success(message, title = 'Success', duration = 5000) {
        return this.show({ type: 'success', title, message, duration });
    }

    /**
     * Show an error notification
     * @param {string} message - Notification message
     * @param {string} title - Notification title
     * @param {number} duration - Duration in milliseconds
     */
    error(message, title = 'Error', duration = 8000) {
        return this.show({ type: 'error', title, message, duration });
    }

    /**
     * Show a warning notification
     * @param {string} message - Notification message
     * @param {string} title - Notification title
     * @param {number} duration - Duration in milliseconds
     */
    warning(message, title = 'Warning', duration = 6000) {
        return this.show({ type: 'warning', title, message, duration });
    }

    /**
     * Show an info notification
     * @param {string} message - Notification message
     * @param {string} title - Notification title
     * @param {number} duration - Duration in milliseconds
     */
    info(message, title = 'Information', duration = 5000) {
        return this.show({ type: 'info', title, message, duration });
    }

    /**
     * Dismiss a notification by ID
     * @param {string} id - Notification ID
     */
    dismiss(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        const element = notification.element;

        // Add exit animation
        element.classList.add('translate-x-full', 'opacity-0');

        // Remove after animation completes
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    /**
     * Remove all notifications
     */
    clear() {
        this.notifications.forEach(notification => {
            this.dismiss(notification.id);
        });
    }

    /**
     * Remove the oldest notification
     * @private
     */
    _removeOldest() {
        if (this.notifications.length > 0) {
            this.dismiss(this.notifications[0].id);
        }
    }

    /**
     * Get CSS classes for notification type
     * @private
     * @param {string} type - Notification type
     * @returns {string} CSS classes
     */
    _getNotificationClasses(type) {
        const baseClasses = 'flex items-start p-4 mb-2 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full opacity-0 glass-effect';
        
        const typeClasses = {
            success: 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700',
            error: 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700',
            warning: 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700',
            info: 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
        };

        return `${baseClasses} ${typeClasses[type] || typeClasses.info}`;
    }

    /**
     * Get notification content HTML
     * @private
     * @param {string} type - Notification type
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @returns {string} HTML content
     */
    _getNotificationContent(type, title, message) {
        const icons = {
            success: '<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
            error: '<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
            warning: '<svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
            info: '<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        };

        const titleColors = {
            success: 'text-green-800 dark:text-green-200',
            error: 'text-red-800 dark:text-red-200',
            warning: 'text-yellow-800 dark:text-yellow-200',
            info: 'text-blue-800 dark:text-blue-200'
        };

        return `
            <div class="flex-shrink-0 mr-3">
                ${icons[type] || icons.info}
            </div>
            <div class="flex-1">
                <h3 class="text-sm font-medium ${titleColors[type] || titleColors.info}">${title}</h3>
                <div class="mt-1 text-sm text-gray-700 dark:text-gray-300">${message}</div>
            </div>
            <button class="notification-dismiss ml-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
    }
}

// Create a single instance of the notification manager
window.NotificationManager = new NotificationManager();