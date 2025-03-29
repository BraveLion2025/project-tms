/**
 * Projects Manager for Project-TMS
 * Handles project operations and UI interactions
 */

const ProjectsManager = {
    currentProject: null,
    
    /**
     * Initialize projects functionality
     */
    init: function() {
        this.loadProjects();
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners for project-related actions
     */
    setupEventListeners: function() {
        // New project button
        document.getElementById('newProjectBtn').addEventListener('click', () => {
            this.openProjectModal();
        });
        
        // Create first project button (on empty state)
        document.getElementById('createFirstProjectBtn').addEventListener('click', () => {
            this.openProjectModal();
        });
        
        // Project form submission
        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProject();
        });
        
        // Cancel project button
        document.getElementById('cancelProjectBtn').addEventListener('click', () => {
            this.closeProjectModal();
        });
        
        // Project selection change
        document.getElementById('projectSelect').addEventListener('change', (e) => {
            const projectId = e.target.value;
            if (projectId) {
                this.selectProject(projectId);
            } else {
                this.clearProjectDisplay();
            }
        });
        
        // Edit project button
        document.getElementById('editProjectBtn').addEventListener('click', () => {
            if (this.currentProject) {
                this.openProjectModal(this.currentProject.id);
            }
        });
        
        // Delete project button
        document.getElementById('deleteProjectBtn').addEventListener('click', () => {
            if (this.currentProject) {
                this.confirmDeleteProject(this.currentProject.id);
            }
        });
        
        // Cancel delete button
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.closeDeleteModal();
        });
        
        // Confirm delete button
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            if (this.deleteTarget && this.deleteTarget.type === 'project') {
                this.deleteProject(this.deleteTarget.id);
            }
            this.closeDeleteModal();
        });
    },
    
    /**
     * Load projects from storage and update UI
     */
    loadProjects: function() {
        const projects = StorageManager.getProjects();
        const projectSelect = document.getElementById('projectSelect');
        
        // Clear existing options
        projectSelect.innerHTML = '<option value="">Select a project</option>';
        
        // Add options for each project
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
        
        // Toggle empty state
        this.toggleEmptyState(projects.length === 0);
        
        // Disable project-specific buttons initially
        document.getElementById('editProjectBtn').disabled = true;
        document.getElementById('deleteProjectBtn').disabled = true;
    },
    
    /**
     * Toggle between empty state and project content
     * @param {Boolean} isEmpty - Whether there are no projects
     */
    toggleEmptyState: function(isEmpty) {
        document.getElementById('noProjectsPlaceholder').style.display = isEmpty ? 'block' : 'none';
        
        if (isEmpty) {
            this.clearProjectDisplay();
        }
    },
    
    /**
     * Clear project display when no project is selected
     */
    clearProjectDisplay: function() {
        this.currentProject = null;
        document.getElementById('projectDetails').style.display = 'none';
        document.getElementById('taskManagement').style.display = 'none';
        document.getElementById('editProjectBtn').disabled = true;
        document.getElementById('deleteProjectBtn').disabled = true;
        
        // Clear project select if it has a value
        const projectSelect = document.getElementById('projectSelect');
        if (projectSelect.value) {
            projectSelect.value = '';
        }
    },
    
    /**
     * Select a project and display its details
     * @param {String} projectId - Project ID
     */
    selectProject: function(projectId) {
        const project = StorageManager.getProjectById(projectId);
        if (!project) return;
        
        this.currentProject = project;
        
        // Enable project action buttons
        document.getElementById('editProjectBtn').disabled = false;
        document.getElementById('deleteProjectBtn').disabled = false;
        
        // Update project details section
        document.getElementById('projectTitle').textContent = project.name;
        document.getElementById('projectDescription').textContent = project.description || 'No description provided.';
        
        // Format dates
        const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set';
        const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set';
        
        document.getElementById('projectStartDate').textContent = startDate;
        document.getElementById('projectEndDate').textContent = endDate;
        
        // Show project details
        document.getElementById('projectDetails').style.display = 'block';
        document.getElementById('taskManagement').style.display = 'block';
        
        // Load tasks for this project
        TasksManager.loadTasks(projectId);
        
        // Update project metrics
        this.updateProjectMetrics(projectId);
    },
    
    /**
     * Update project metrics display
     * @param {String} projectId - Project ID
     */
    updateProjectMetrics: function(projectId) {
        const tasks = StorageManager.getTasksByProject(projectId);
        if (!tasks.length) {
            // No tasks yet, show empty state
            document.getElementById('projectCompletionPercentage').textContent = '0%';
            document.getElementById('projectProgressBar').style.width = '0%';
            document.getElementById('todoCount').textContent = '0';
            document.getElementById('inProgressCount').textContent = '0';
            document.getElementById('reviewCount').textContent = '0';
            document.getElementById('doneCount').textContent = '0';
            document.getElementById('totalTimeSpent').textContent = '0h 0m';
            document.getElementById('avgTaskCompletion').textContent = '0h 0m';
            return;
        }
        
        // Count tasks by status
        const taskCounts = {
            'todo': 0,
            'in-progress': 0,
            'review': 0,
            'done': 0
        };
        
        let totalTimeSpent = 0;
        let completedTasks = 0;
        let completedTasksTime = 0;
        
        tasks.forEach(task => {
            // Count by status
            if (taskCounts[task.status] !== undefined) {
                taskCounts[task.status]++;
            } else {
                taskCounts.todo++; // Default for invalid status
            }
            
            // Calculate time spent
            if (task.timeTracking) {
                let taskTime = task.timeTracking.totalTime || 0;
                
                // If task is active, add current session time
                if (task.timeTracking.isActive && task.timeTracking.lastStarted) {
                    const now = new Date();
                    const lastStarted = new Date(task.timeTracking.lastStarted);
                    taskTime += (now - lastStarted);
                }
                
                totalTimeSpent += taskTime;
                
                // Track completed tasks time for average calculation
                if (task.status === 'done') {
                    completedTasks++;
                    completedTasksTime += taskTime;
                }
            }
        });
        
        // Update task counts
        document.getElementById('todoCount').textContent = taskCounts.todo;
        document.getElementById('inProgressCount').textContent = taskCounts['in-progress'];
        document.getElementById('reviewCount').textContent = taskCounts.review;
        document.getElementById('doneCount').textContent = taskCounts.done;
        
        // Calculate and update completion percentage
        const totalTasks = tasks.length;
        const completionPercentage = Math.round((taskCounts.done / totalTasks) * 100);
        document.getElementById('projectCompletionPercentage').textContent = `${completionPercentage}%`;
        document.getElementById('projectProgressBar').style.width = `${completionPercentage}%`;
        
        // Format and display time metrics
        const formatTime = (timeInMs) => {
            const hours = Math.floor(timeInMs / (1000 * 60 * 60));
            const minutes = Math.floor((timeInMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        };
        
        document.getElementById('totalTimeSpent').textContent = formatTime(totalTimeSpent);
        
        // Calculate and display average task completion time
        const avgTime = completedTasks > 0 ? completedTasksTime / completedTasks : 0;
        document.getElementById('avgTaskCompletion').textContent = formatTime(avgTime);
    },
    
    /**
     * Open the project modal for creating or editing a project
     * @param {String|null} projectId - Project ID for editing, null for new project
     */
    openProjectModal: function(projectId = null) {
        const modal = document.getElementById('projectModal');
        const form = document.getElementById('projectForm');
        const titleEl = document.getElementById('projectModalTitle');
        
        // Reset form
        form.reset();
        document.getElementById('projectId').value = '';
        
        if (projectId) {
            // Edit mode
            const project = StorageManager.getProjectById(projectId);
            if (!project) return;
            
            titleEl.textContent = 'Edit Project';
            document.getElementById('projectId').value = project.id;
            document.getElementById('projectNameInput').value = project.name;
            document.getElementById('projectDescInput').value = project.description || '';
            document.getElementById('projectStartInput').value = project.startDate || '';
            document.getElementById('projectEndInput').value = project.endDate || '';
        } else {
            // New project mode
            titleEl.textContent = 'New Project';
            
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('projectStartInput').value = today;
        }
        
        modal.style.display = 'flex';
    },
    
    /**
     * Close the project modal
     */
    closeProjectModal: function() {
        document.getElementById('projectModal').style.display = 'none';
    },
    
    /**
     * Save the project from form data
     */
    saveProject: function() {
        const form = document.getElementById('projectForm');
        const projectId = document.getElementById('projectId').value;
        
        const projectData = {
            name: document.getElementById('projectNameInput').value,
            description: document.getElementById('projectDescInput').value,
            startDate: document.getElementById('projectStartInput').value || null,
            endDate: document.getElementById('projectEndInput').value || null,
            status: 'active' // Default status
        };
        
        // Validation
        if (!projectData.name.trim()) {
            alert('Project name is required');
            return;
        }
        
        let savedProject;
        
        if (projectId) {
            // Update existing project
            savedProject = StorageManager.updateProject(projectId, projectData);
        } else {
            // Create new project
            savedProject = StorageManager.addProject(projectData);
        }
        
        if (savedProject) {
            this.closeProjectModal();
            this.loadProjects();
            
            // Select the saved project
            const projectSelect = document.getElementById('projectSelect');
            projectSelect.value = savedProject.id;
            this.selectProject(savedProject.id);
        }
    },
    
    /**
     * Confirm deletion of a project
     * @param {String} projectId - Project ID
     */
    confirmDeleteProject: function(projectId) {
        const project = StorageManager.getProjectById(projectId);
        if (!project) return;
        
        this.deleteTarget = {
            type: 'project',
            id: projectId
        };
        
        document.getElementById('deleteMessage').textContent = 
            `Are you sure you want to delete the project "${project.name}"? This will also delete all tasks associated with this project. This action cannot be undone.`;
            
        document.getElementById('deleteModal').style.display = 'flex';
    },
    
    /**
     * Close the delete confirmation modal
     */
    closeDeleteModal: function() {
        document.getElementById('deleteModal').style.display = 'none';
        this.deleteTarget = null;
    },
    
    /**
     * Delete a project
     * @param {String} projectId - Project ID
     */
    deleteProject: function(projectId) {
        const deleted = StorageManager.deleteProject(projectId);
        
        if (deleted) {
            this.loadProjects();
            this.clearProjectDisplay();
        }
    },
    
    /**
     * Target for deletion (used by the confirmation modal)
     */
    deleteTarget: null
};