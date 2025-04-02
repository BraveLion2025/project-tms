/**
 * Enhanced Storage Manager for Project-TMS
 * Handles data persistence with improved error handling and data integrity
 */
class StorageManager {
    static STORAGE_KEYS = {
        PROJECTS: 'projects',
        TASKS: 'tasks',
        NOTES: 'task_notes',
        FILES: 'task_files',
        SETTINGS: 'settings',
        LAST_SYNC: 'last_sync'
    };

    /**
     * Initialize storage and perform any necessary migrations
     */
    static initialize() {
        try {
            // Check for data integrity
            this._validateDataStructure();
            
            // Emit event that storage is ready
            if (window.EventBus) {
                EventBus.emit('storage:ready', true);
            }
            
            return true;
        } catch (error) {
            console.error('Error initializing storage:', error);
            return false;
        }
    }

    /**
     * Validate and repair data structure if needed
     * @private
     */
    static _validateDataStructure() {
        // Ensure all required storage keys exist
        Object.values(this.STORAGE_KEYS).forEach(key => {
            if (!localStorage.getItem(key)) {
                // Initialize with default values
                switch (key) {
                    case this.STORAGE_KEYS.PROJECTS:
                    case this.STORAGE_KEYS.TASKS:
                        localStorage.setItem(key, '[]');
                        break;
                    case this.STORAGE_KEYS.FILES:
                    case this.STORAGE_KEYS.SETTINGS:
                        localStorage.setItem(key, '{}');
                        break;
                    case this.STORAGE_KEYS.LAST_SYNC:
                        localStorage.setItem(key, new Date().toISOString());
                        break;
                }
            }
        });
    }

    /**
     * Safe parse method with error handling
     * @private
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if parsing fails
     * @returns {any} Parsed data or default value
     */
    static _safeParse(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error parsing ${key} from storage:`, error);
            return defaultValue;
        }
    }

    /**
     * Safe stringify and save method with error handling
     * @private
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     * @returns {boolean} Success status
     */
    static _safeSave(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving ${key} to storage:`, error);
            
            // Try to handle storage quota exceeded
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                // Emit storage quota exceeded event
                if (window.EventBus) {
                    EventBus.emit('storage:quotaExceeded', { key, dataSize: JSON.stringify(data).length });
                }
            }
            
            return false;
        }
    }

    /**
     * Project Management
     */
    static getProjects() {
        return this._safeParse(this.STORAGE_KEYS.PROJECTS, []);
    }

    static getProjectById(projectId) {
        const projects = this.getProjects();
        return projects.find(p => p.id === projectId) || null;
    }

    static addProject(project) {
        const projects = this.getProjects();
        const newProject = {
            ...project,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        projects.push(newProject);
        const success = this._safeSave(this.STORAGE_KEYS.PROJECTS, projects);
        
        if (success && window.EventBus) {
            EventBus.emit('project:created', newProject);
        }
        
        return success ? newProject : null;
    }

    static updateProject(projectId, updates) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === projectId);
        
        if (index !== -1) {
            const updatedProject = {
                ...projects[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            projects[index] = updatedProject;
            const success = this._safeSave(this.STORAGE_KEYS.PROJECTS, projects);
            
            if (success && window.EventBus) {
                EventBus.emit('project:updated', updatedProject);
            }
            
            return success ? updatedProject : null;
        }
        
        return null;
    }

    static deleteProject(projectId) {
        const projects = this.getProjects();
        const filteredProjects = projects.filter(p => p.id !== projectId);
        
        // Only proceed if we actually found and removed the project
        if (filteredProjects.length < projects.length) {
            const success = this._safeSave(this.STORAGE_KEYS.PROJECTS, filteredProjects);
            
            if (success) {
                // Delete associated tasks and files
                this.deleteProjectTasks(projectId);
                
                if (window.EventBus) {
                    EventBus.emit('project:deleted', { projectId });
                }
                
                return true;
            }
        }
        
        return false;
    }

    /**
     * Task Management
     */
    static getTasks() {
        return this._safeParse(this.STORAGE_KEYS.TASKS, []);
    }

    static getTaskById(taskId) {
        const tasks = this.getTasks();
        return tasks.find(t => t.id === taskId) || null;
    }

    static getTasksByProject(projectId) {
        const tasks = this.getTasks();
        return tasks.filter(t => t.projectId === projectId);
    }

    static addTask(task) {
        const tasks = this.getTasks();
        const newTask = {
            ...task,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            notes: [],
            timeTracking: {
                isActive: false,
                totalTime: 0,
                lastStarted: null
            }
        };
        
        tasks.push(newTask);
        const success = this._safeSave(this.STORAGE_KEYS.TASKS, tasks);
        
        if (success && window.EventBus) {
            EventBus.emit('task:created', newTask);
        }
        
        return success ? newTask : null;
    }

    static updateTask(taskId, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        
        if (index !== -1) {
            const updatedTask = {
                ...tasks[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            tasks[index] = updatedTask;
            const success = this._safeSave(this.STORAGE_KEYS.TASKS, tasks);
            
            if (success && window.EventBus) {
                EventBus.emit('task:updated', updatedTask);
            }
            
            return success ? updatedTask : null;
        }
        
        return null;
    }

    static deleteTask(taskId) {
        const tasks = this.getTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return false;
        
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        const success = this._safeSave(this.STORAGE_KEYS.TASKS, filteredTasks);
        
        if (success && window.EventBus) {
            EventBus.emit('task:deleted', { taskId, projectId: task.projectId });
        }
        
        return success;
    }

    static deleteProjectTasks(projectId) {
        const tasks = this.getTasks();
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        const otherTasks = tasks.filter(t => t.projectId !== projectId);
        
        const success = this._safeSave(this.STORAGE_KEYS.TASKS, otherTasks);
        
        if (success && projectTasks.length > 0 && window.EventBus) {
            EventBus.emit('tasks:batchDeleted', { 
                projectId,
                taskIds: projectTasks.map(t => t.id)
            });
        }
        
        return success;
    }

    /**
     * Task Notes Management
     */
    static addTaskNote(taskId, text) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        
        if (index !== -1) {
            const task = tasks[index];
            
            if (!task.notes) {
                task.notes = [];
            }
            
            const note = {
                id: Date.now().toString(),
                text,
                createdAt: new Date().toISOString()
            };
            
            task.notes.push(note);
            task.updatedAt = new Date().toISOString();
            
            const success = this._safeSave(this.STORAGE_KEYS.TASKS, tasks);
            
            if (success && window.EventBus) {
                EventBus.emit('task:noteAdded', { taskId, note });
            }
            
            return success ? task : null;
        }
        
        return null;
    }
    
    /**
     * Time Tracking
     */
    static toggleTimeTracking(taskId) {
        const task = this.getTaskById(taskId);
        if (!task || task.status !== 'in-progress') return null;
        
        // Initialize timeTracking object if it doesn't exist
        let timeTracking = task.timeTracking || {
            isActive: false,
            totalTime: 0,
            lastStarted: null
        };
        
        // Check if any other task is currently being tracked
        if (!timeTracking.isActive) {
            const tasks = this.getTasks();
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
            
            if (window.EventBus) {
                EventBus.emit('timeTracking:stopped', { 
                    taskId,
                    sessionTime: timeSpentThisSession,
                    totalTime: timeTracking.totalTime
                });
            }
        } else {
            // Start: set as active and record start time
            timeTracking.isActive = true;
            timeTracking.lastStarted = new Date().toISOString();
            
            // If task hasn't been started before, record start date
            if (!task.startedAt) {
                task.startedAt = new Date().toISOString();
            }
            
            if (window.EventBus) {
                EventBus.emit('timeTracking:started', { 
                    taskId,
                    startedAt: timeTracking.lastStarted
                });
            }
        }
        
        // Update task with new timeTracking data
        return this.updateTask(taskId, {
            timeTracking: timeTracking,
            startedAt: task.startedAt
        });
    }
    
    /**
     * Settings Management
     */
    static getSettings() {
        return this._safeParse(this.STORAGE_KEYS.SETTINGS, {});
    }

    static updateSettings(updates) {
        const settings = this.getSettings();
        const newSettings = { ...settings, ...updates };
        const success = this._safeSave(this.STORAGE_KEYS.SETTINGS, newSettings);
        
        if (success && window.EventBus) {
            EventBus.emit('settings:updated', newSettings);
        }
        
        return success ? newSettings : null;
    }

    /**
     * Data Export/Import
     */
    static exportData() {
        const data = {
            projects: this.getProjects(),
            tasks: this.getTasks(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        return JSON.stringify(data, null, 2);
    }

    static importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate data structure
            if (!data.projects || !Array.isArray(data.projects)) {
                throw new Error('Invalid projects data structure');
            }
            
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Invalid tasks data structure');
            }
            
            // Import data
            this._safeSave(this.STORAGE_KEYS.PROJECTS, data.projects);
            this._safeSave(this.STORAGE_KEYS.TASKS, data.tasks);
            
            if (data.settings) {
                this._safeSave(this.STORAGE_KEYS.SETTINGS, data.settings);
            }
            
            // Update last sync time
            this._safeSave(this.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
            
            if (window.EventBus) {
                EventBus.emit('data:imported', { 
                    projectCount: data.projects.length,
                    taskCount: data.tasks.length
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            
            if (window.EventBus) {
                EventBus.emit('data:importFailed', { error: error.message });
            }
            
            return false;
        }
    }
}

// Initialize storage when this script loads
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.initialize();
});

// Make StorageManager available globally
window.StorageManager = StorageManager;