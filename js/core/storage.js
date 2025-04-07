/**
 * Enhanced Client Storage Manager for Project-TMS
 * Handles data persistence using server-based file storage
 */
class StorageManager {
    static API_URL = 'http://localhost:3000/api';
    static FILE_NAMES = {
        PROJECTS: 'projects.json',
        TASKS: 'tasks.json',
        SETTINGS: 'settings.json',
        LAST_SYNC: 'last_sync.json'
    };
    
    /**
     * Initialize storage and perform any necessary setup
     */
    static async initialize() {
        try {
            // Check for data integrity
            await this._validateDataStructure();
            
            // Emit event that storage is ready
            if (window.EventBus) {
                EventBus.emit('storage:ready', true);
            }
            
            console.log('Storage initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing storage:', error);
            
            // Attempt recovery by initializing with default values
            try {
                await this._initializeDefaultData();
                return true;
            } catch (recoveryError) {
                console.error('Recovery failed:', recoveryError);
                
                // If server is unavailable, show an error message
                if (window.NotificationManager) {
                    NotificationManager.error(
                        'Could not connect to the data server. Data will not be saved.',
                        'Storage Error'
                    );
                }
                
                return false;
            }
        }
    }
    
    /**
     * Validate and repair data structure if needed
     * @private
     */
    static async _validateDataStructure() {
        try {
            // Fetch and verify each file
            const projects = await this._readFile('PROJECTS');
            const tasks = await this._readFile('TASKS');
            const settings = await this._readFile('SETTINGS');
            
            // Verify structures
            if (!Array.isArray(projects)) {
                await this._writeFile('PROJECTS', []);
            }
            
            if (!Array.isArray(tasks)) {
                await this._writeFile('TASKS', []);
            }
            
            if (typeof settings !== 'object' || settings === null) {
                await this._writeFile('SETTINGS', {});
            }
            
            return true;
        } catch (error) {
            console.error('Error validating data structure:', error);
            throw error;
        }
    }
    
    /**
     * Initialize with default data
     * @private
     */
    static async _initializeDefaultData() {
        try {
            // Create default files
            await this._writeFile('PROJECTS', []);
            await this._writeFile('TASKS', []);
            await this._writeFile('SETTINGS', {});
            await this._writeFile('LAST_SYNC', { lastSync: new Date().toISOString() });
            
            console.log('Initialized default data');
            return true;
        } catch (error) {
            console.error('Error initializing default data:', error);
            throw error;
        }
    }
    
    /**
     * Check if the server is available
     * @returns {Promise<boolean>} True if server is available
     */
    static async isServerAvailable() {
        try {
            const response = await fetch(`${this.API_URL}/files`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Read data from file via API
     * @private
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if file doesn't exist or parsing fails
     * @returns {Promise<any>} Parsed data or default value
     */
    static async _readFile(key, defaultValue = null) {
        try {
            const filename = this.FILE_NAMES[key];
            
            if (!filename) {
                console.error(`Invalid storage key: ${key}`);
                return defaultValue !== null ? defaultValue : 
                       (key === 'PROJECTS' || key === 'TASKS' ? [] : {});
            }
            
            try {
                const response = await fetch(`${this.API_URL}/files/${filename}`);
                
                if (!response.ok) {
                    throw new Error(`API returned ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error(`Error reading ${filename}:`, error);
                
                if (error.message && error.message.includes('Failed to fetch')) {
                    // Connection issue - try localStorage fallback
                    return this._readFromLocalStorage(key, defaultValue);
                }
                
                return defaultValue !== null ? defaultValue : 
                       (key === 'PROJECTS' || key === 'TASKS' ? [] : {});
            }
        } catch (error) {
            console.error(`Error in _readFile for ${key}:`, error);
            return defaultValue !== null ? defaultValue : 
                   (key === 'PROJECTS' || key === 'TASKS' ? [] : {});
        }
    }
    
    /**
     * Write data to file via API
     * @private
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     * @returns {Promise<boolean>} Success status
     */
    static async _writeFile(key, data) {
        try {
            const filename = this.FILE_NAMES[key];
            
            if (!filename) {
                console.error(`Invalid storage key: ${key}`);
                return false;
            }
            
            try {
                const response = await fetch(`${this.API_URL}/files/${filename}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    throw new Error(`API returned ${response.status}: ${response.statusText}`);
                }
                
                // Also save to localStorage as backup
                this._writeToLocalStorage(key, data);
                
                return true;
            } catch (error) {
                console.error(`Error writing ${filename}:`, error);
                
                if (error.message && error.message.includes('Failed to fetch')) {
                    // Connection issue - try localStorage fallback
                    return this._writeToLocalStorage(key, data);
                }
                
                return false;
            }
        } catch (error) {
            console.error(`Error in _writeFile for ${key}:`, error);
            
            // Try localStorage as a last resort
            return this._writeToLocalStorage(key, data);
        }
    }
    
    /**
     * Read from localStorage fallback
     * @private
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if not found
     * @returns {any} Data or default value
     */
    static _readFromLocalStorage(key, defaultValue) {
        try {
            const data = localStorage.getItem(`tms_${key.toLowerCase()}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage for ${key}:`, error);
            return defaultValue;
        }
    }
    
    /**
     * Write to localStorage fallback
     * @private
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     * @returns {boolean} Success status
     */
    static _writeToLocalStorage(key, data) {
        try {
            localStorage.setItem(`tms_${key.toLowerCase()}`, JSON.stringify(data));
            console.warn(`Saved ${key} to localStorage as fallback`);
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage for ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Project Management
     */
    static async getProjects() {
        return await this._readFile('PROJECTS', []);
    }
    
    static async getProjectById(projectId) {
        const projects = await this.getProjects();
        return projects.find(p => p.id === projectId) || null;
    }
    
    static async addProject(project) {
        const projects = await this.getProjects();
        const newProject = {
            ...project,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        projects.push(newProject);
        const success = await this._writeFile('PROJECTS', projects);
        
        if (success && window.EventBus) {
            EventBus.emit('project:created', newProject);
        }
        
        return success ? newProject : null;
    }
    
    static async updateProject(projectId, updates) {
        const projects = await this.getProjects();
        const index = projects.findIndex(p => p.id === projectId);
        
        if (index !== -1) {
            const updatedProject = {
                ...projects[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            projects[index] = updatedProject;
            const success = await this._writeFile('PROJECTS', projects);
            
            if (success && window.EventBus) {
                EventBus.emit('project:updated', updatedProject);
            }
            
            return success ? updatedProject : null;
        }
        
        return null;
    }
    
    static async deleteProject(projectId) {
        const projects = await this.getProjects();
        const filteredProjects = projects.filter(p => p.id !== projectId);
        
        // Only proceed if we actually found and removed the project
        if (filteredProjects.length < projects.length) {
            const success = await this._writeFile('PROJECTS', filteredProjects);
            
            if (success) {
                // Delete associated tasks
                await this.deleteProjectTasks(projectId);
                
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
    static async getTasks() {
        return await this._readFile('TASKS', []);
    }
    
    static async getTaskById(taskId) {
        const tasks = await this.getTasks();
        return tasks.find(t => t.id === taskId) || null;
    }
    
    static async getTasksByProject(projectId) {
        const tasks = await this.getTasks();
        return tasks.filter(t => t.projectId === projectId);
    }
    
    static async addTask(task) {
        const tasks = await this.getTasks();
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
        const success = await this._writeFile('TASKS', tasks);
        
        if (success && window.EventBus) {
            EventBus.emit('task:created', newTask);
        }
        
        return success ? newTask : null;
    }
    
    static async updateTask(taskId, updates) {
        const tasks = await this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        
        if (index !== -1) {
            const updatedTask = {
                ...tasks[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            tasks[index] = updatedTask;
            const success = await this._writeFile('TASKS', tasks);
            
            if (success && window.EventBus) {
                EventBus.emit('task:updated', updatedTask);
            }
            
            return success ? updatedTask : null;
        }
        
        return null;
    }
    
    static async deleteTask(taskId) {
        const tasks = await this.getTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return false;
        
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        const success = await this._writeFile('TASKS', filteredTasks);
        
        if (success && window.EventBus) {
            EventBus.emit('task:deleted', { taskId, projectId: task.projectId });
        }
        
        return success;
    }
    
    static async deleteProjectTasks(projectId) {
        const tasks = await this.getTasks();
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        const otherTasks = tasks.filter(t => t.projectId !== projectId);
        
        const success = await this._writeFile('TASKS', otherTasks);
        
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
    static async addTaskNote(taskId, text) {
        const tasks = await this.getTasks();
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
            
            const success = await this._writeFile('TASKS', tasks);
            
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
    static async toggleTimeTracking(taskId) {
        const task = await this.getTaskById(taskId);
        if (!task || task.status !== 'in-progress') return null;
        
        // Initialize timeTracking object if it doesn't exist
        let timeTracking = task.timeTracking || {
            isActive: false,
            totalTime: 0,
            lastStarted: null
        };
        
        // Check if any other task is currently being tracked
        if (!timeTracking.isActive) {
            const tasks = await this.getTasks();
            const activeTask = tasks.find(t => 
                t.id !== taskId && 
                t.timeTracking && 
                t.timeTracking.isActive
            );
            
            // Pause the other active task first
            if (activeTask) {
                await this.toggleTimeTracking(activeTask.id);
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
        return await this.updateTask(taskId, {
            timeTracking: timeTracking,
            startedAt: task.startedAt
        });
    }
    
    /**
     * Settings Management
     */
    static async getSettings() {
        return await this._readFile('SETTINGS', {});
    }
    
    static async updateSettings(updates) {
        const settings = await this.getSettings();
        const newSettings = { ...settings, ...updates };
        const success = await this._writeFile('SETTINGS', newSettings);
        
        if (success && window.EventBus) {
            EventBus.emit('settings:updated', newSettings);
        }
        
        return success ? newSettings : null;
    }
    
    /**
     * Data Export/Import
     */
    static async exportData() {
        try {
            // Try using the API's export endpoint
            const response = await fetch(`${this.API_URL}/export`);
            
            if (response.ok) {
                const data = await response.json();
                return JSON.stringify(data, null, 2);
            }
            
            // Fallback to manual export
            const data = {
                projects: await this.getProjects(),
                tasks: await this.getTasks(),
                settings: await this.getSettings(),
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            
            // Fallback to manual export
            const data = {
                projects: await this.getProjects(),
                tasks: await this.getTasks(),
                settings: await this.getSettings(),
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
            
            return JSON.stringify(data, null, 2);
        }
    }
    
    static async importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate data structure
            if (!data.projects || !Array.isArray(data.projects)) {
                throw new Error('Invalid projects data structure');
            }
            
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Invalid tasks data structure');
            }
            
            try {
                // Try using the API's import endpoint
                const response = await fetch(`${this.API_URL}/import`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    if (window.EventBus) {
                        EventBus.emit('data:imported', { 
                            projectCount: data.projects.length,
                            taskCount: data.tasks.length
                        });
                    }
                    
                    return true;
                }
                
                throw new Error('API import failed');
            } catch (apiError) {
                console.warn('API import failed, falling back to manual import:', apiError);
                
                // Fallback to manual import
                await this._writeFile('PROJECTS', data.projects);
                await this._writeFile('TASKS', data.tasks);
                
                if (data.settings) {
                    await this._writeFile('SETTINGS', data.settings);
                }
                
                if (window.EventBus) {
                    EventBus.emit('data:imported', { 
                        projectCount: data.projects.length,
                        taskCount: data.tasks.length
                    });
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error importing data:', error);
            
            if (window.EventBus) {
                EventBus.emit('data:importFailed', { error: error.message });
            }
            
            return false;
        }
    }
}

// Make StorageManager available globally
window.StorageManager = StorageManager;