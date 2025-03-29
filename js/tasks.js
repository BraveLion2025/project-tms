/**
 * Tasks Manager for Project-TMS
 * Handles task operations and UI interactions
 */

const TasksManager = {
    currentTask: null,
    
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
        document.getElementById('newTaskBtn').addEventListener('click', () => {
            if (ProjectsManager.currentProject) {
                this.openTaskModal();
            }
        });
        
        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });
        
        // Cancel task button
        document.getElementById('cancelTaskBtn').addEventListener('click', () => {
            this.closeTaskModal();
        });
        
        // Close view task button
        document.getElementById('closeViewTaskBtn').addEventListener('click', () => {
            this.closeViewTaskModal();
        });
        
        // Edit task button in view mode
        document.getElementById('editTaskBtn').addEventListener('click', () => {
            if (this.currentTask) {
                this.closeViewTaskModal();
                this.openTaskModal(this.currentTask.id);
            }
        });
        
        // Status change in view task modal
        document.getElementById('viewTaskStatus').addEventListener('change', (e) => {
            if (this.currentTask) {
                this.updateTaskStatus(this.currentTask.id, e.target.value);
            }
        });
        
        // Add note button
        document.getElementById('addTaskNoteBtn').addEventListener('click', () => {
            if (this.currentTask) {
                this.addTaskNote();
            }
        });
        
        // Setup drag and drop
        this.setupDragAndDrop();
    },
    
    /**
     * Setup drag and drop functionality for tasks
     */
    setupDragAndDrop: function() {
        // This will be implemented for moving tasks between columns
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
        const tasks = StorageManager.getTasksByProject(projectId);
        
        // Clear all task containers
        document.getElementById('todoTasks').innerHTML = '';
        document.getElementById('inProgressTasks').innerHTML = '';
        document.getElementById('reviewTasks').innerHTML = '';
        document.getElementById('doneTasks').innerHTML = '';
        
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
        this.renderTasksList(tasksByStatus.todo, 'todoTasks');
        this.renderTasksList(tasksByStatus['in-progress'], 'inProgressTasks');
        this.renderTasksList(tasksByStatus.review, 'reviewTasks');
        this.renderTasksList(tasksByStatus.done, 'doneTasks');
        
        // Update project metrics after loading tasks
        if (ProjectsManager.currentProject) {
            ProjectsManager.updateProjectMetrics(ProjectsManager.currentProject.id);
        }
    },
    
    /**
     * Render a list of tasks in a container
     * @param {Array} tasks - Array of task objects
     * @param {String} containerId - ID of the container element
     */
    renderTasksList: function(tasks, containerId) {
        const container = document.getElementById(containerId);
        
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
                <div class="text-xs text-gray-400 mt-2">
                    Time spent: ${this.formatTimeSpent(task.timeTracking.totalTime)}
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
            
            // Determine new status based on container
            const container = taskEl.parentElement;
            let newStatus = 'todo';
            
            if (container.id === 'inProgressTasks') {
                newStatus = 'in-progress';
            } else if (container.id === 'reviewTasks') {
                newStatus = 'review';
            } else if (container.id === 'doneTasks') {
                newStatus = 'done';
            }
            
            // Update task status if changed
            if (task.status !== newStatus) {
                this.updateTaskStatus(task.id, newStatus);
            }
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
        const task = StorageManager.getTaskById(taskId);
        if (!task || task.status !== 'in-progress') return;
        
        // Initialize timeTracking object if it doesn't exist
        let timeTracking = task.timeTracking || {
            isActive: false,
            totalTime: 0,
            lastStarted: null
        };
        
        // Check if any other task is currently being tracked
        if (!timeTracking.isActive) {
            const tasks = StorageManager.getTasks();
            const activeTask = tasks.find(t => 
                t.id !== taskId && 
                t.timeTracking && 
                t.timeTracking.isActive
            );
            
            // Pause the other active task first
            if (activeTask) {
                this.toggleTimeTracking(activeTask.id);
            }
        }
        
        // Toggle tracking state
        if (timeTracking.isActive) {
            // Pause: calculate time spent and add to total
            const now = new Date();
            const lastStarted = new Date(timeTracking.lastStarted);
            const timeSpentThisSession = now - lastStarted;
            
            timeTracking.totalTime += timeSpentThisSession;
            timeTracking.isActive = false;
            timeTracking.lastStarted = null;
        } else {
            // Start: set as active and record start time
            timeTracking.isActive = true;
            timeTracking.lastStarted = new Date().toISOString();
            
            // If task hasn't been started before, record start date
            if (!task.startedAt) {
                task.startedAt = new Date().toISOString();
            }
        }
        
        // Update task with new timeTracking data
        const updatedTask = StorageManager.updateTask(taskId, {
            timeTracking: timeTracking,
            startedAt: task.startedAt
        });
        
        // Reload tasks to update UI
        if (updatedTask && ProjectsManager.currentProject) {
            this.loadTasks(ProjectsManager.currentProject.id);
            
            // Update project metrics
            ProjectsManager.updateProjectMetrics(ProjectsManager.currentProject.id);
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
        const timeTrackingSection = document.getElementById('taskTimeTrackingSection');
        const timeTrackingInfo = document.getElementById('taskTimeTrackingInfo');
        
        // Reset form
        form.reset();
        document.getElementById('taskId').value = '';
        
        // Hide time tracking section by default (for new tasks)
        timeTrackingSection.style.display = 'none';
        
        if (taskId) {
            // Edit mode
            const task = StorageManager.getTaskById(taskId);
            if (!task) return;
            
            titleEl.textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitleInput').value = task.title;
            document.getElementById('taskDescInput').value = task.description || '';
            document.getElementById('taskStatusInput').value = task.status;
            document.getElementById('taskPriorityInput').value = task.priority;
            document.getElementById('taskDueDateInput').value = task.dueDate || '';
            document.getElementById('taskNotesInput').value = task.notesText || '';
            
            // Show time tracking information if available
            if (task.timeTracking || task.startedAt || task.completedAt) {
                timeTrackingSection.style.display = 'block';
                
                let timeInfo = '';
                
                if (task.startedAt) {
                    timeInfo += `<div class="mb-1">Started: ${new Date(task.startedAt).toLocaleString()}</div>`;
                }
                
                if (task.completedAt) {
                    timeInfo += `<div class="mb-1">Completed: ${new Date(task.completedAt).toLocaleString()}</div>`;
                }
                
                if (task.timeTracking && task.timeTracking.totalTime > 0) {
                    const totalTime = this.calculateTimeSpent(task);
                    timeInfo += `<div>Time spent: ${this.formatTimeSpent(totalTime)}</div>`;
                    
                    if (task.timeTracking.isActive) {
                        timeInfo += `<div class="mt-2 text-green-400 font-semibold">Timer currently running</div>`;
                    }
                }
                
                timeTrackingInfo.innerHTML = timeInfo || 'No time tracking data yet';
            }
        } else {
            // New task mode
            titleEl.textContent = 'New Task';
            document.getElementById('taskStatusInput').value = 'todo';
            document.getElementById('taskPriorityInput').value = 'medium';
        }
        
        modal.style.display = 'flex';
    },
    
    /**
     * Close the task modal
     */
    closeTaskModal: function() {
        document.getElementById('taskModal').style.display = 'none';
    },
    
    /**
     * Open the view task modal
     * @param {String} taskId - Task ID
     */
    openViewTaskModal: function(taskId) {
        const task = StorageManager.getTaskById(taskId);
        if (!task) return;
        
        this.currentTask = task;
        
        // Update task details
        document.getElementById('viewTaskTitle').textContent = task.title;
        document.getElementById('viewTaskDesc').textContent = task.description || 'No description provided.';
        
        // Status dropdown
        document.getElementById('viewTaskStatus').value = task.status;
        
        // Priority and due date
        let priorityText = 'Low';
        if (task.priority === 'high') priorityText = 'High';
        else if (task.priority === 'medium') priorityText = 'Medium';
        
        document.getElementById('viewTaskPriority').textContent = priorityText;
        document.getElementById('viewTaskDueDate').textContent = 
            task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        
        // Update time tracking information
        this.updateTaskTimeInfo(task);
        
        // Update time tracking controls
        const timeControlsEl = document.getElementById('viewTaskTimeControls');
        timeControlsEl.innerHTML = '';
        
        if (task.status === 'in-progress') {
            const isActive = task.timeTracking && task.timeTracking.isActive;
            const buttonClass = isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
            const buttonText = isActive ? 'Pause Timer' : 'Start Timer';
            
            timeControlsEl.innerHTML = `
                <button id="viewTaskTimeToggle" class="flex items-center text-white px-3 py-2 rounded ${buttonClass}">
                    ${isActive ? 
                        '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>' : 
                        '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>'
                    }
                    ${buttonText}
                </button>
            `;
            
            // Add event listener for the timer toggle button
            setTimeout(() => {
                const timeToggleBtn = document.getElementById('viewTaskTimeToggle');
                if (timeToggleBtn) {
                    timeToggleBtn.addEventListener('click', () => {
                        this.toggleTimeTracking(task.id);
                        // Refresh the task modal with updated data
                        this.openViewTaskModal(task.id);
                    });
                }
            }, 0);
        }
        
        // Render notes
        this.renderTaskNotes(task.id);
        
        // Show modal
        document.getElementById('viewTaskModal').style.display = 'flex';
    },
    
    /**
     * Close the view task modal
     */
    closeViewTaskModal: function() {
        document.getElementById('viewTaskModal').style.display = 'none';
        this.currentTask = null;
    },
    
    /**
     * Render all notes for a task
     * @param {String} taskId - Task ID
     */
    renderTaskNotes: function(taskId) {
        const task = StorageManager.getTaskById(taskId);
        if (!task) return;
        
        const notesContainer = document.getElementById('viewTaskNotes');
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
            const noteDate = new Date(note.createdAt).toLocaleString();
            const noteEl = document.createElement('div');
            noteEl.className = 'border-b border-gray-600 pb-2 mb-2 last:border-none';
            noteEl.innerHTML = `
                <p class="text-gray-300">${note.text}</p>
                <p class="text-xs text-gray-500 mt-1">${noteDate}</p>
            `;
            notesContainer.appendChild(noteEl);
        });
    },
    
    /**
     * Add a note to a task
     */
    addTaskNote: function() {
        const noteInput = document.getElementById('newTaskNote');
        const noteText = noteInput.value.trim();
        
        if (!noteText || !this.currentTask) return;
        
        const updatedTask = StorageManager.addTaskNote(this.currentTask.id, noteText);
        
        if (updatedTask) {
            this.currentTask = updatedTask;
            this.renderTaskNotes(updatedTask.id);
            noteInput.value = '';
        }
    },
    
    /**
     * Save the task from form data
     */
    saveTask: function() {
        const form = document.getElementById('taskForm');
        const taskId = document.getElementById('taskId').value;
        const projectId = ProjectsManager.currentProject?.id;
        
        if (!projectId) {
            alert('No project selected');
            return;
        }
        
        const taskData = {
            title: document.getElementById('taskTitleInput').value,
            description: document.getElementById('taskDescInput').value,
            status: document.getElementById('taskStatusInput').value,
            priority: document.getElementById('taskPriorityInput').value,
            dueDate: document.getElementById('taskDueDateInput').value || null,
            notesText: document.getElementById('taskNotesInput').value,
            projectId: projectId
        };
        
        // Validation
        if (!taskData.title.trim()) {
            alert('Task title is required');
            return;
        }
        
        let savedTask;
        
        if (taskId) {
            // Update existing task
            savedTask = StorageManager.updateTask(taskId, taskData);
        } else {
            // Create new task
            savedTask = StorageManager.addTask(taskData);
        }
        
        if (savedTask) {
            this.closeTaskModal();
            this.loadTasks(projectId);
        }
    },
    
    /**
     * Update a task's status
     * @param {String} taskId - Task ID
     * @param {String} newStatus - New status value
     */
    updateTaskStatus: function(taskId, newStatus) {
        const task = StorageManager.getTaskById(taskId);
        if (!task) return;
        
        const updateData = { status: newStatus };
        
        // Handle status-specific actions
        if (newStatus === 'in-progress' && !task.startedAt) {
            // If moving to in-progress for the first time, record start time
            updateData.startedAt = new Date().toISOString();
        } else if (newStatus === 'done' && task.status !== 'done') {
            // If marking as done, record completion time
            updateData.completedAt = new Date().toISOString();
            
            // If task was being time tracked, stop the timer
            if (task.timeTracking && task.timeTracking.isActive) {
                // Calculate final time
                const now = new Date();
                const lastStarted = new Date(task.timeTracking.lastStarted);
                const timeSpentThisSession = now - lastStarted;
                
                updateData.timeTracking = {
                    ...task.timeTracking,
                    isActive: false,
                    totalTime: (task.timeTracking.totalTime || 0) + timeSpentThisSession,
                    lastStarted: null
                };
            }
        } else if (newStatus !== 'done' && task.status === 'done') {
            // If moving from done to another status, remove completion time
            updateData.completedAt = null;
        }
        
        const updatedTask = StorageManager.updateTask(taskId, updateData);
        
        if (updatedTask && ProjectsManager.currentProject) {
            // Reload all tasks to update the UI
            this.loadTasks(ProjectsManager.currentProject.id);
            
            // Update current task if in view mode
            if (this.currentTask && this.currentTask.id === taskId) {
                this.currentTask = updatedTask;
            }
            
            // Update project metrics
            ProjectsManager.updateProjectMetrics(ProjectsManager.currentProject.id);
        }
    },
    
    /**
     * Update View Task Modal with time tracking information
     * @param {Object} task - Task object
     */
    updateTaskTimeInfo: function(task) {
        const timeInfoEl = document.getElementById('viewTaskTimeInfo');
        if (!timeInfoEl) return;
        
        let timeHTML = '';
        
        if (task.startedAt) {
            timeHTML += `<div class="mb-1">Started: ${new Date(task.startedAt).toLocaleString()}</div>`;
        }
        
        if (task.status === 'done' && task.completedAt) {
            timeHTML += `<div class="mb-1">Completed: ${new Date(task.completedAt).toLocaleString()}</div>`;
            
            if (task.startedAt) {
                const startDate = new Date(task.startedAt);
                const endDate = new Date(task.completedAt);
                const durationDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
                
                timeHTML += `<div class="mb-1">Duration: ${durationDays} day${durationDays !== 1 ? 's' : ''}</div>`;
            }
        }
        
        if (task.timeTracking && task.timeTracking.totalTime > 0) {
            const totalTime = this.calculateTimeSpent(task);
            timeHTML += `<div>Time spent: ${this.formatTimeSpent(totalTime)}</div>`;
        }
        
        timeInfoEl.innerHTML = timeHTML || 'No time tracking data available';
    }
};