/**
 * Storage Manager for Project-TMS
 * Handles all data persistence and file management
 */
class StorageManager {
    static STORAGE_KEYS = {
        PROJECTS: 'projects',
        TASKS: 'tasks',
        NOTES: 'task_notes',
        FILES: 'task_files',
        SETTINGS: 'settings'
    };

    /**
     * Project Management
     */
    static getProjects() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROJECTS) || '[]');
    }

    static getProjectById(projectId) {
        const projects = this.getProjects();
        return projects.find(p => p.id === projectId) || null;
    }

    static saveProjects(projects) {
        localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
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
        this.saveProjects(projects);
        return newProject;
    }

    static updateProject(projectId, updates) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            projects[index] = {
                ...projects[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveProjects(projects);
            return projects[index];
        }
        return null;
    }

    static deleteProject(projectId) {
        const projects = this.getProjects();
        const filteredProjects = projects.filter(p => p.id !== projectId);
        this.saveProjects(filteredProjects);
        
        // Delete associated tasks and files
        this.deleteProjectTasks(projectId);
        return true;
    }

    /**
     * Task Management
     */
    static getTasks() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TASKS) || '[]');
    }

    static getTaskById(taskId) {
        const tasks = this.getTasks();
        return tasks.find(t => t.id === taskId) || null;
    }

    static getTasksByProject(projectId) {
        const tasks = this.getTasks();
        return tasks.filter(t => t.projectId === projectId);
    }

    static saveTasks(tasks) {
        localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
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
            attachments: task.attachments || [],
            tags: task.tags || [],
            notes: [],
            timeTracking: {
                isActive: false,
                totalTime: 0,
                lastStarted: null
            }
        };
        tasks.push(newTask);
        this.saveTasks(tasks);
        return newTask;
    }

    static updateTask(taskId, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = {
                ...tasks[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveTasks(tasks);
            return tasks[index];
        }
        return null;
    }

    static deleteTask(taskId) {
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        this.saveTasks(filteredTasks);
        
        // Delete associated notes and files
        this.deleteTaskNotes(taskId);
        this.deleteTaskFiles(taskId);
        return true;
    }

    static deleteProjectTasks(projectId) {
        const tasks = this.getTasks();
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        
        // Delete all associated data for each task
        projectTasks.forEach(task => {
            this.deleteTask(task.id);
        });
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            task.notes.push(note);
            this.saveTasks(tasks);
            return task;
        }
        return null;
    }
    
    static updateTaskNote(taskId, noteId, text) {
        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1 && tasks[taskIndex].notes) {
            const noteIndex = tasks[taskIndex].notes.findIndex(n => n.id === noteId);
            
            if (noteIndex !== -1) {
                tasks[taskIndex].notes[noteIndex] = {
                    ...tasks[taskIndex].notes[noteIndex],
                    text,
                    updatedAt: new Date().toISOString()
                };
                
                this.saveTasks(tasks);
                return tasks[taskIndex];
            }
        }
        return null;
    }
    
    static deleteTaskNote(taskId, noteId) {
        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1 && tasks[taskIndex].notes) {
            tasks[taskIndex].notes = tasks[taskIndex].notes.filter(n => n.id !== noteId);
            this.saveTasks(tasks);
            return true;
        }
        return false;
    }
    
    static deleteTaskNotes(taskId) {
        const tasks = this.getTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].notes = [];
            this.saveTasks(tasks);
            return true;
        }
        return false;
    }
    
    /**
     * File Management
     */
    static getTaskFiles() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.FILES) || '{}');
    }

    static saveTaskFiles(files) {
        localStorage.setItem(this.STORAGE_KEYS.FILES, JSON.stringify(files));
    }

    static async addTaskFile(taskId, file) {
        const files = this.getTaskFiles();
        if (!files[taskId]) {
            files[taskId] = [];
        }

        // Convert file to base64
        const base64 = await this.fileToBase64(file);
        const newFile = {
            id: Date.now().toString(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64,
            uploadedAt: new Date().toISOString()
        };

        files[taskId].push(newFile);
        this.saveTaskFiles(files);
        return newFile;
    }

    static deleteTaskFile(taskId, fileId) {
        const files = this.getTaskFiles();
        if (files[taskId]) {
            files[taskId] = files[taskId].filter(f => f.id !== fileId);
            this.saveTaskFiles(files);
            return true;
        }
        return false;
    }

    static deleteTaskFiles(taskId) {
        const files = this.getTaskFiles();
        delete files[taskId];
        this.saveTaskFiles(files);
        return true;
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
        return this.updateTask(taskId, {
            timeTracking: timeTracking,
            startedAt: task.startedAt
        });
    }
    
    /**
     * Settings Management
     */
    static getSettings() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SETTINGS) || '{}');
    }

    static saveSettings(settings) {
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }

    static updateSettings(updates) {
        const settings = this.getSettings();
        const newSettings = { ...settings, ...updates };
        this.saveSettings(newSettings);
        return newSettings;
    }

    /**
     * Utility Methods
     */
    static fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    static base64ToFile(base64, filename, type) {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    /**
     * Data Export/Import
     */
    static exportData() {
        const data = {
            projects: this.getProjects(),
            tasks: this.getTasks(),
            files: this.getTaskFiles(),
            settings: this.getSettings()
        };
        return JSON.stringify(data, null, 2);
    }

    static importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.projects) localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
            if (data.tasks) localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
            if (data.files) localStorage.setItem(this.STORAGE_KEYS.FILES, JSON.stringify(data.files));
            if (data.settings) localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}