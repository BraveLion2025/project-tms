/**
 * Task Manager for Project-TMS
 * Handles all task-related operations and UI updates
 */
class TaskManager {
    constructor() {
        this.tasks = StorageManager.getTasks();
        this.currentProjectId = null;
        this.init();
    }

    init() {
        this.initEventListeners();
        this.updateTaskList();
    }

    initEventListeners() {
        // New Task Button
        const newTaskBtn = document.getElementById('newTaskBtn');
        if (newTaskBtn) {
            newTaskBtn.addEventListener('click', () => this.openTaskModal());
        }

        // Task Form
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleTaskSubmit(e));
        }

        // Task Status Changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-status-select')) {
                this.handleTaskStatusChange(e.target);
            }
        });

        // Task Priority Changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-priority-select')) {
                this.handleTaskPriorityChange(e.target);
            }
        });

        // Task File Upload
        const taskFileInput = document.getElementById('taskFileInput');
        if (taskFileInput) {
            taskFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Task Note Form
        const taskNoteForm = document.getElementById('taskNoteForm');
        if (taskNoteForm) {
            taskNoteForm.addEventListener('submit', (e) => this.handleNoteSubmit(e));
        }
    }

    setCurrentProject(projectId) {
        this.currentProjectId = projectId;
        this.updateTaskList();
    }

    updateTaskList() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        const projectTasks = this.tasks.filter(task => task.projectId === this.currentProjectId);
        taskList.innerHTML = '';

        projectTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card status-${task.status} glass-effect rounded-lg p-4 mb-3 cursor-pointer transition-all duration-300 hover:translate-y-[-4px]`;
        taskEl.draggable = true;
        taskEl.dataset.taskId = task.id;
        
        // Priority classes
        let priorityColor = 'bg-gray-400 text-white';
        let priorityText = 'Low';
        
        if (task.priority === 'high') {
            priorityColor = 'bg-danger-color text-white';
            priorityText = 'High';
        } else if (task.priority === 'medium') {
            priorityColor = 'bg-warning-color text-white';
            priorityText = 'Medium';
        }
        
        // Calculate time spent
        const timeSpent = this.calculateTimeSpent(task);
        const timeSpentDisplay = this.formatTimeSpent(timeSpent);
        
        // Is task overdue?
        let dueDateClass = '';
        let dueDateIcon = '';
        if (task.dueDate) {
            const today = new Date();
            const dueDate = new Date(task.dueDate);
            
            if (task.status !== 'done' && dueDate < today) {
                dueDateClass = 'text-danger-color';
                dueDateIcon = '<i class="fas fa-exclamation-circle mr-1"></i>';
            } else if (task.status !== 'done' && 
                      dueDate.getTime() - today.getTime() < 2 * 24 * 60 * 60 * 1000) { // 2 days
                dueDateClass = 'text-warning-color';
                dueDateIcon = '<i class="fas fa-clock mr-1"></i>';
            }
        }
        
        // Create time tracking button for in-progress tasks
        let timeTrackingButton = '';
        if (task.status === 'in-progress') {
            const isActive = task.timeTracking && task.timeTracking.isActive;
            const buttonClasses = isActive 
                ? 'bg-danger-color hover:bg-red-700' 
                : 'bg-success-color hover:bg-green-700';
            const buttonIcon = isActive 
                ? '<i class="fas fa-pause mr-1"></i>' 
                : '<i class="fas fa-play mr-1"></i>';
            const buttonText = isActive ? 'Pause' : 'Start';
            
            timeTrackingButton = `
                <button class="time-tracker-btn flex items-center text-white text-xs px-3 py-1 rounded ${buttonClasses} mt-2 transition-all duration-200" data-task-id="${task.id}">
                    ${buttonIcon}
                    ${buttonText}
                </button>
            `;
        }
        
        // Completion information for done tasks
        let completionInfo = '';
        if (task.status === 'done' && task.completedAt) {
            const completedDate = new Date(task.completedAt);
            const formattedDate = completedDate.toLocaleDateString();
            
            if (task.startedAt) {
                const startedDate = new Date(task.startedAt);
                const diffTime = Math.abs(completedDate - startedDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                completionInfo = `
                    <div class="flex items-center text-xs text-success-color mt-2">
                        <i class="fas fa-check-circle mr-1"></i>
                        Completed in ${diffDays} day${diffDays !== 1 ? 's' : ''} (${timeSpentDisplay} active)
                    </div>
                `;
            } else {
                completionInfo = `
                    <div class="flex items-center text-xs text-success-color mt-2">
                        <i class="fas fa-check-circle mr-1"></i>
                        Completed on ${formattedDate}
                    </div>
                `;
            }
        }
        
        // Create subtasks indicator if any
        let subtasksIndicator = '';
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
            subtasksIndicator = `
                <div class="flex items-center text-xs mt-2 text-text-secondary">
                    <i class="fas fa-tasks mr-1"></i>
                    ${completedSubtasks}/${task.subtasks.length} subtasks
                </div>
            `;
        }
        
        // Create tags display if any
        let tagsDisplay = '';
        if (task.tags && task.tags.length > 0) {
            tagsDisplay = `
                <div class="flex flex-wrap gap-1 mt-2">
                    ${task.tags.map(tag => `
                        <span class="bg-bg-secondary text-text-secondary text-xs px-2 py-0.5 rounded">
                            ${tag}
                        </span>
                    `).join('')}
                </div>
            `;
        }
        
        // Create the task card content with enhanced styling
        taskEl.innerHTML = `
            <div class="relative">
                <h4 class="font-medium text-text-primary mb-2 pr-6">${task.title}</h4>
                
                <span class="absolute top-0 right-0 px-2 py-0.5 rounded-full text-xs ${priorityColor}">
                    ${priorityText}
                </span>
                
                <p class="text-sm text-text-secondary mb-3 line-clamp-2">${task.description || 'No description'}</p>
                
                <div class="flex justify-between items-center">
                    ${task.dueDate ? `
                        <span class="text-xs ${dueDateClass} flex items-center">
                            ${dueDateIcon}
                            Due: ${new Date(task.dueDate).toLocaleDateString()}
                        </span>
                    ` : '<span></span>'}
                    
                    ${task.assignee ? `
                        <span class="text-xs flex items-center">
                            <i class="fas fa-user mr-1"></i>
                            ${task.assignee}
                        </span>
                    ` : '<span></span>'}
                </div>
                
                ${task.timeTracking && task.timeTracking.totalTime > 0 ? `
                    <div class="flex items-center text-xs mt-2 text-text-secondary">
                        <i class="fas fa-clock mr-1"></i>
                        ${this.formatTimeSpent(task.timeTracking.totalTime || 0)}
                    </div>
                ` : ''}
                
                ${subtasksIndicator}
                ${tagsDisplay}
                ${completionInfo}
                ${timeTrackingButton}
            </div>
        `;
        
        // Setup drag events
        taskEl.addEventListener('dragstart', () => {
            taskEl.classList.add('dragging', 'opacity-50', 'border-2', 'border-dashed', 'border-accent-primary');
        });
        
        taskEl.addEventListener('dragend', () => {
            taskEl.classList.remove('dragging', 'opacity-50', 'border-2', 'border-dashed', 'border-accent-primary');
            
            // Get parent container to determine new status
            const container = taskEl.parentElement;
            if (!container) return;
            
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
        
        // Open task view on click (but not when clicking timer button)
        taskEl.addEventListener('click', (e) => {
            if (e.target.closest('.time-tracker-btn')) {
                return; // Don't open task view when clicking timer button
            }
            this.openViewTaskModal(task.id);
        });
        
        // Add event listener for time tracking button
        const timerBtn = taskEl.querySelector('.time-tracker-btn');
        if (timerBtn) {
            timerBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event
                this.toggleTimeTracking(task.id);
            });
        }
        
        return taskEl;
    }

    calculateTimeSpent(task) {
        if (!task.timeTracking) return 0;
        
        let totalTime = task.timeTracking.totalTime || 0;
        
        // Add active time if timer is running
        if (task.timeTracking.isActive && task.timeTracking.lastStarted) {
            const now = new Date();
            const lastStarted = new Date(task.timeTracking.lastStarted);
            totalTime += (now - lastStarted);
        }
        
        return totalTime;
    }

    formatTimeSpent(timeInMs) {
        if (!timeInMs) return "0h 0m";
        
        const hours = Math.floor(timeInMs / (1000 * 60 * 60));
        const minutes = Math.floor((timeInMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    openTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('taskModalTitle');

        if (task) {
            title.textContent = 'Edit Task';
            form.dataset.taskId = task.id;
            Object.keys(task).forEach(key => {
                const input = form.elements[key];
                if (input) input.value = task[key];
            });
        } else {
            title.textContent = 'New Task';
            form.reset();
            delete form.dataset.taskId;
        }

        modal.classList.remove('hidden');
    }

    async handleTaskSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status'),
            priority: formData.get('priority'),
            dueDate: formData.get('dueDate'),
            estimatedTime: parseInt(formData.get('estimatedTime')),
            projectId: this.currentProjectId,
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(Boolean)
        };

        if (form.dataset.taskId) {
            // Update existing task
            StorageManager.updateTask(form.dataset.taskId, taskData);
        } else {
            // Create new task
            StorageManager.addTask(taskData);
        }

        this.tasks = StorageManager.getTasks();
        this.updateTaskList();
        document.getElementById('taskModal').classList.add('hidden');
    }

    async handleFileUpload(e) {
        const files = e.target.files;
        const taskId = document.getElementById('taskForm').dataset.taskId;
        
        if (!taskId) return;

        for (const file of files) {
            await StorageManager.addTaskFile(taskId, file);
        }

        this.updateTaskList();
    }

    handleNoteSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const taskId = form.dataset.taskId;
        const content = form.querySelector('textarea').value;

        if (taskId && content) {
            StorageManager.addTaskNote(taskId, content);
            this.updateTaskList();
            form.reset();
        }
    }

    handleTaskStatusChange(select) {
        const taskId = select.closest('.task-card').dataset.taskId;
        const newStatus = select.value;
        StorageManager.updateTask(taskId, { status: newStatus });
        this.updateTaskList();
    }

    handleTaskPriorityChange(select) {
        const taskId = select.closest('.task-card').dataset.taskId;
        const newPriority = select.value;
        StorageManager.updateTask(taskId, { priority: newPriority });
        this.updateTaskList();
    }

    editTask(task) {
        this.openTaskModal(task);
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            StorageManager.deleteTask(taskId);
            this.tasks = StorageManager.getTasks();
            this.updateTaskList();
        }
    }

    updateTaskStatus(taskId, newStatus) {
        StorageManager.updateTask(taskId, { status: newStatus });
        this.tasks = StorageManager.getTasks();
        this.updateTaskList();
    }

    toggleTimeTracking(taskId) {
        StorageManager.toggleTimeTracking(taskId);
        this.tasks = StorageManager.getTasks();
        this.updateTaskList();
    }

    openViewTaskModal(taskId) {
        // Implementation of openViewTaskModal method
    }
}

// Initialize task manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
}); 