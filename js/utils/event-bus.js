/**
 * Event Bus for Project-TMS
 * Enables decoupled communication between components
 */
const EventBus = {
    events: {},

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event to subscribe to
     * @param {function} callback - Function to be called when event is emitted
     */
    subscribe: function(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
        
        // Return an unsubscribe function
        return () => {
            this.events[eventName] = this.events[eventName].filter(
                eventCallback => eventCallback !== callback
            );
        };
    },

    /**
     * Emit an event with data
     * @param {string} eventName - Name of the event to emit
     * @param {any} data - Data to be passed to subscribers
     */
    emit: function(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => {
                callback(data);
            });
        }
    },

    /**
     * Clear all subscribers for a specific event
     * @param {string} eventName - Name of the event to clear
     */
    clear: function(eventName) {
        if (this.events[eventName]) {
            delete this.events[eventName];
        }
    }
};

// Make EventBus available globally
window.EventBus = EventBus;