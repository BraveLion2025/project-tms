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
        const div = document.createElement('div');
        div.className = 'task-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4';
        div.dataset.taskId = task.id;

        const statusColors = {
            todo: 'bg-gray-500',
            'in-progress': 'bg-blue-500',
            review: 'bg-yellow-500',
            done: 'bg-green-500'
        };

        const priorityColors = {
            low: 'text-green-500',
            medium: 'text-yellow-500',
            high: 'text-red-500'
        };

        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-semibold">${task.title}</h3>
                <div class="flex items-center space-x-2">
                    <span class="status-indicator ${statusColors[task.status]} w-2 h-2 rounded-full"></span>
                    <span class="text-sm ${priorityColors[task.priority]}">${task.priority}</span>
                </div>
            </div>
            <p class="text-gray-600 dark:text-gray-300 mb-2">${task.description}</p>
            <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center space-x-4">
                    <span>Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
                    <span>Time: ${this.formatTime(task.timeSpent)} / ${this.formatTime(task.estimatedTime)}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="edit-task-btn text-blue-500 hover:text-blue-700">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-task-btn text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="mt-4">
                <div class="task-attachments flex flex-wrap gap-2 mb-2">
                    ${this.renderAttachments(task.attachments)}
                </div>
                <div class="task-notes space-y-2">
                    ${this.renderNotes(task.id)}
                </div>
            </div>
        `;

        // Add event listeners
        div.querySelector('.edit-task-btn').addEventListener('click', () => this.editTask(task));
        div.querySelector('.delete-task-btn').addEventListener('click', () => this.deleteTask(task.id));

        return div;
    }

    renderAttachments(attachments) {
        return attachments.map(file => `
            <div class="attachment-item flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                <i class="fas fa-paperclip"></i>
                <span class="text-sm">${file.name}</span>
                <button class="delete-attachment-btn text-red-500 hover:text-red-700" data-file-id="${file.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderNotes(taskId) {
        const notes = StorageManager.getTaskNotes()[taskId] || [];
        return notes.map(note => `
            <div class="note-item bg-gray-50 dark:bg-gray-700 rounded p-2">
                <p class="text-sm">${note.content}</p>
                <div class="flex justify-between items-center mt-1">
                    <span class="text-xs text-gray-500">${new Date(note.createdAt).toLocaleString()}</span>
                    <button class="delete-note-btn text-red-500 hover:text-red-700" data-note-id="${note.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
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
}

// Initialize task manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
}); 