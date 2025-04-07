/**
 * Project Manager Component for Project-TMS
 * Handles project operations and UI interactions
 * Updated for async storage operations
 */
class ProjectManager {
    constructor() {
        this.currentProject = null;
        this.init();
    }

    /**
     * Initialize the project manager
     */
    async init() {
        this._setupEventListeners();
        await this.loadProjects();
        
        // Subscribe to global events
        if (window.EventBus) {
            EventBus.subscribe('project:created', async project => {
                await this.loadProjects();
                this.selectProject(project.id);
                
                if (window.NotificationManager) {
                    NotificationManager.success('Project created successfully');
                }
            });
            
            EventBus.subscribe('project:updated', async project => {
                await this.loadProjects();
                this.selectProject(project.id);
                
                if (window.NotificationManager) {
                    NotificationManager.success('Project updated successfully');
                }
            });
            
            EventBus.subscribe('project:deleted', async data => {
                await this.loadProjects();
                this.clearProjectDisplay();
                
                if (window.NotificationManager) {
                    NotificationManager.success('Project deleted successfully');
                }
            });
            
            EventBus.subscribe('tasks:loaded', data => {
                this.updateProjectMetrics(data.projectId, data.taskCounts);
            });
        }
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
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
        
        // New project button (either in header or empty state)
        const newProjectBtns = [
            document.getElementById('newProjectBtn'),
            document.getElementById('createFirstProjectBtn')
        ];
        
        newProjectBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.openProjectModal();
                });
            }
        });
        
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
        
        // Close project modal button
        const closeProjectModalBtn = document.getElementById('closeProjectModalBtn');
        if (closeProjectModalBtn) {
            closeProjectModalBtn.addEventListener('click', () => {
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
                this.deleteProject();
            });
        }
    }

    /**
     * Load projects from storage and update UI
     */
    async loadProjects() {
        if (!window.StorageManager) return;
        
        try {
            const projects = await StorageManager.getProjects();
            const projectSelect = document.getElementById('projectSelect');
            
            if (!projectSelect) return;
            
            // Clear existing options
            projectSelect.innerHTML = '<option value="">Select a project</option>';
            
            // Add options for each project
            if (Array.isArray(projects)) {
                projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    projectSelect.appendChild(option);
                });
                
                // Toggle empty state
                this.toggleEmptyState(projects.length === 0);
            } else {
                console.error("Projects is not an array:", projects);
                this.toggleEmptyState(true);
            }
            
            // Disable project-specific buttons initially
            const editBtn = document.getElementById('editProjectBtn');
            const deleteBtn = document.getElementById('deleteProjectBtn');
            
            if (editBtn) editBtn.disabled = true;
            if (deleteBtn) deleteBtn.disabled = true;
        } catch (error) {
            console.error("Error loading projects:", error);
            this.toggleEmptyState(true);
        }
    }

    /**
     * Toggle between empty state and project content
     * @param {boolean} isEmpty - Whether there are no projects
     */
    toggleEmptyState(isEmpty) {
        const noProjectsPlaceholder = document.getElementById('noProjectsPlaceholder');
        
        if (noProjectsPlaceholder) {
            noProjectsPlaceholder.style.display = isEmpty ? 'block' : 'none';
        }
        
        if (isEmpty) {
            this.clearProjectDisplay();
        }
    }

    /**
     * Clear project display when no project is selected
     */
    clearProjectDisplay() {
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
        
        // Notify TaskManager that no project is selected
        if (window.EventBus) {
            EventBus.emit('project:selected', { projectId: null });
        }
    }

    /**
     * Select a project and display its details
     * @param {string} projectId - Project ID
     */
    async selectProject(projectId) {
        if (!window.StorageManager) return;
        
        try {
            const project = await StorageManager.getProjectById(projectId);
            if (!project) return;
            
            this.currentProject = project;
            
            // Enable project action buttons
            const editProjectBtn = document.getElementById('editProjectBtn');
            const deleteProjectBtn = document.getElementById('deleteProjectBtn');
            
            if (editProjectBtn) editProjectBtn.disabled = false;
            if (deleteProjectBtn) deleteProjectBtn.disabled = false;
            
            // Update project details section
            this._updateProjectDetails(project);
            
            // Show project sections
            const projectDetails = document.getElementById('projectDetails');
            const taskManagement = document.getElementById('taskManagement');
            
            if (projectDetails) projectDetails.classList.remove('hidden');
            if (taskManagement) taskManagement.classList.remove('hidden');
            
            // Update project selector
            const projectSelect = document.getElementById('projectSelect');
            if (projectSelect) projectSelect.value = projectId;
            
            // Notify TaskManager that a project is selected
            if (window.EventBus) {
                EventBus.emit('project:selected', { projectId });
            }
        } catch (error) {
            console.error("Error selecting project:", error);
        }
    }
    
    /**
     * Update project details in the UI
     * @private
     * @param {Object} project - Project data
     */
    _updateProjectDetails(project) {
        const titleEl = document.getElementById('projectTitle');
        const descriptionEl = document.getElementById('projectDescription');
        const startDateEl = document.getElementById('projectStartDate');
        const endDateEl = document.getElementById('projectEndDate');
        const statusEl = document.getElementById('projectStatus');
        
        if (titleEl) titleEl.textContent = project.name;
        
        if (descriptionEl) {
            descriptionEl.textContent = project.description || 'No description provided';
        }
        
        if (startDateEl) {
            const startDate = project.startDate ? (
                window.DateFormatter ? 
                DateFormatter.formatShortDate(project.startDate) : 
                new Date(project.startDate).toLocaleDateString()
            ) : 'Not set';
            
            startDateEl.textContent = startDate;
        }
        
        if (endDateEl) {
            const endDate = project.endDate ? (
                window.DateFormatter ? 
                DateFormatter.formatShortDate(project.endDate) : 
                new Date(project.endDate).toLocaleDateString()
            ) : 'Not set';
            
            endDateEl.textContent = endDate;
        }
        
        if (statusEl) {
            statusEl.textContent = project.status || 'Active';
            
            // Update status color
            const statusClasses = {
                'active': 'bg-green-500',
                'on-hold': 'bg-yellow-500',
                'completed': 'bg-blue-500',
                'archived': 'bg-gray-500'
            };
            
            // Remove all status classes
            Object.values(statusClasses).forEach(cls => {
                statusEl.classList.remove(cls);
            });
            
            // Add current status class
            const statusClass = statusClasses[project.status?.toLowerCase()] || statusClasses.active;
            statusEl.classList.add(statusClass);
        }
    }

    /**
     * Update project metrics display
     * @param {string} projectId - Project ID
     * @param {Object} taskCounts - Task count data
     */
    updateProjectMetrics(projectId, taskCounts) {
        if (!projectId || !taskCounts || this.currentProject?.id !== projectId) return;
        
        const completionPercentage = document.getElementById('projectCompletionPercentage');
        const progressBar = document.getElementById('projectProgressBar');
        const totalTimeSpent = document.getElementById('totalTimeSpent');
        const avgTaskCompletion = document.getElementById('avgTaskCompletion');
        
        // Calculate completion percentage
        const totalTasks = taskCounts.total;
        const completedTasks = taskCounts.done;
        
        const percentComplete = totalTasks > 0 ? 
            Math.round((completedTasks / totalTasks) * 100) : 0;
        
        if (completionPercentage) {
            completionPercentage.textContent = `${percentComplete}%`;
        }
        
        if (progressBar) {
            progressBar.style.width = `${percentComplete}%`;
            
            // Update progress bar color based on completion
            progressBar.className = 'progress-bar';
            
            if (percentComplete >= 100) {
                progressBar.classList.add('bg-success-color');
            } else if (percentComplete > 66) {
                progressBar.classList.add('bg-accent-primary');
            } else if (percentComplete > 33) {
                progressBar.classList.add('bg-accent-secondary');
            } else {
                progressBar.classList.add('bg-gray-400');
            }
        }
        
        // Get all tasks for this project to calculate time metrics
        if (window.StorageManager && (totalTimeSpent || avgTaskCompletion)) {
            StorageManager.getTasksByProject(projectId).then(tasks => {
                // Calculate total time spent
                let totalTimeMs = 0;
                let completedTasksTimeMs = 0;
                let completedTaskCount = 0;
                
                tasks.forEach(task => {
                    if (task.timeTracking && task.timeTracking.totalTime) {
                        const taskTime = task.timeTracking.totalTime;
                        
                        // Add to total time
                        totalTimeMs += taskTime;
                        
                        // Add to completed tasks time if task is done
                        if (task.status === 'done') {
                            completedTasksTimeMs += taskTime;
                            completedTaskCount++;
                        }
                    }
                });
                
                // Format and display total time
                if (totalTimeSpent) {
                    const formattedTime = window.DateFormatter ? 
                        DateFormatter.formatDuration(totalTimeMs) : 
                        this._formatDuration(totalTimeMs);
                    
                    totalTimeSpent.textContent = formattedTime;
                }
                
                // Calculate and display average task completion time
                if (avgTaskCompletion) {
                    const avgTimeMs = completedTaskCount > 0 ? 
                        completedTasksTimeMs / completedTaskCount : 0;
                    
                    const formattedAvgTime = window.DateFormatter ? 
                        DateFormatter.formatDuration(avgTimeMs) : 
                        this._formatDuration(avgTimeMs);
                    
                    avgTaskCompletion.textContent = formattedAvgTime;
                }
            }).catch(error => {
                console.error("Error fetching tasks for metrics:", error);
            });
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
     * Open the project modal for creating or editing
     * @param {string} [projectId=null] - Project ID for editing, null for new project
     */
    async openProjectModal(projectId = null) {
        const modal = document.getElementById('projectModal');
        const form = document.getElementById('projectForm');
        const titleEl = document.getElementById('projectModalTitle');
        const idField = document.getElementById('projectId');
        
        if (!modal || !form) return;
        
        // Reset form
        form.reset();
        if (idField) idField.value = '';
        
        if (projectId && window.StorageManager) {
            // Edit existing project
            try {
                const project = await StorageManager.getProjectById(projectId);
                if (!project) return;
                
                if (titleEl) titleEl.textContent = 'Edit Project';
                if (idField) idField.value = project.id;
                
                // Set form fields
                const nameInput = document.getElementById('projectNameInput');
                const descInput = document.getElementById('projectDescInput');
                const startInput = document.getElementById('projectStartInput');
                const endInput = document.getElementById('projectEndInput');
                const statusInput = document.getElementById('projectStatusInput');
                
                if (nameInput) nameInput.value = project.name;
                if (descInput) descInput.value = project.description || '';
                if (startInput) startInput.value = project.startDate || '';
                if (endInput) endInput.value = project.endDate || '';
                if (statusInput && project.status) statusInput.value = project.status;
            } catch (error) {
                console.error("Error fetching project for editing:", error);
            }
        } else {
            // New project
            if (titleEl) titleEl.textContent = 'New Project';
            
            // Set default dates
            const startInput = document.getElementById('projectStartInput');
            if (startInput) {
                startInput.value = new Date().toISOString().split('T')[0];
            }
        }
        
        // Show modal
        modal.classList.add('active');
    }

    /**
     * Close the project modal
     */
    closeProjectModal() {
        const modal = document.getElementById('projectModal');
        if (modal) modal.classList.remove('active');
    }

    /**
     * Save project data from form
     */
    async saveProject() {
        if (!window.StorageManager) return;
        
        const form = document.getElementById('projectForm');
        const projectId = document.getElementById('projectId')?.value;
        
        if (!form) return;
        
        // Get form data
        const projectData = {
            name: document.getElementById('projectNameInput')?.value,
            description: document.getElementById('projectDescInput')?.value,
            startDate: document.getElementById('projectStartInput')?.value || null,
            endDate: document.getElementById('projectEndInput')?.value || null,
            status: document.getElementById('projectStatusInput')?.value || 'active'
        };
        
        // Validation
        if (!projectData.name || projectData.name.trim() === '') {
            if (window.NotificationManager) {
                NotificationManager.error('Project name is required');
            } else {
                alert('Project name is required');
            }
            return;
        }
        
        try {
            let result;
            
            if (projectId) {
                // Update existing project
                result = await StorageManager.updateProject(projectId, projectData);
            } else {
                // Create new project
                result = await StorageManager.addProject(projectData);
            }
            
            if (result) {
                this.closeProjectModal();
            } else {
                // Show error
                if (window.NotificationManager) {
                    NotificationManager.error('Failed to save project');
                } else {
                    alert('Failed to save project');
                }
            }
        } catch (error) {
            console.error("Error saving project:", error);
            if (window.NotificationManager) {
                NotificationManager.error('Failed to save project: ' + error.message);
            } else {
                alert('Failed to save project: ' + error.message);
            }
        }
    }

    /**
     * Confirm project deletion
     * @param {string} projectId - Project ID
     */
    async confirmDeleteProject(projectId) {
        if (!projectId || !window.StorageManager) return;
        
        try {
            const project = await StorageManager.getProjectById(projectId);
            if (!project) return;
            
            // Store project ID for deletion
            this._deleteProjectId = projectId;
            
            // Update confirmation message
            const deleteMessage = document.getElementById('deleteMessage');
            if (deleteMessage) {
                deleteMessage.innerHTML = `
                    Are you sure you want to delete the project <strong>${project.name}</strong>?
                    <p class="text-red-500 mt-2">
                        This will also delete all tasks associated with this project. 
                        This action cannot be undone.
                    </p>
                `;
            }
            
            // Show delete modal
            const deleteModal = document.getElementById('deleteModal');
            if (deleteModal) deleteModal.classList.add('active');
        } catch (error) {
            console.error("Error fetching project for deletion:", error);
        }
    }

    /**
     * Close the delete confirmation modal
     */
    closeDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) deleteModal.classList.remove('active');
        this._deleteProjectId = null;
    }

    /**
     * Delete the confirmed project
     */
    async deleteProject() {
        if (!this._deleteProjectId || !window.StorageManager) {
            this.closeDeleteModal();
            return;
        }
        
        try {
            // Delete the project
            const success = await StorageManager.deleteProject(this._deleteProjectId);
            
            // Close delete modal
            this.closeDeleteModal();
            
            if (!success && window.NotificationManager) {
                NotificationManager.error('Failed to delete project');
            }
        } catch (error) {
            console.error("Error deleting project:", error);
            this.closeDeleteModal();
            
            if (window.NotificationManager) {
                NotificationManager.error('Failed to delete project: ' + error.message);
            } else {
                alert('Failed to delete project: ' + error.message);
            }
        }
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global ProjectManager instance
    window.projectManager = new ProjectManager();
});