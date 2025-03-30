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
        // Project selection change
        const projectSelect = document.getElementById('projectSelect');
        if (projectSelect) {
            projectSelect.addEventListener('change', (e) => {
                const projectId = e.target.value;
                if (projectId) {
                    this.selectProject(projectId);
                } else {
                    this.clearProjectDisplay();
                }
            });
        }
        
        // Create first project button
        const createFirstProjectBtn = document.getElementById('createFirstProjectBtn');
        if (createFirstProjectBtn) {
            createFirstProjectBtn.addEventListener('click', () => {
                this.openProjectModal();
            });
        }
        
        // Project form submission
        const projectForm = document.getElementById('projectForm');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProject();
            });
        }
        
        // Cancel project button
        const cancelProjectBtn = document.getElementById('cancelProjectBtn');
        if (cancelProjectBtn) {
            cancelProjectBtn.addEventListener('click', () => {
                this.closeProjectModal();
            });
        }
        
        // Edit project button
        const editProjectBtn = document.getElementById('editProjectBtn');
        if (editProjectBtn) {
            editProjectBtn.addEventListener('click', () => {
                if (this.currentProject) {
                    this.openProjectModal(this.currentProject.id);
                }
            });
        }
        
        // Delete project button
        const deleteProjectBtn = document.getElementById('deleteProjectBtn');
        if (deleteProjectBtn) {
            deleteProjectBtn.addEventListener('click', () => {
                if (this.currentProject) {
                    this.confirmDeleteProject(this.currentProject.id);
                }
            });
        }
        
        // Cancel delete button
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                this.closeDeleteModal();
            });
        }
        
        // Confirm delete button
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                if (this.deleteTarget && this.deleteTarget.type === 'project') {
                    this.deleteProject(this.deleteTarget.id);
                }
                this.closeDeleteModal();
            });
        }
    },
    
    /**
     * Load projects from storage and update UI
     */
    loadProjects: function() {
        const projects = StorageManager.getProjects();
        const projectSelect = document.getElementById('projectSelect');
        
        if (!projectSelect) return;
        
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
        const editBtn = document.getElementById('editProjectBtn');
        const deleteBtn = document.getElementById('deleteProjectBtn');
        
        if (editBtn) editBtn.disabled = true;
        if (deleteBtn) deleteBtn.disabled = true;
    },
    
    /**
     * Toggle between empty state and project content
     * @param {Boolean} isEmpty - Whether there are no projects
     */
    toggleEmptyState: function(isEmpty) {
        const noProjectsPlaceholder = document.getElementById('noProjectsPlaceholder');
        const projectDetails = document.getElementById('projectDetails');
        const taskManagement = document.getElementById('taskManagement');
        
        if (noProjectsPlaceholder) {
            noProjectsPlaceholder.style.display = isEmpty ? 'block' : 'none';
        }
        
        if (isEmpty) {
            this.clearProjectDisplay();
        }
    },
    
    /**
     * Clear project display when no project is selected
     */
    clearProjectDisplay: function() {
        this.currentProject = null;
        
        const projectDetails = document.getElementById('projectDetails');
        const taskManagement = document.getElementById('taskManagement');
        const editProjectBtn = document.getElementById('editProjectBtn');
        const deleteProjectBtn = document.getElementById('deleteProjectBtn');
        
        if (projectDetails) projectDetails.classList.add('hidden');
        if (taskManagement) taskManagement.classList.add('hidden');
        if (editProjectBtn) editProjectBtn.disabled = true;
        if (deleteProjectBtn) deleteProjectBtn.disabled = true;
        
        // Clear project select if it has a value
        const projectSelect = document.getElementById('projectSelect');
        if (projectSelect && projectSelect.value) {
            projectSelect.value = '';
        }
        
        // Notify TasksManager that no project is selected
        if (window.TasksManager) {
            window.TasksManager.currentProjectId = null;
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
        const editProjectBtn = document.getElementById('editProjectBtn');
        const deleteProjectBtn = document.getElementById('deleteProjectBtn');
        
        if (editProjectBtn) editProjectBtn.disabled = false;
        if (deleteProjectBtn) deleteProjectBtn.disabled = false;
        
        // Update project details section
        const projectTitle = document.getElementById('projectTitle');
        const projectDescription = document.getElementById('projectDescription');
        const projectStartDate = document.getElementById('projectStartDate');
        const projectEndDate = document.getElementById('projectEndDate');
        const projectStatus = document.getElementById('projectStatus');
        
        if (projectTitle) projectTitle.textContent = project.name;
        if (projectDescription) projectDescription.textContent = project.description || 'No description provided.';
        
        // Format dates
        const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set';
        const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set';
        
        if (projectStartDate) projectStartDate.textContent = startDate;
        if (projectEndDate) projectEndDate.textContent = endDate;
        if (projectStatus) projectStatus.textContent = project.status || 'Active';
        
        // Show project details
        const projectDetails = document.getElementById('projectDetails');
        const taskManagement = document.getElementById('taskManagement');
        
        if (projectDetails) projectDetails.classList.remove('hidden');
        if (taskManagement) taskManagement.classList.remove('hidden');
        
        // Update TasksManager with the current project
        if (window.TasksManager) {
            TasksManager.currentProjectId = projectId;
            TasksManager.loadTasks(projectId);
        }
        
        // Update project metrics
        this.updateProjectMetrics(projectId);
    },
    
    /**
     * Update project metrics display
     * @param {String} projectId - Project ID
     */
    updateProjectMetrics: function(projectId) {
        const tasks = StorageManager.getTasksByProject(projectId);
        
        // Get DOM elements
        const projectCompletionPercentage = document.getElementById('projectCompletionPercentage');
        const projectProgressBar = document.getElementById('projectProgressBar');
        const todoCount = document.getElementById('todoCount');
        const inProgressCount = document.getElementById('inProgressCount');
        const reviewCount = document.getElementById('reviewCount');
        const doneCount = document.getElementById('doneCount');
        const totalTimeSpent = document.getElementById('totalTimeSpent');
        const avgTaskCompletion = document.getElementById('avgTaskCompletion');
        
        if (!tasks.length) {
            // No tasks yet, show empty state
            if (projectCompletionPercentage) projectCompletionPercentage.textContent = '0%';
            if (projectProgressBar) projectProgressBar.style.width = '0%';
            if (todoCount) todoCount.textContent = '0';
            if (inProgressCount) inProgressCount.textContent = '0';
            if (reviewCount) reviewCount.textContent = '0';
            if (doneCount) doneCount.textContent = '0';
            if (totalTimeSpent) totalTimeSpent.textContent = '0h 0m';
            if (avgTaskCompletion) avgTaskCompletion.textContent = '0h 0m';
            return;
        }
        
        // Count tasks by status
        const taskCounts = {
            'todo': 0,
            'in-progress': 0,
            'review': 0,
            'done': 0
        };
        
        let totalTimeSpentMs = 0;
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
                
                totalTimeSpentMs += taskTime;
                
                // Track completed tasks time for average calculation
                if (task.status === 'done') {
                    completedTasks++;
                    completedTasksTime += taskTime;
                }
            }
        });
        
        // Update task counts
        if (todoCount) todoCount.textContent = taskCounts.todo;
        if (inProgressCount) inProgressCount.textContent = taskCounts['in-progress'];
        if (reviewCount) reviewCount.textContent = taskCounts.review;
        if (doneCount) doneCount.textContent = taskCounts.done;
        
        // Calculate and update completion percentage
        const totalTasks = tasks.length;
        const completionPercentage = Math.round((taskCounts.done / totalTasks) * 100);
        
        if (projectCompletionPercentage) projectCompletionPercentage.textContent = `${completionPercentage}%`;
        if (projectProgressBar) projectProgressBar.style.width = `${completionPercentage}%`;
        
        // Format and display time metrics
        const formatTime = (timeInMs) => {
            const hours = Math.floor(timeInMs / (1000 * 60 * 60));
            const minutes = Math.floor((timeInMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        };
        
        if (totalTimeSpent) totalTimeSpent.textContent = formatTime(totalTimeSpentMs);
        
        // Calculate and display average task completion time
        const avgTime = completedTasks > 0 ? completedTasksTime / completedTasks : 0;
        if (avgTaskCompletion) avgTaskCompletion.textContent = formatTime(avgTime);
    },
    
    /**
     * Open the project modal for creating or editing a project
     * @param {String|null} projectId - Project ID for editing, null for new project
     */
    openProjectModal: function(projectId = null) {
        const modal = document.getElementById('projectModal');
        const form = document.getElementById('projectForm');
        const titleEl = document.getElementById('projectModalTitle');
        const projectIdField = document.getElementById('projectId');
        const projectNameInput = document.getElementById('projectNameInput');
        const projectDescInput = document.getElementById('projectDescInput');
        const projectStartInput = document.getElementById('projectStartInput');
        const projectEndInput = document.getElementById('projectEndInput');
        
        if (!modal || !form) return;
        
        // Reset form
        form.reset();
        if (projectIdField) projectIdField.value = '';
        
        if (projectId) {
            // Edit mode
            const project = StorageManager.getProjectById(projectId);
            if (!project) return;
            
            if (titleEl) titleEl.textContent = 'Edit Project';
            if (projectIdField) projectIdField.value = project.id;
            if (projectNameInput) projectNameInput.value = project.name;
            if (projectDescInput) projectDescInput.value = project.description || '';
            if (projectStartInput) projectStartInput.value = project.startDate || '';
            if (projectEndInput) projectEndInput.value = project.endDate || '';
        } else {
            // New project mode
            if (titleEl) titleEl.textContent = 'New Project';
            
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            if (projectStartInput) projectStartInput.value = today;
        }
        
        // Show modal
        modal.classList.add('active');
    },
    
    /**
     * Close the project modal
     */
    closeProjectModal: function() {
        const modal = document.getElementById('projectModal');
        if (modal) modal.classList.remove('active');
    },
    
    /**
     * Save the project from form data
     */
    saveProject: function() {
        const projectIdField = document.getElementById('projectId');
        const projectNameInput = document.getElementById('projectNameInput');
        const projectDescInput = document.getElementById('projectDescInput');
        const projectStartInput = document.getElementById('projectStartInput');
        const projectEndInput = document.getElementById('projectEndInput');
        
        if (!projectNameInput) return;
        
        const projectId = projectIdField ? projectIdField.value : '';
        
        const projectData = {
            name: projectNameInput.value,
            description: projectDescInput ? projectDescInput.value : '',
            startDate: projectStartInput ? projectStartInput.value || null : null,
            endDate: projectEndInput ? projectEndInput.value || null : null,
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
            if (projectSelect) {
                projectSelect.value = savedProject.id;
                this.selectProject(savedProject.id);
            }
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
        
        const deleteMessage = document.getElementById('deleteMessage');
        const deleteModal = document.getElementById('deleteModal');
        
        if (deleteMessage) {
            deleteMessage.textContent = 
                `Are you sure you want to delete the project "${project.name}"? This will also delete all tasks associated with this project. This action cannot be undone.`;
        }
        
        if (deleteModal) {
            deleteModal.classList.add('active');
        }
    },
    
    /**
     * Close the delete confirmation modal
     */
    closeDeleteModal: function() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) deleteModal.classList.remove('active');
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