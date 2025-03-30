/**
 * Tasks Manager for Project-TMS
 * Handles task operations and UI interactions
 */

const TasksManager = {
    currentTask: null,
    currentProjectId: null,
    
    /**
     * Initialize tasks functionality
     */
    init: function() {
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners for task-related actions
     */
    setupEventListeners: function() {
        // New task button
        const newTaskBtn = document.getElementById('newTaskBtn');
        if (newTaskBtn) {
            newTaskBtn.addEventListener('click', () => {
                if (this.currentProjectId) {
                    this.openTaskModal();
                }
            });
        }
        
        // Task form submission
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }
        
        // Cancel task button
        const cancelTaskBtn = document.getElementById('cancelTaskBtn');
        if (cancelTaskBtn) {
            cancelTaskBtn.addEventListener('click', () => {
                this.closeTaskModal();
            });
        }
        
        // Close view task button
        const closeViewTaskBtn = document.getElementById('closeViewTaskBtn');
        if (closeViewTaskBtn) {
            closeViewTaskBtn.addEventListener('click', () => {
                this.closeViewTaskModal();
            });
        }
        
        // Edit task button in view mode
        const editTaskBtn = document.getElementById('editTaskBtn');
        if (editTaskBtn) {
            editTaskBtn.addEventListener('click', () => {
                if (this.currentTask) {
                    this.closeViewTaskModal();
                    this.openTaskModal(this.currentTask.id);
                }
            });
        }
        
        // Status change in view task modal
        const viewTaskStatus = document.getElementById('viewTaskStatus');
        if (viewTaskStatus) {
            viewTaskStatus.addEventListener('change', (e) => {
                if (this.currentTask) {
                    this.updateTaskStatus(this.currentTask.id, e.target.value);
                }
            });
        }
        
        // Add note button
        const addTaskNoteBtn = document.getElementById('addTaskNoteBtn');
        if (addTaskNoteBtn) {
            addTaskNoteBtn.addEventListener('click', () => {
                if (this.currentTask) {
                    this.addTaskNote();
                }
            });
        }
        
        // Setup drag and drop
        this.setupDragAndDrop();
    },
    
    /**
     * Setup drag and drop functionality for tasks
     */
    setupDragAndDrop: function() {
        // Get all tasks containers
        const containers = document.querySelectorAll('.tasks-container');
        
        // For now we'll use a simplified version with drag events
        containers.forEach(container => {
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(container, e.clientY);
                const draggable = document.querySelector('.dragging');
                if (draggable) {
                    if (afterElement) {
                        container.insertBefore(draggable, afterElement);
                    } else {
                        container.appendChild(draggable);
                    }
                }
            });
            
            container.addEventListener('drop', (e) => {
                e.preventDefault();
                const taskCard = document.querySelector('.dragging');
                if (!taskCard) return;
                
                const taskId = taskCard.dataset.taskId;
                if (!taskId) return;
                
                // Determine new status based on container
                let newStatus = 'todo';
                if (container.id === 'inProgressTasks') {
                    newStatus = 'in-progress';
                } else if (container.id === 'reviewTasks') {
                    newStatus = 'review';
                } else if (container.id === 'doneTasks') {
                    newStatus = 'done';
                }
                
                // Update task status
                this.updateTaskStatus(taskId, newStatus);
            });
        });
    },
    
    /**
     * Helper function for drag and drop to find element after current position
     */
    getDragAfterElement: function(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },
    
    /**
     * Load tasks for a project and update UI
     * @param {String} projectId - Project ID
     */
    loadTasks: function(projectId) {
        this.currentProjectId = projectId;
        const tasks = StorageManager.getTasksByProject(projectId);
        
        // Clear all task containers
        const todoTasks = document.getElementById('todoTasks');
        const inProgressTasks = document.getElementById('inProgressTasks');
        const reviewTasks = document.getElementById('reviewTasks');
        const doneTasks = document.getElementById('doneTasks');
        
        if (todoTasks) todoTasks.innerHTML = '';
        if (inProgressTasks) inProgressTasks.innerHTML = '';
        if (reviewTasks) reviewTasks.innerHTML = '';
        if (doneTasks) doneTasks.innerHTML = '';
        
        // Group tasks by status
        const tasksByStatus = {
            'todo': [],
            'in-progress': [],
            'review': [],
            'done': []
        };
        
        // Check if any task is currently being tracked
        let activeTaskExists = false;
        
        tasks.forEach(task => {
            if (task.timeTracking && task.timeTracking.isActive) {
                activeTaskExists = true;
            }
            
            if (tasksByStatus[task.status]) {
                tasksByStatus[task.status].push(task);
            } else {
                tasksByStatus.todo.push(task); // Default status if invalid
            }
        });
        
        // Sort tasks (active task on top for in-progress, then by priority)
        const sortTasks = (tasksArray) => {
            return tasksArray.sort((a, b) => {
                // If one task is active and the other is not, active comes first
                if (a.timeTracking?.isActive && !b.timeTracking?.isActive) return -1;
                if (!a.timeTracking?.isActive && b.timeTracking?.isActive) return 1;
                
                // Otherwise sort by priority
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
            });
        };
        
        // Sort in-progress tasks to put active task at the top
        tasksByStatus['in-progress'] = sortTasks(tasksByStatus['in-progress']);
        
        // Render tasks by status
        if (todoTasks) this.renderTasksList(tasksByStatus.todo, 'todoTasks');
        if (inProgressTasks) this.renderTasksList(tasksByStatus['in-progress'], 'inProgressTasks');
        if (reviewTasks) this.renderTasksList(tasksByStatus.review, 'reviewTasks');
        if (doneTasks) this.renderTasksList(tasksByStatus.done, 'doneTasks');
        
        // Update project metrics after loading tasks
        if (window.ProjectsManager && window.ProjectsManager.currentProject) {
            window.ProjectsManager.updateProjectMetrics(this.currentProjectId);
        }
        
        // Dispatch event for task count updates
        document.dispatchEvent(new CustomEvent('tasksUpdated'));
    },
    
    /**
     * Render a list of tasks in a container
     * @param {Array} tasks - Array of task objects
     * @param {String} containerId - ID of the container element
     */
    renderTasksList: function(tasks, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        tasks.forEach(task => {
            const taskEl = this.createTaskElement(task);
            container.appendChild(taskEl);
        });
    },
    
    /**
     * Create a task card element
     * @param {Object} task - Task object
     * @returns {HTMLElement} Task card element
     */
    createTaskElement: function(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card status-${task.status} bg-gray-700 rounded-md p-3 mb-3 cursor-pointer`;
        taskEl.draggable = true;
        taskEl.dataset.taskId = task.id;
        
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
        
        // Calculate time spent
        const timeSpent = this.calculateTimeSpent(task);
        const timeSpentDisplay = this.formatTimeSpent(timeSpent);
        
        // Create start/pause button for in-progress tasks
        let timeTrackingButton = '';
        if (task.status === 'in-progress') {
            const isActive = task.timeTracking && task.timeTracking.isActive;
            const buttonClass = isActive ? 
                'bg-red-600 hover:bg-red-700' : 
                'bg-green-600 hover:bg-green-700';
            const buttonText = isActive ? 'Pause' : 'Start';
            const buttonIcon = isActive ? 
                '<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>' : 
                '<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>';
                
            timeTrackingButton = `
                <button class="time-tracker-btn flex items-center text-xs text-white px-2 py-1 rounded ${buttonClass} mt-2" data-task-id="${task.id}">
                    ${buttonIcon}
                    ${buttonText}
                </button>
            `;
        }
        
        // Show completion time for done tasks
        let completionInfo = '';
        if (task.status === 'done' && task.completedAt) {
            const startedDate = task.startedAt ? new Date(task.startedAt) : null;
            const completedDate = new Date(task.completedAt);
            
            if (startedDate) {
                const duration = Math.floor((completedDate - startedDate) / (1000 * 60 * 60 * 24));
                completionInfo = `
                    <div class="text-xs text-gray-400 mt-2">
                        Completed in ${duration > 0 ? `${duration} day${duration !== 1 ? 's' : ''}` : 'less than a day'}
                        (${timeSpentDisplay} active time)
                    </div>
                `;
            } else {
                completionInfo = `
                    <div class="text-xs text-gray-400 mt-2">
                        Completed on ${completedDate.toLocaleDateString()}
                    </div>
                `;
            }
        }
        
        // Create the task card content
        taskEl.innerHTML = `
            <h4 class="font-medium text-gray-100 mb-2">${task.title}</h4>
            <p class="text-sm text-gray-400 mb-2 line-clamp-2">${task.description || 'No description'}</p>
            <div class="flex justify-between items-center">
                <span class="px-2 py-1 rounded text-xs ${priorityColor} text-white">${priorityText}</span>
                ${task.dueDate ? `<span class="text-xs text-gray-400">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
            </div>
            
            ${task.startedAt ? `
                <div class="text-xs text-gray-400 mt-2">
                    Started: ${new Date(task.startedAt).toLocaleDateString()}
                </div>
            ` : ''}
            
            ${task.status !== 'done' && task.timeTracking && task.timeTracking.totalTime > 0 ? `
                <div class="text-xs text-gray-400 mt-2 task-time-display">
                    Time: ${this.formatTimeSpent(task.timeTracking.totalTime)}
                </div>
            ` : ''}
            
            ${completionInfo}
            ${timeTrackingButton}
        `;
        
        // Setup drag events
        taskEl.addEventListener('dragstart', () => {
            taskEl.classList.add('dragging');
        });
        
        taskEl.addEventListener('dragend', () => {
            taskEl.classList.remove('dragging');
        });
        
        // Open task details on click (but not when clicking the timer button)
        taskEl.addEventListener('click', (e) => {
            // Don't open task when clicking the time tracker button
            if (e.target.closest('.time-tracker-btn')) {
                return;
            }
            this.openViewTaskModal(task.id);
        });
        
        // Add event listener for time tracker button
        const timeTrackerBtn = taskEl.querySelector('.time-tracker-btn');
        if (timeTrackerBtn) {
            timeTrackerBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent task card click event
                this.toggleTimeTracking(task.id);
            });
        }
        
        return taskEl;
    },
    
    /**
     * Calculate time spent on a task
     * @param {Object} task - Task object
     * @returns {Number} Time spent in milliseconds
     */
    calculateTimeSpent: function(task) {
        if (!task.timeTracking) return 0;
        
        let totalTime = task.timeTracking.totalTime || 0;
        
        // If timer is currently active, add the time since last start
        if (task.timeTracking.isActive && task.timeTracking.lastStarted) {
            const now = new Date();
            const lastStarted = new Date(task.timeTracking.lastStarted);
            totalTime += (now - lastStarted);
        }
        
        return totalTime;
    },
    
    /**
     * Format time spent in a human-readable format
     * @param {Number} timeInMs - Time in milliseconds
     * @returns {String} Formatted time string (e.g. "2h 30m")
     */
    formatTimeSpent: function(timeInMs) {
        if (!timeInMs) return "0h 0m";
        
        const hours = Math.floor(timeInMs / (1000 * 60 * 60));
        const minutes = Math.floor((timeInMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    },
    
    /**
     * Toggle time tracking for a task
     * @param {String} taskId - Task ID
     */
    toggleTimeTracking: function(taskId) {
        const updatedTask = StorageManager.toggleTimeTracking(taskId);
        
        if (updatedTask && this.currentProjectId) {
            // Reload all tasks to update the UI
            this.loadTasks(this.currentProjectId);
            
            // Update current task if in view mode
            if (this.currentTask && this.currentTask.id === taskId) {
                this.currentTask = updatedTask;
                
                // Update view task modal if it's open
                const viewTaskModal = document.getElementById('viewTaskModal');
                if (viewTaskModal && viewTaskModal.classList.contains('active')) {
                    this.openViewTaskModal(taskId);
                }
            }
            
            // Update project metrics
            if (window.ProjectsManager) {
                window.ProjectsManager.updateProjectMetrics(this.currentProjectId);
            }
        }
    },
    
    /**
     * Open the task modal for creating or editing a task
     * @param {String|null} taskId - Task ID for editing, null for new task
     */
    openTaskModal: function(taskId = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const titleEl = document.getElementById('taskModalTitle');
        const taskIdField = document.getElementById('taskId');
        const timeTrackingSection = document.getElementById('taskTimeTrackingSection');
        const timeTrackingInfo = document.getElementById('taskTimeTrackingInfo');
        
        if (!modal || !form) return;
        
        // Reset form
        form.reset();
        if (taskIdField) taskIdField.value = '';
        
        // Hide time tracking section by default (for new tasks)
        if (timeTrackingSection) timeTrackingSection.style.display = 'none';
        
        if (taskId) {
            // Edit mode
            const task = StorageManager.getTaskById(taskId);
            if (!task) return;
            
            if (titleEl) titleEl.textContent = 'Edit Task';
            if (taskIdField) taskIdField.value = task.id;
            
            // Populate form fields
            const fields = {
                'taskTitleInput': task.title,
                'taskDescInput': task.description || '',
                'taskStatusInput': task.status,
                'taskPriorityInput': task.priority,
                'taskDueDateInput': task.dueDate || '',
                'taskNotesInput': task.notesText || ''
            };
            
            // Set form values
            Object.keys(fields).forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = fields[id];
            });
            
            // Show time tracking information if available
            if ((task.timeTracking || task.startedAt || task.completedAt) && timeTrackingSection && timeTrackingInfo) {
                timeTrackingSection.style.display = 'block';
                
                let timeInfo = '';
                
                if (task.startedAt) {
                    timeInfo += `<div class="mb-1">Started: ${new Date(task.startedAt).toLocaleString()}</div>`;
                }
                
                if (task.status === 'done' && task.completedAt) {
                    timeInfo += `<div class="mb-1">Completed: ${new Date(task.completedAt).toLocaleString()}</div>`;
                    
                    if (task.startedAt) {
                        const startDate = new Date(task.startedAt);
                        const endDate = new Date(task.completedAt);
                        const durationDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
                        
                        timeInfo += `<div class="mb-1">Duration: ${durationDays} day${durationDays !== 1 ? 's' : ''}</div>`;
                    }
                }
                
                if (task.timeTracking && task.timeTracking.totalTime > 0) {
                    const totalTime = this.calculateTimeSpent(task);
                    timeInfo += `<div class="time-spent-value">Time spent: ${this.formatTimeSpent(totalTime)}</div>`;
                    
                    if (task.timeTracking.isActive) {
                        timeInfo += `<div class="mt-2 text-green-400 font-semibold">Timer currently running</div>`;
                    }
                }
                
                timeTrackingInfo.innerHTML = timeInfo || 'No time tracking data available';
            }
        } else {
            // New task mode
            if (titleEl) titleEl.textContent = 'New Task';
        }
        
        // Show modal
        modal.style.display = 'flex';
    },
    
    /**
     * Close the task modal
     */
    closeTaskModal: function() {
        const modal = document.getElementById('taskModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * Open the view task modal
     * @param {String} taskId - Task ID
     */
    openViewTaskModal: function(taskId) {
        // Implementation of openViewTaskModal method
    },
    
    /**
     * Close the view task modal
     */
    closeViewTaskModal: function() {
        // Implementation of closeViewTaskModal method
    },
    
    /**
     * Add a note to a task
     */
    addTaskNote: function() {
        // Implementation of addTaskNote method
    },
    
    /**
     * Update task status
     * @param {String} taskId - Task ID
     * @param {String} newStatus - New status for the task
     */
    updateTaskStatus: function(taskId, newStatus) {
        // Implementation of updateTaskStatus method
    }
}