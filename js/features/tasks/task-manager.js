/**
 * Task Manager Component for Project-TMS
 * Handles task operations and kanban board functionality
 */
class TaskManager {
    constructor() {
        this.currentProjectId = null;
        this.currentTask = null;
        this.taskContainers = [];
        this.init();
    }

    /**
     * Initialize the task manager
     */
    init() {
        this._findTaskContainers();
        this._setupEventListeners();
        
        // Subscribe to events
        if (window.EventBus) {
            EventBus.subscribe('project:selected', data => {
                this.setCurrentProject(data.projectId);
            });
            
            EventBus.subscribe('task:created', task => {
                this.refreshTasks();
            });
            
            EventBus.subscribe('task:updated', task => {
                this.refreshTasks();
            });
            
            EventBus.subscribe('task:deleted', data => {
                this.refreshTasks();
            });
            
            EventBus.subscribe('task:toggleTimer', data => {
                this.refreshTasks();
            });
            
            EventBus.subscribe('timeTracking:started', data => {
                this.refreshTimeDisplay(data.taskId);
            });
            
            EventBus.subscribe('timeTracking:stopped', data => {
                this.refreshTimeDisplay(data.taskId);
            });
        }
    }

    /**
     * Find task containers in the DOM
     * @private
     */
    _findTaskContainers() {
        // Get all task containers
        this.taskContainers = [
            document.getElementById('todoTasks'),
            document.getElementById('inProgressTasks'),
            document.getElementById('reviewTasks'),
            document.getElementById('doneTasks')
        ].filter(container => container !== null);
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // New Task button
        const newTaskBtn = document.getElementById('newTaskBtn');
        if (newTaskBtn) {
            newTaskBtn.addEventListener('click', () => {
                if (this.currentProjectId) {
                    this.openTaskModal();
                } else {
                    // Notify user to select a project first
                    if (window.NotificationManager) {
                        NotificationManager.warning('Please select a project first');
                    } else {
                        alert('Please select a project first');
                    }
                }
            });
        }
        
        // Task form
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
        
        // Close task modal button
        const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');
        if (closeTaskModalBtn) {
            closeTaskModalBtn.addEventListener('click', () => {
                this.closeTaskModal();
            });
        }
        
        // Kanban container drag and drop
        this._setupDragAndDrop();
    }

    /**
     * Setup drag and drop functionality for tasks
     * @private
     */
    _setupDragAndDrop() {
        // Setup each container for drag and drop
        this.taskContainers.forEach(container => {
            if (!container) return;
            
            // Allow dropping 
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this._getDragAfterElement(container, e.clientY);
                const draggable = document.querySelector('.dragging');
                
                if (draggable) {
                    if (afterElement) {
                        container.insertBefore(draggable, afterElement);
                    } else {
                        container.appendChild(draggable);
                    }
                }
            });
            
            // Handle drop event
            container.addEventListener('drop', (e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain');
                
                if (!taskId) return;
                
                // Determine new status based on container
                let newStatus;
                switch (container.id) {
                    case 'todoTasks':
                        newStatus = 'todo';
                        break;
                    case 'inProgressTasks':
                        newStatus = 'in-progress';
                        break;
                    case 'reviewTasks':
                        newStatus = 'review';
                        break;
                    case 'doneTasks':
                        newStatus = 'done';
                        break;
                    default:
                        return; // Invalid container
                }
                
                // Update task status
                this.updateTaskStatus(taskId, newStatus);
            });
        });
    }

    /**
     * Helper function to determine where to insert dragged element
     * @private
     * @param {HTMLElement} container - Container element
     * @param {number} y - Mouse Y position
     * @returns {HTMLElement|null} Element to insert before, or null for append
     */
    _getDragAfterElement(container, y) {
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
    }

    /**
     * Set current project and load tasks
     * @param {string} projectId - Project ID
     */
    setCurrentProject(projectId) {
        this.currentProjectId = projectId;
        this.loadTasks(projectId);
    }

    /**
     * Load tasks for a project
     * @param {string} projectId - Project ID
     */
    loadTasks(projectId) {
        if (!projectId || !window.StorageManager) return;
        
        const tasks = StorageManager.getTasksByProject(projectId);
        
        // Clear all task containers
        this.taskContainers.forEach(container => {
            if (container) container.innerHTML = '';
        });
        
        // Group tasks by status
        const tasksByStatus = {
            'todo': [],
            'in-progress': [],
            'review': [],
            'done': []
        };
        
        // Separate tasks by status
        tasks.forEach(task => {
            if (tasksByStatus[task.status]) {
                tasksByStatus[task.status].push(task);
            } else {
                tasksByStatus.todo.push(task); // Default for invalid status
            }
        });
        
        // Sort tasks by priority and other factors
        const sortTasks = tasksArray => {
            return tasksArray.sort((a, b) => {
                // Active timer tasks first (for in-progress)
                if (a.timeTracking?.isActive && !b.timeTracking?.isActive) return -1;
                if (!a.timeTracking?.isActive && b.timeTracking?.isActive) return 1;
                
                // Then by priority
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const priorityDiff = (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
                if (priorityDiff !== 0) return priorityDiff;
                
                // Then by due date (earlier dates first)
                if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate) - new Date(b.dueDate);
                }
                
                // Due dates first over undefined due dates
                if (a.dueDate && !b.dueDate) return -1;
                if (!a.dueDate && b.dueDate) return 1;
                
                // Finally by creation date (newer first)
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        };
        
        // Sort and render tasks
        Object.keys(tasksByStatus).forEach(status => {
            const container = this._getContainerByStatus(status);
            if (!container) return;
            
            const sortedTasks = sortTasks(tasksByStatus[status]);
            
            sortedTasks.forEach(task => {
                // Create task card
                if (window.TaskCard) {
                    const taskEl = TaskCard.create(task, taskData => {
                        this.openViewTaskModal(taskData.id);
                    });
                    container.appendChild(taskEl);
                }
            });
        });
        
        // Update task counts
        this._updateTaskCounts(tasks);
        
        // Dispatch event
        if (window.EventBus) {
            EventBus.emit('tasks:loaded', { 
                projectId, 
                taskCounts: {
                    todo: tasksByStatus.todo.length,
                    inProgress: tasksByStatus['in-progress'].length,
                    review: tasksByStatus.review.length,
                    done: tasksByStatus.done.length,
                    total: tasks.length
                }
            });
        }
    }

    /**
     * Refresh tasks without changing the project
     */
    refreshTasks() {
        if (this.currentProjectId) {
            this.loadTasks(this.currentProjectId);
        }
    }
    
    /**
     * Get the container element for a task status
     * @private
     * @param {string} status - Task status
     * @returns {HTMLElement|null} Container element
     */
    _getContainerByStatus(status) {
        switch (status) {
            case 'todo':
                return document.getElementById('todoTasks');
            case 'in-progress':
                return document.getElementById('inProgressTasks');
            case 'review':
                return document.getElementById('reviewTasks');
            case 'done':
                return document.getElementById('doneTasks');
            default:
                return null;
        }
    }
    
    /**
     * Update task count badges
     * @private
     * @param {Array} tasks - Array of tasks
     */
    _updateTaskCounts(tasks) {
        // Count tasks by status
        const counts = {
            todo: tasks.filter(t => t.status === 'todo').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            review: tasks.filter(t => t.status === 'review').length,
            done: tasks.filter(t => t.status === 'done').length
        };
        
        // Update count badges
        const todoCountBadge = document.getElementById('todoCountBadge');
        const inProgressCountBadge = document.getElementById('inProgressCountBadge');
        const reviewCountBadge = document.getElementById('reviewCountBadge');
        const doneCountBadge = document.getElementById('doneCountBadge');
        
        if (todoCountBadge) todoCountBadge.textContent = counts.todo;
        if (inProgressCountBadge) inProgressCountBadge.textContent = counts.inProgress;
        if (reviewCountBadge) reviewCountBadge.textContent = counts.review;
        if (doneCountBadge) doneCountBadge.textContent = counts.done;
        
        // Also update project view task counts if they exist
        const todoCount = document.getElementById('todoCount');
        const inProgressCount = document.getElementById('inProgressCount');
        const reviewCount = document.getElementById('reviewCount');
        const doneCount = document.getElementById('doneCount');
        
        if (todoCount) todoCount.textContent = counts.todo;
        if (inProgressCount) inProgressCount.textContent = counts.inProgress;
        if (reviewCount) reviewCount.textContent = counts.review;
        if (doneCount) doneCount.textContent = counts.done;
    }
    
    /**
     * Refresh time display for a specific task
     * @param {string} taskId - Task ID
     */
    refreshTimeDisplay(taskId) {
        if (!taskId || !window.StorageManager) return;
        
        const task = StorageManager.getTaskById(taskId);
        if (!task) return;
        
        // Find all instances of this task in the UI
        const taskElements = document.querySelectorAll(`.task-card[data-task-id="${taskId}"]`);
        
        taskElements.forEach(taskEl => {
            if (window.TaskCard) {
                TaskCard.update(taskEl, task);
            }
        });
    }
    
    /**
     * Open task modal for creating or editing a task
     * @param {string} [taskId=null] - Task ID for editing, null for new task
     */
    openTaskModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const modalTitle = document.getElementById('taskModalTitle');
        const idField = document.getElementById('taskId');
        
        if (!modal || !form) return;
        
        // Reset form
        form.reset();
        if (idField) idField.value = '';
        
        if (taskId) {
            // Edit existing task
            const task = StorageManager.getTaskById(taskId);
            if (!task) return;
            
            if (modalTitle) modalTitle.textContent = 'Edit Task';
            if (idField) idField.value = task.id;
            
            // Set form fields
            this._setFormValues(form, task);
        } else {
            // New task
            if (modalTitle) modalTitle.textContent = 'New Task';
            
            // Set default status and priority
            const statusInput = document.getElementById('taskStatusInput');
            const priorityInput = document.getElementById('taskPriorityInput');
            
            if (statusInput) statusInput.value = 'todo';
            if (priorityInput) priorityInput.value = 'medium';
        }
        
        // Show modal
        modal.classList.add('active');
    }
    
    /**
     * Set form field values from task data
     * @private
     * @param {HTMLFormElement} form - Form element
     * @param {Object} task - Task data
     */
    _setFormValues(form, task) {
        // Map of field IDs to task properties
        const fieldMap = {
            'taskTitleInput': 'title',
            'taskDescInput': 'description',
            'taskStatusInput': 'status',
            'taskPriorityInput': 'priority',
            'taskDueDateInput': 'dueDate',
            'taskAssigneeInput': 'assignee',
        };
        
        // Set form values
        Object.keys(fieldMap).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && task[fieldMap[fieldId]] !== undefined) {
                field.value = task[fieldMap[fieldId]] || '';
            }
        });
        
        // Handle time tracking section display
        const timeTrackingSection = document.getElementById('taskTimeTrackingSection');
        const timeTrackingInfo = document.getElementById('taskTimeTrackingInfo');
        
        if (timeTrackingSection && timeTrackingInfo) {
            if (task.timeTracking || task.startedAt || task.completedAt) {
                timeTrackingSection.style.display = 'block';
                
                let timeInfoHtml = '';
                
                if (task.startedAt) {
                    const startedDate = window.DateFormatter ? 
                        DateFormatter.formatDateTime(task.startedAt) : 
                        new Date(task.startedAt).toLocaleString();
                    
                    timeInfoHtml += `<div class="mb-1">Started: ${startedDate}</div>`;
                }
                
                if (task.completedAt) {
                    const completedDate = window.DateFormatter ? 
                        DateFormatter.formatDateTime(task.completedAt) : 
                        new Date(task.completedAt).toLocaleString();
                    
                    timeInfoHtml += `<div class="mb-1">Completed: ${completedDate}</div>`;
                }
                
                if (task.timeTracking && task.timeTracking.totalTime > 0) {
                    const timeSpent = window.DateFormatter ? 
                        DateFormatter.formatDuration(task.timeTracking.totalTime) : 
                        this._formatDuration(task.timeTracking.totalTime);
                    
                    timeInfoHtml += `<div class="mb-1">Time spent: ${timeSpent}</div>`;
                    
                    if (task.timeTracking.isActive) {
                        timeInfoHtml += `<div class="text-green-500">Timer currently running</div>`;
                    }
                }
                
                timeTrackingInfo.innerHTML = timeInfoHtml || 'No time tracking data available';
            } else {
                timeTrackingSection.style.display = 'none';
            }
        }
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
     * Close task modal
     */
    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) modal.classList.remove('active');
    }
    
    /**
     * Save task from form data
     */
    saveTask() {
        if (!this.currentProjectId || !window.StorageManager) return;
        
        const form = document.getElementById('taskForm');
        const taskId = document.getElementById('taskId')?.value;
        
        if (!form) return;
        
        // Get form data
        const taskData = {
            title: document.getElementById('taskTitleInput')?.value,
            description: document.getElementById('taskDescInput')?.value,
            status: document.getElementById('taskStatusInput')?.value,
            priority: document.getElementById('taskPriorityInput')?.value,
            dueDate: document.getElementById('taskDueDateInput')?.value || null,
            projectId: this.currentProjectId,
            assignee: document.getElementById('taskAssigneeInput')?.value || null
        };
        
        // Validation
        if (!taskData.title || taskData.title.trim() === '') {
            if (window.NotificationManager) {
                NotificationManager.error('Task title is required');
            } else {
                alert('Task title is required');
            }
            return;
        }
        
        let result;
        
        if (taskId) {
            // Update existing task
            result = StorageManager.updateTask(taskId, taskData);
        } else {
            // Create new task
            result = StorageManager.addTask(taskData);
        }
        
        if (result) {
            this.closeTaskModal();
            this.refreshTasks();
            
            // Show notification
            if (window.NotificationManager) {
                NotificationManager.success(
                    taskId ? 'Task updated successfully' : 'Task created successfully'
                );
            }
        } else {
            // Show error
            if (window.NotificationManager) {
                NotificationManager.error('Failed to save task');
            } else {
                alert('Failed to save task');
            }
        }
    }
    
    /**
     * Open the task view modal
     * @param {string} taskId - Task ID
     */
    openViewTaskModal(taskId) {
        if (!taskId || !window.StorageManager) return;
        
        const task = StorageManager.getTaskById(taskId);
        if (!task) return;
        
        this.currentTask = task;
        
        const modal = document.getElementById('viewTaskModal');
        if (!modal) return;
        
        // Update modal content
        const title = document.getElementById('viewTaskTitle');
        const desc = document.getElementById('viewTaskDesc');
        const status = document.getElementById('viewTaskStatus');
        const priority = document.getElementById('viewTaskPriority');
        const dueDate = document.getElementById('viewTaskDueDate');
        const assignee = document.getElementById('viewTaskAssignee');
        const timeInfo = document.getElementById('viewTaskTimeInfo');
        
        if (title) title.textContent = task.title;
        if (desc) desc.textContent = task.description || 'No description provided';
        if (status) status.value = task.status;
        
        // Set priority
        let priorityText = 'Low';
        if (task.priority === 'high') priorityText = 'High';
        else if (task.priority === 'medium') priorityText = 'Medium';
        
        if (priority) priority.textContent = priorityText;
        
        // Set due date
        if (dueDate) {
            if (task.dueDate) {
                let dueDateText;
                let dueDateClass = '';
                
                if (window.DateFormatter) {
                    dueDateText = DateFormatter.formatShortDate(task.dueDate);
                    
                    if (DateFormatter.isOverdue(task.dueDate)) {
                        dueDateClass = 'text-red-500';
                    } else if (DateFormatter.isApproaching(task.dueDate, 2)) {
                        dueDateClass = 'text-yellow-500';
                    }
                } else {
                    dueDateText = new Date(task.dueDate).toLocaleDateString();
                }
                
                dueDate.textContent = dueDateText;
                dueDate.className = dueDateClass;
            } else {
                dueDate.textContent = 'No due date';
                dueDate.className = '';
            }
        }
        
        // Set assignee
        if (assignee) {
            assignee.textContent = task.assignee || 'Unassigned';
        }
        
        // Update time tracking info
        if (timeInfo) {
            let timeInfoHtml = '';
            
            if (task.startedAt) {
                const startedDate = window.DateFormatter ? 
                    DateFormatter.formatDateTime(task.startedAt) : 
                    new Date(task.startedAt).toLocaleString();
                
                timeInfoHtml += `<div class="mb-1">Started: ${startedDate}</div>`;
            }
            
            if (task.completedAt) {
                const completedDate = window.DateFormatter ? 
                    DateFormatter.formatDateTime(task.completedAt) : 
                    new Date(task.completedAt).toLocaleString();
                
                timeInfoHtml += `<div class="mb-1">Completed: ${completedDate}</div>`;
                
                if (task.startedAt) {
                    const startDate = new Date(task.startedAt);
                    const endDate = new Date(task.completedAt);
                    const durationDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
                    
                    timeInfoHtml += `<div class="mb-1">Duration: ${durationDays} day${durationDays !== 1 ? 's' : ''}</div>`;
                }
            }
            
            if (task.timeTracking && task.timeTracking.totalTime > 0) {
                const timeSpent = task.timeTracking.totalTime;
                const timeSpentFormatted = window.DateFormatter ? 
                    DateFormatter.formatDuration(timeSpent) : 
                    this._formatDuration(timeSpent);
                
                timeInfoHtml += `<div class="time-spent-value">Time spent: ${timeSpentFormatted}</div>`;
            }
            
            timeInfo.innerHTML = timeInfoHtml || 'No time tracking data available';
        }
        
        // Setup time tracking controls
        this._setupTimeTrackingControls(task);
        
        // Render task notes
        this._renderTaskNotes(task);
        
        // Show modal
        modal.classList.add('active');
        
        // Set up event listeners
        this._setupViewTaskModalEvents(task);
    }
    
    /**
     * Setup time tracking controls in the view task modal
     * @private
     * @param {Object} task - Task data
     */
    _setupTimeTrackingControls(task) {
        const timeControls = document.getElementById('viewTaskTimeControls');
        if (!timeControls) return;
        
        timeControls.innerHTML = '';
        
        // Only show time controls for in-progress tasks
        if (task.status === 'in-progress') {
            const isActive = task.timeTracking && task.timeTracking.isActive;
            const buttonClass = isActive ? 
                'bg-red-600 hover:bg-red-700' : 
                'bg-green-600 hover:bg-green-700';
            const buttonText = isActive ? 'Stop Timer' : 'Start Timer';
            const buttonIcon = isActive ? 
                '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : 
                '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
            
            timeControls.innerHTML = `
                <button id="toggleTimerBtn" class="flex items-center mt-2 px-3 py-2 ${buttonClass} text-white rounded-md">
                    ${buttonIcon}
                    ${buttonText}
                </button>
            `;
            
            // Add event listener
            const toggleTimerBtn = document.getElementById('toggleTimerBtn');
            if (toggleTimerBtn) {
                toggleTimerBtn.addEventListener('click', () => {
                    if (window.StorageManager) {
                        StorageManager.toggleTimeTracking(task.id);
                        
                        // Refresh the modal
                        this.openViewTaskModal(task.id);
                    }
                });
            }
        }
    }
    
    /**
     * Render task notes in the view modal
     * @private
     * @param {Object} task - Task data
     */
    _renderTaskNotes(task) {
        const notesContainer = document.getElementById('viewTaskNotes');
        if (!notesContainer) return;
        
        notesContainer.innerHTML = '';
        
        if (!task.notes || task.notes.length === 0) {
            notesContainer.innerHTML = '<p class="text-gray-500">No notes yet.</p>';
            return;
        }
        
        // Sort notes by date (newest first)
        const sortedNotes = [...task.notes].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        sortedNotes.forEach(note => {
            const noteDate = window.DateFormatter ? 
                DateFormatter.formatDateTime(note.createdAt) : 
                new Date(note.createdAt).toLocaleString();
            
            const noteEl = document.createElement('div');
            noteEl.className = 'border-b border-gray-600 pb-2 mb-2 last:border-none';
            noteEl.innerHTML = `
                <p class="text-gray-300">${note.text}</p>
                <p class="text-xs text-gray-500 mt-1">${noteDate}</p>
            `;
            notesContainer.appendChild(noteEl);
        });
    }
    
    /**
     * Set up event listeners for the view task modal
     * @private
     * @param {Object} task - Task data
     */
    _setupViewTaskModalEvents(task) {
        // Close button
        const closeBtn = document.getElementById('closeViewTaskBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeViewTaskModal();
            });
        }
        
        // Edit button
        const editBtn = document.getElementById('editTaskBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.closeViewTaskModal();
                this.openTaskModal(task.id);
            });
        }
        
        // Status change
        const statusSelect = document.getElementById('viewTaskStatus');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                this.updateTaskStatus(task.id, e.target.value);
            });
        }
        
        // Add note button
        const addNoteBtn = document.getElementById('addTaskNoteBtn');
        const noteInput = document.getElementById('newTaskNote');
        
        if (addNoteBtn && noteInput) {
            addNoteBtn.addEventListener('click', () => {
                this.addTaskNote(task.id, noteInput.value);
            });
            
            // Add note on Enter key (but allow Shift+Enter for new lines)
            noteInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.addTaskNote(task.id, noteInput.value);
                }
            });
        }
    }
    
    /**
     * Close the view task modal
     */
    closeViewTaskModal() {
        const modal = document.getElementById('viewTaskModal');
        if (modal) modal.classList.remove('active');
        this.currentTask = null;
    }
    
    /**
     * Update task status
     * @param {string} taskId - Task ID
     * @param {string} newStatus - New status value
     */
    updateTaskStatus(taskId, newStatus) {
        if (!taskId || !window.StorageManager) return;
        
        const task = StorageManager.getTaskById(taskId);
        if (!task) return;
        
        // Skip if status hasn't changed
        if (task.status === newStatus) return;
        
        const updates = { status: newStatus };
        
        // Status-specific actions
        if (newStatus === 'in-progress' && !task.startedAt) {
            // Record start time when moving to in-progress for the first time
            updates.startedAt = new Date().toISOString();
        } else if (newStatus === 'done' && task.status !== 'done') {
            // Record completion time when marking as done
            updates.completedAt = new Date().toISOString();
            
            // Stop timer if active
            if (task.timeTracking && task.timeTracking.isActive) {
                StorageManager.toggleTimeTracking(taskId);
            }
        } else if (newStatus !== 'done' && task.status === 'done') {
            // Clear completion time when moving from done to another status
            updates.completedAt = null;
        }
        
        // Update task
        const updatedTask = StorageManager.updateTask(taskId, updates);
        
        if (updatedTask) {
            // Refresh tasks display
            this.refreshTasks();
            
            // Update view modal if it's open
            if (this.currentTask && this.currentTask.id === taskId) {
                this.openViewTaskModal(taskId);
            }
            
            // Show notification
            if (window.NotificationManager) {
                NotificationManager.success(`Task moved to ${this._getStatusLabel(newStatus)}`);
            }
        }
    }
    
    /**
     * Get user-friendly status label
     * @private
     * @param {string} status - Status value
     * @returns {string} Status label
     */
    _getStatusLabel(status) {
        switch (status) {
            case 'todo': return 'To Do';
            case 'in-progress': return 'In Progress';
            case 'review': return 'Review';
            case 'done': return 'Done';
            default: return status;
        }
    }
    
    /**
     * Add a note to a task
     * @param {string} taskId - Task ID
     * @param {string} noteText - Note text
     */
    addTaskNote(taskId, noteText) {
        if (!taskId || !noteText || !window.StorageManager) return;
        
        // Trim note text
        noteText = noteText.trim();
        
        if (noteText === '') {
            if (window.NotificationManager) {
                NotificationManager.warning('Note cannot be empty');
            }
            return;
        }
        
        // Add the note
        const updatedTask = StorageManager.addTaskNote(taskId, noteText);
        
        if (updatedTask) {
            // Clear note input
            const noteInput = document.getElementById('newTaskNote');
            if (noteInput) noteInput.value = '';
            
            // Update task and refresh notes section
            this.currentTask = updatedTask;
            this._renderTaskNotes(updatedTask);
            
            // Show success message
            if (window.NotificationManager) {
                NotificationManager.success('Note added');
            }
        }
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global TaskManager instance
    window.taskManager = new TaskManager();
});