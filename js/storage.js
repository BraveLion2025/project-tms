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
    }

    /**
     * Task Management
     */
    static getTasks() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.TASKS) || '[]');
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
            timeSpent: task.timeSpent || 0,
            estimatedTime: task.estimatedTime || 0,
            subtasks: task.subtasks || []
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
    static getTaskNotes() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.NOTES) || '{}');
    }

    static saveTaskNotes(notes) {
        localStorage.setItem(this.STORAGE_KEYS.NOTES, JSON.stringify(notes));
    }

    static addTaskNote(taskId, content) {
        const notes = this.getTaskNotes();
        if (!notes[taskId]) {
            notes[taskId] = [];
        }
        const newNote = {
            id: Date.now().toString(),
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        notes[taskId].push(newNote);
        this.saveTaskNotes(notes);
        return newNote;
    }

    static updateTaskNote(taskId, noteId, content) {
        const notes = this.getTaskNotes();
        if (notes[taskId]) {
            const index = notes[taskId].findIndex(n => n.id === noteId);
            if (index !== -1) {
                notes[taskId][index] = {
                    ...notes[taskId][index],
                    content,
                    updatedAt: new Date().toISOString()
                };
                this.saveTaskNotes(notes);
                return notes[taskId][index];
            }
        }
        return null;
    }

    static deleteTaskNote(taskId, noteId) {
        const notes = this.getTaskNotes();
        if (notes[taskId]) {
            notes[taskId] = notes[taskId].filter(n => n.id !== noteId);
            this.saveTaskNotes(notes);
        }
    }

    static deleteTaskNotes(taskId) {
        const notes = this.getTaskNotes();
        delete notes[taskId];
        this.saveTaskNotes(notes);
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
        }
    }

    static deleteTaskFiles(taskId) {
        const files = this.getTaskFiles();
        delete files[taskId];
        this.saveTaskFiles(files);
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
            notes: this.getTaskNotes(),
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
            if (data.notes) localStorage.setItem(this.STORAGE_KEYS.NOTES, JSON.stringify(data.notes));
            if (data.files) localStorage.setItem(this.STORAGE_KEYS.FILES, JSON.stringify(data.files));
            if (data.settings) localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}