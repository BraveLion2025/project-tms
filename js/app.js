/**
 * Main Application Script for Project-TMS
 * Initializes and connects all components
 */

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const projectSelect = document.getElementById('projectSelect');
    const projectDetails = document.getElementById('projectDetails');
    const taskManagement = document.getElementById('taskManagement');
    const noProjectsPlaceholder = document.getElementById('noProjectsPlaceholder');
    const createFirstProjectBtn = document.getElementById('createFirstProjectBtn');
    const projectModal = document.getElementById('projectModal');
    const projectForm = document.getElementById('projectForm');
    const cancelProjectBtn = document.getElementById('cancelProjectBtn');
    const editProjectBtn = document.getElementById('editProjectBtn');
    const deleteProjectBtn = document.getElementById('deleteProjectBtn');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    // Load projects from localStorage
    let projects = StorageManager.getProjects();
    let currentProjectId = null;

    // Initialize project select
    function updateProjectSelect() {
        projectSelect.innerHTML = '<option value="">Select a project</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }

    // Show/hide project details
    function toggleProjectDetails(show) {
        projectDetails.classList.toggle('hidden', !show);
        taskManagement.classList.toggle('hidden', !show);
        noProjectsPlaceholder.classList.toggle('hidden', show);
    }

    // Display project details
    function displayProjectDetails(projectId) {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        currentProjectId = projectId;
        document.getElementById('projectTitle').textContent = project.name;
        document.getElementById('projectDescription').textContent = project.description;
        document.getElementById('projectStartDate').textContent = new Date(project.startDate).toLocaleDateString();
        document.getElementById('projectEndDate').textContent = new Date(project.endDate).toLocaleDateString();
        document.getElementById('projectStatus').textContent = project.status;

        // Update project progress
        const projectTasks = StorageManager.getTasks().filter(task => task.projectId === projectId);
        const completedTasks = projectTasks.filter(task => task.status === 'done');
        const completionPercentage = projectTasks.length > 0 
            ? Math.round((completedTasks.length / projectTasks.length) * 100) 
            : 0;

        document.getElementById('projectCompletionPercentage').textContent = `${completionPercentage}%`;
        document.getElementById('projectProgressBar').style.width = `${completionPercentage}%`;

        // Update task counts
        document.getElementById('todoCount').textContent = projectTasks.filter(task => task.status === 'todo').length;
        document.getElementById('inProgressCount').textContent = projectTasks.filter(task => task.status === 'in-progress').length;
        document.getElementById('reviewCount').textContent = projectTasks.filter(task => task.status === 'review').length;
        document.getElementById('doneCount').textContent = completedTasks.length;

        // Enable/disable project management buttons
        editProjectBtn.disabled = false;
        deleteProjectBtn.disabled = false;

        // Update task manager with current project
        window.taskManager.setCurrentProject(projectId);

        toggleProjectDetails(true);
    }

    // Show project modal
    function showProjectModal(project = null) {
        const modalTitle = document.getElementById('projectModalTitle');
        const projectIdInput = document.getElementById('projectId');
        const projectNameInput = document.getElementById('projectNameInput');
        const projectDescInput = document.getElementById('projectDescInput');
        const projectStartInput = document.getElementById('projectStartInput');
        const projectEndInput = document.getElementById('projectEndInput');

        if (project) {
            modalTitle.textContent = 'Edit Project';
            projectIdInput.value = project.id;
            projectNameInput.value = project.name;
            projectDescInput.value = project.description;
            projectStartInput.value = project.startDate;
            projectEndInput.value = project.endDate;
        } else {
            modalTitle.textContent = 'New Project';
            projectIdInput.value = '';
            projectForm.reset();
        }

        projectModal.classList.remove('hidden');
    }

    // Hide project modal
    function hideProjectModal() {
        projectModal.classList.add('hidden');
        projectForm.reset();
    }

    // Event Listeners
    projectSelect.addEventListener('change', (e) => {
        const projectId = e.target.value;
        if (projectId) {
            displayProjectDetails(projectId);
        } else {
            toggleProjectDetails(false);
            currentProjectId = null;
            editProjectBtn.disabled = true;
            deleteProjectBtn.disabled = true;
            window.taskManager.setCurrentProject(null);
        }
    });

    createFirstProjectBtn.addEventListener('click', () => {
        showProjectModal();
    });

    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const projectId = document.getElementById('projectId').value;
        const projectData = {
            name: document.getElementById('projectNameInput').value,
            description: document.getElementById('projectDescInput').value,
            startDate: document.getElementById('projectStartInput').value,
            endDate: document.getElementById('projectEndInput').value,
            status: 'active'
        };

        if (projectId) {
            // Update existing project
            StorageManager.updateProject(projectId, projectData);
        } else {
            // Add new project
            StorageManager.addProject(projectData);
        }

        // Update projects list
        projects = StorageManager.getProjects();

        // Update UI
        updateProjectSelect();
        if (!projectId) {
            projectSelect.value = projectData.id;
            displayProjectDetails(projectData.id);
        }

        hideProjectModal();
    });

    cancelProjectBtn.addEventListener('click', hideProjectModal);

    editProjectBtn.addEventListener('click', () => {
        if (currentProjectId) {
            const project = projects.find(p => p.id === currentProjectId);
            if (project) {
                showProjectModal(project);
            }
        }
    });

    deleteProjectBtn.addEventListener('click', () => {
        if (currentProjectId) {
            deleteModal.classList.remove('hidden');
        }
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (currentProjectId) {
            // Delete project and all associated data
            StorageManager.deleteProject(currentProjectId);
            
            // Update projects list
            projects = StorageManager.getProjects();

            // Update UI
            updateProjectSelect();
            toggleProjectDetails(false);
            currentProjectId = null;
            editProjectBtn.disabled = true;
            deleteProjectBtn.disabled = true;
            window.taskManager.setCurrentProject(null);
        }
        deleteModal.classList.add('hidden');
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
    });

    // Initialize UI
    updateProjectSelect();
    if (projects.length === 0) {
        toggleProjectDetails(false);
    }
});

/**
 * Setup keyboard shortcuts for common actions
 */
function setupKeyboardShortcuts() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC key to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.fixed').forEach(modal => {
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Ctrl+N to create new project
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            showProjectModal();
        }
        
        // Ctrl+T to create new task (when a project is selected)
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            if (currentProjectId) {
                window.taskManager.openTaskModal();
            }
        }
    });
}

/**
 * Export project data to a file
 */
function exportProjectData() {
    const data = StorageManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-tms-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize keyboard shortcuts
setupKeyboardShortcuts();