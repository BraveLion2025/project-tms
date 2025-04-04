/**
 * Task Card Component for Project-TMS
 * Handles the creation and functionality of task cards
 */
class TaskCard {
    /**
     * Create a task card element
     * @param {Object} task - Task data
     * @param {Function} onClick - Click handler for the card
     * @returns {HTMLElement} Task card element
     */
    static create(task, onClick) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card status-${task.status} bg-gray-700 rounded-md p-3 mb-3 cursor-pointer`;
        taskEl.draggable = true;
        taskEl.dataset.taskId = task.id;
        
        // Generate the card content
        taskEl.innerHTML = this._generateCardContent(task);
        
        // Setup event listeners
        this._setupEventListeners(taskEl, task, onClick);
        
        return taskEl;
    }
    
    /**
     * Generate the HTML content for the task card
     * @private
     * @param {Object} task - Task data
     * @returns {string} HTML content
     */
    static _generateCardContent(task) {
        // Priority indicator
        let priorityColor = 'bg-gray-500';
        let priorityText = 'Low';
        
        if (task.priority === 'high') {
            priorityColor = 'bg-red-500';
            priorityText = 'High';
        } else if (task.priority === 'medium') {
            priorityColor = 'bg-yellow-500';
            priorityText = 'Medium';
        }
        
        // Time tracking information
        let timeTrackingHtml = '';
        
        if (task.timeTracking) {
            const timeSpent = this._calculateTimeSpent(task);
            const timeSpentDisplay = window.DateFormatter ? 
                DateFormatter.formatDuration(timeSpent) : 
                this._formatTimeSpent(timeSpent);
                
            // Create timer button for in-progress tasks
            if (task.status === 'in-progress') {
                const isActive = task.timeTracking.isActive;
                const buttonClass = isActive ? 
                    'bg-red-600 hover:bg-red-700' : 
                    'bg-green-600 hover:bg-green-700';
                const buttonText = isActive ? 'Pause' : 'Start';
                const buttonIcon = isActive ? 
                    '<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>' : 
                    '<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>';
                    
                timeTrackingHtml = `
                    <button class="time-tracker-btn flex items-center text-xs text-white px-2 py-1 rounded ${buttonClass} mt-2" data-task-id="${task.id}">
                        ${buttonIcon}
                        ${buttonText}
                    </button>
                `;
            }
            
            // Show time spent for non-completed tasks
            if (task.status !== 'done' && task.timeTracking.totalTime > 0) {
                timeTrackingHtml += `
                    <div class="text-xs text-gray-400 mt-2 task-time-display">
                        Time spent: ${timeSpentDisplay}
                    </div>
                `;
            }
        }
        
        // Display due date with status indicators
        let dueDateHtml = '';
        if (task.dueDate) {
            let dueDateClass = 'text-gray-400';
            let dueDatePrefix = 'Due: ';
            
            if (window.DateFormatter) {
                if (DateFormatter.isOverdue(task.dueDate)) {
                    dueDateClass = 'text-red-400';
                    dueDatePrefix = 'Overdue: ';
                } else if (DateFormatter.isApproaching(task.dueDate, 2)) {
                    dueDateClass = 'text-yellow-400';
                    dueDatePrefix = 'Due soon: ';
                }
                
                dueDateHtml = `<span class="text-xs ${dueDateClass}">${dueDatePrefix}${DateFormatter.formatShortDate(task.dueDate)}</span>`;
            } else {
                dueDateHtml = `<span class="text-xs text-gray-400">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>`;
            }
        }
        
        // Show completion time for done tasks
        let completionInfo = '';
        if (task.status === 'done' && task.completedAt) {
            const startedDate = task.startedAt ? new Date(task.startedAt) : null;
            const completedDate = new Date(task.completedAt);
            
            if (startedDate) {
                const duration = Math.floor((completedDate - startedDate) / (1000 * 60 * 60 * 24));
                const timeSpent = task.timeTracking ? task.timeTracking.totalTime : 0;
                const timeSpentDisplay = window.DateFormatter ? 
                    DateFormatter.formatDuration(timeSpent) : 
                    this._formatTimeSpent(timeSpent);
                
                completionInfo = `
                    <div class="text-xs text-gray-400 mt-2">
                        Completed in ${duration > 0 ? `${duration} day${duration !== 1 ? 's' : ''}` : 'less than a day'}
                        (${timeSpentDisplay} active time)
                    </div>
                `;
            } else {
                const completedDateStr = window.DateFormatter ? 
                    DateFormatter.formatShortDate(completedDate) : 
                    completedDate.toLocaleDateString();
                
                completionInfo = `
                    <div class="text-xs text-gray-400 mt-2">
                        Completed on ${completedDateStr}
                    </div>
                `;
            }
        }
        
        // Assignee information (if assigned)
        let assigneeHtml = '';
        if (task.assignee) {
            assigneeHtml = `
                <div class="text-xs text-gray-400 mt-2">
                    Assigned to: ${task.assignee}
                </div>
            `;
        }
        
        // Badge for number of notes or comments
        let notesHtml = '';
        if (task.notes && task.notes.length > 0) {
            notesHtml = `
                <div class="absolute top-2 right-2 flex items-center">
                    <svg class="w-3 h-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                    </svg>
                    <span class="text-xs text-gray-400">${task.notes.length}</span>
                </div>
            `;
        }
        
        // Combine all elements
        return `
            <div class="relative">
                <h4 class="font-medium text-gray-100 mb-2 pr-8">${task.title}</h4>
                ${notesHtml}
            </div>
            <p class="text-sm text-gray-400 mb-2 line-clamp-2">${task.description || 'No description'}</p>
            <div class="flex justify-between items-center">
                <span class="px-2 py-1 rounded text-xs ${priorityColor} text-white">${priorityText}</span>
                ${dueDateHtml}
            </div>
            
            ${assigneeHtml}
            
            ${task.startedAt ? `
                <div class="text-xs text-gray-400 mt-2">
                    Started: ${window.DateFormatter ? DateFormatter.formatShortDate(task.startedAt) : new Date(task.startedAt).toLocaleDateString()}
                </div>
            ` : ''}
            
            ${completionInfo}
            ${timeTrackingHtml}
        `;
    }
    
    /**
     * Set up event listeners for the task card
     * @private
     * @param {HTMLElement} taskEl - Task card element
     * @param {Object} task - Task data
     * @param {Function} onClick - Click handler for the card
     */
    static _setupEventListeners(taskEl, task, onClick) {
        // Drag events
        taskEl.addEventListener('dragstart', (e) => {
            taskEl.classList.add('dragging');
            // Store the task ID in the drag data
            e.dataTransfer.setData('text/plain', task.id);
            e.dataTransfer.effectAllowed = 'move';
        });
        
        taskEl.addEventListener('dragend', () => {
            taskEl.classList.remove('dragging');
        });
        
        // Click event for the card (but not when clicking the timer button)
        taskEl.addEventListener('click', (e) => {
            // Don't trigger if clicking the time tracker button
            if (e.target.closest('.time-tracker-btn')) {
                return;
            }
            
            if (onClick && typeof onClick === 'function') {
                onClick(task);
            }
        });
        
        // Time tracker button click
        const timeTrackerBtn = taskEl.querySelector('.time-tracker-btn');
        if (timeTrackerBtn) {
            timeTrackerBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent task card click event
                
                if (window.StorageManager) {
                    StorageManager.toggleTimeTracking(task.id);
                }
                
                // Emit the event
                if (window.EventBus) {
                    EventBus.emit('task:toggleTimer', { taskId: task.id });
                }
            });
        }
    }
    
    /**
     * Calculate time spent on a task
     * @private
     * @param {Object} task - Task data
     * @returns {number} Time spent in milliseconds
     */
    static _calculateTimeSpent(task) {
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
     * Format time spent in a human-readable format
     * @private
     * @param {number} timeInMs - Time in milliseconds
     * @returns {string} Formatted time string (e.g. "2h 30m")
     */
    static _formatTimeSpent(timeInMs) {
        if (!timeInMs) return "0h 0m";
        
        const hours = Math.floor(timeInMs / (1000 * 60 * 60));
        const minutes = Math.floor((timeInMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }
    
    /**
     * Update a task card with new data
     * @param {HTMLElement} taskEl - Task card element
     * @param {Object} task - Updated task data
     */
    static update(taskEl, task) {
        if (!taskEl) return;
        
        // Update content
        taskEl.innerHTML = this._generateCardContent(task);
        
        // Re-attach event listeners
        this._setupEventListeners(taskEl, task, taskEl._onClick);
    }
}

// Make TaskCard available globally
window.TaskCard = TaskCard;