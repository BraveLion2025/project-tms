/**
 * Analytics Manager for Project-TMS
 * Handles analytics data processing and display
 */
class AnalyticsManager {
    constructor() {
        this.currentProjectFilter = '';
        this.currentPeriodFilter = 'all';
        this.init();
    }

    /**
     * Initialize the analytics manager
     */
    init() {
        this._setupEventListeners();
        this._loadData();
        
        // Subscribe to events
        if (window.EventBus) {
            EventBus.subscribe('data:imported', () => {
                this._loadData();
            });
        }
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Project filter change
        const projectSelect = document.getElementById('analyticsProjectSelect');
        if (projectSelect) {
            projectSelect.addEventListener('change', (e) => {
                this.currentProjectFilter = e.target.value;
                this._updateAnalytics();
            });
        }
        
        // Period filter change
        const periodSelect = document.getElementById('analyticsPeriodSelect');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.currentPeriodFilter = e.target.value;
                this._updateAnalytics();
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('exportAnalyticsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this._showExportModal();
            });
        }
        
        // Export modal buttons
        const confirmExportBtn = document.getElementById('confirmExportBtn');
        if (confirmExportBtn) {
            confirmExportBtn.addEventListener('click', () => {
                this._exportAnalytics();
                this._closeExportModal();
            });
        }
        
        const cancelExportBtn = document.getElementById('cancelExportBtn');
        if (cancelExportBtn) {
            cancelExportBtn.addEventListener('click', () => {
                this._closeExportModal();
            });
        }
        
        const closeExportModalBtn = document.getElementById('closeExportModalBtn');
        if (closeExportModalBtn) {
            closeExportModalBtn.addEventListener('click', () => {
                this._closeExportModal();
            });
        }
        
        // Handle window resize for charts
        window.addEventListener('resize', this._handleResize.bind(this));
    }

    /**
     * Load data from storage
     * @private
     */
    _loadData() {
        if (!window.StorageManager) return;
        
        // Get all projects
        const projects = StorageManager.getProjects();
        
        // Populate project filter dropdown
        this._populateProjectFilter(projects);
        
        // Update analytics with loaded data
        this._updateAnalytics();
    }

    /**
     * Populate project filter dropdown
     * @private
     * @param {Array} projects - Project data
     */
    _populateProjectFilter(projects) {
        const projectSelect = document.getElementById('analyticsProjectSelect');
        if (!projectSelect) return;
        
        // Clear existing options except first one
        while (projectSelect.options.length > 1) {
            projectSelect.remove(1);
        }
        
        // Add options for each project
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }

    /**
     * Update analytics displays with current filters
     * @private
     */
    _updateAnalytics() {
        if (!window.StorageManager) return;
        
        // Get all data
        const allProjects = StorageManager.getProjects();
        const allTasks = StorageManager.getTasks();
        
        // Apply project filter
        const filteredTasks = this.currentProjectFilter ? 
            allTasks.filter(task => task.projectId === this.currentProjectFilter) : 
            allTasks;
        
        // Apply time period filter
        const filteredTasksByPeriod = this._applyPeriodFilter(filteredTasks);
        
        // Update overview metrics
        this._updateOverviewMetrics(allProjects, filteredTasksByPeriod);
        
        // Update task productivity table
        this._updateTaskProductivity(filteredTasksByPeriod);
        
        // Update charts
        this._updateCharts(allProjects, filteredTasksByPeriod);
        
        // Update recent activity
        this._updateRecentActivity(filteredTasksByPeriod);
    }

    /**
     * Apply time period filter to tasks
     * @private
     * @param {Array} tasks - Task data
     * @returns {Array} Filtered tasks
     */
    _applyPeriodFilter(tasks) {
        if (this.currentPeriodFilter === 'all') {
            return tasks;
        }
        
        const now = new Date();
        let startDate;
        
        if (this.currentPeriodFilter === 'month') {
            // Start of current month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (this.currentPeriodFilter === 'week') {
            // Start of current week (Sunday)
            const day = now.getDay(); // 0 = Sunday
            startDate = new Date(now);
            startDate.setDate(now.getDate() - day);
            startDate.setHours(0, 0, 0, 0);
        }
        
        // Filter tasks by updatedAt or createdAt date
        return tasks.filter(task => {
            const taskDate = new Date(task.updatedAt || task.createdAt);
            return taskDate >= startDate;
        });
    }

    /**
     * Update overview metrics
     * @private
     * @param {Array} projects - Project data
     * @param {Array} tasks - Task data
     */
    _updateOverviewMetrics(projects, tasks) {
        // Total projects
        const totalProjectsEl = document.getElementById('totalProjects');
        if (totalProjectsEl) {
            totalProjectsEl.textContent = this.currentProjectFilter ? 
                '1' : projects.length.toString();
        }
        
        // Active tasks (not done)
        const activeTasksEl = document.getElementById('activeTasks');
        if (activeTasksEl) {
            const activeTasks = tasks.filter(t => t.status !== 'done').length;
            activeTasksEl.textContent = activeTasks.toString();
        }
        
        // Completion rate
        const completionRateEl = document.getElementById('completionRate');
        if (completionRateEl) {
            const completedTasks = tasks.filter(t => t.status === 'done').length;
            const completionRate = tasks.length > 0 ? 
                Math.round((completedTasks / tasks.length) * 100) : 0;
            
            completionRateEl.textContent = `${completionRate}%`;
        }
        
        // Time tracked
        const timeTrackedEl = document.getElementById('timeTracked');
        if (timeTrackedEl) {
            // Calculate total tracked time
            let totalTimeMs = 0;
            
            tasks.forEach(task => {
                if (task.timeTracking && task.timeTracking.totalTime) {
                    totalTimeMs += task.timeTracking.totalTime;
                }
            });
            
            // Convert to hours
            const totalHours = Math.round(totalTimeMs / (1000 * 60 * 60));
            
            timeTrackedEl.textContent = `${totalHours}h`;
        }
        
        // For now, just use placeholder values for change metrics
        // In a real app, these would be calculated by comparing with previous periods
        document.getElementById('projectChange')?.textContent = '+5% from last month';
        document.getElementById('taskChange')?.textContent = '+12% from last month';
        document.getElementById('rateChange')?.textContent = '+3% from last month';
        document.getElementById('timeChange')?.textContent = '+8h from last month';
    }

    /**
     * Update task productivity table
     * @private
     * @param {Array} tasks - Task data
     */
    _updateTaskProductivity(tasks) {
        // Counts by status
        const counts = {
            todo: tasks.filter(t => t.status === 'todo').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            review: tasks.filter(t => t.status === 'review').length,
            done: tasks.filter(t => t.status === 'done').length
        };
        
        // Time spent by status
        const timeSpent = {
            todo: 0,
            inProgress: 0,
            review: 0,
            done: 0
        };
        
        // Calculate time spent
        tasks.forEach(task => {
            if (task.timeTracking && task.timeTracking.totalTime) {
                const statusKey = task.status === 'in-progress' ? 'inProgress' : task.status;
                if (timeSpent[statusKey] !== undefined) {
                    timeSpent[statusKey] += task.timeTracking.totalTime;
                }
            }
        });
        
        // Update count cells
        document.getElementById('todoTaskCount')?.textContent = counts.todo;
        document.getElementById('inProgressTaskCount')?.textContent = counts.inProgress;
        document.getElementById('reviewTaskCount')?.textContent = counts.review;
        document.getElementById('doneTaskCount')?.textContent = counts.done;
        
        // Format and update time spent cells
        const formatTime = (ms) => {
            const hours = Math.floor(ms / (1000 * 60 * 60));
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        };
        
        document.getElementById('todoTimeSpent')?.textContent = formatTime(timeSpent.todo);
        document.getElementById('inProgressTimeSpent')?.textContent = formatTime(timeSpent.inProgress);
        document.getElementById('reviewTimeSpent')?.textContent = formatTime(timeSpent.review);
        document.getElementById('doneTimeSpent')?.textContent = formatTime(timeSpent.done);
        
        // Calculate and update average time per task
        const calcAvgTime = (totalTime, count) => {
            if (count === 0) return '0h 0m';
            return formatTime(totalTime / count);
        };
        
        document.getElementById('todoAvgTime')?.textContent = calcAvgTime(timeSpent.todo, counts.todo);
        document.getElementById('inProgressAvgTime')?.textContent = calcAvgTime(timeSpent.inProgress, counts.inProgress);
        document.getElementById('reviewAvgTime')?.textContent = calcAvgTime(timeSpent.review, counts.review);
        document.getElementById('doneAvgTime')?.textContent = calcAvgTime(timeSpent.done, counts.done);
    }

    /**
     * Update charts with filtered data
     * @private
     * @param {Array} projects - Project data
     * @param {Array} tasks - Task data
     */
    _updateCharts(projects, tasks) {
        if (!window.projectCharts) return;
        
        // Prepare filtered data object for charts
        const chartsData = {
            projects: this.currentProjectFilter ? 
                projects.filter(p => p.id === this.currentProjectFilter) : 
                projects,
            tasks: tasks
        };
        
        // Initialize charts with the main container
        projectCharts.initCharts(document, chartsData);
    }

    /**
     * Update recent activity display
     * @private
     * @param {Array} tasks - Task data
     */
    _updateRecentActivity(tasks) {
        const container = document.getElementById('recentActivityContainer');
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Sort tasks by updatedAt date (newest first)
        const sortedTasks = [...tasks].sort((a, b) => {
            return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        });
        
        // Limit to 5 most recent
        const recentTasks = sortedTasks.slice(0, 5);
        
        if (recentTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state py-6">
                    <p class="text-text-secondary">No recent activity to display</p>
                </div>
            `;
            return;
        }
        
        // Create activity items
        recentTasks.forEach(task => {
            const date = new Date(task.updatedAt || task.createdAt);
            const formattedDate = window.DateFormatter ? 
                DateFormatter.formatDateTime(date) : 
                date.toLocaleString();
            
            const activityItem = document.createElement('div');
            activityItem.className = 'flex items-start p-3 border-b border-border-color last:border-0';
            
            // Determine icon and action text based on status
            let icon, action;
            
            if (task.status === 'done') {
                icon = '<i class="fas fa-check-circle text-success-color"></i>';
                action = 'completed';
            } else if (task.status === 'in-progress') {
                icon = '<i class="fas fa-play-circle text-accent-primary"></i>';
                action = 'started working on';
            } else if (task.status === 'review') {
                icon = '<i class="fas fa-clipboard-check text-accent-secondary"></i>';
                action = 'submitted for review';
            } else {
                icon = '<i class="fas fa-plus-circle text-text-secondary"></i>';
                action = 'created';
            }
            
            activityItem.innerHTML = `
                <div class="flex-shrink-0 mt-1 mr-3">
                    ${icon}
                </div>
                <div class="flex-1">
                    <p class="text-sm">
                        <span class="font-medium">User</span> ${action} 
                        <span class="font-medium">${task.title}</span>
                    </p>
                    <p class="text-xs text-text-secondary mt-1">${formattedDate}</p>
                </div>
            `;
            
            container.appendChild(activityItem);
        });
    }

    /**
     * Show the export modal
     * @private
     */
    _showExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Close the export modal
     * @private
     */
    _closeExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Export analytics data
     * @private
     */
    _exportAnalytics() {
        if (!window.StorageManager) return;
        
        // Get export format
        const formatRadios = document.getElementsByName('exportFormat');
        let selectedFormat = 'csv';
        
        for (const radio of formatRadios) {
            if (radio.checked) {
                selectedFormat = radio.value;
                break;
            }
        }
        
        // Get include options
        const includeProjects = document.getElementById('includeProjectData')?.checked || false;
        const includeTasks = document.getElementById('includeTaskData')?.checked || false;
        const includeTime = document.getElementById('includeTimeData')?.checked || false;
        
        // Get filtered data
        const allProjects = StorageManager.getProjects();
        const allTasks = StorageManager.getTasks();
        
        const projects = this.currentProjectFilter ? 
            allProjects.filter(p => p.id === this.currentProjectFilter) : 
            allProjects;
            
        const tasks = this.currentProjectFilter ? 
            allTasks.filter(t => t.projectId === this.currentProjectFilter) : 
            allTasks;
        
        const filteredTasks = this._applyPeriodFilter(tasks);
        
        // Prepare export data
        const exportData = {};
        
        if (includeProjects) {
            exportData.projects = projects;
        }
        
        if (includeTasks) {
            exportData.tasks = filteredTasks.map(task => {
                // If not including time data, remove time tracking info
                if (!includeTime) {
                    const { timeTracking, ...taskWithoutTime } = task;
                    return taskWithoutTime;
                }
                return task;
            });
        }
        
        // Generate and download the file
        if (selectedFormat === 'json') {
            this._downloadJson(exportData);
        } else if (selectedFormat === 'csv') {
            this._downloadCsv(exportData);
        } else if (selectedFormat === 'pdf') {
            // In a real app, this would generate a PDF
            alert('PDF export is not implemented in this demo');
        }
    }

    /**
     * Download data as JSON
     * @private
     * @param {Object} data - Data to export
     */
    _downloadJson(data) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        
        this._downloadFile(blob, 'project-tms-analytics.json');
    }

    /**
     * Download data as CSV
     * @private
     * @param {Object} data - Data to export
     */
    _downloadCsv(data) {
        let csv = '';
        
        // Projects CSV
        if (data.projects && data.projects.length > 0) {
            csv += 'Projects\n';
            csv += 'ID,Name,Description,Start Date,End Date,Status\n';
            
            data.projects.forEach(project => {
                csv += `${project.id},`;
                csv += `"${(project.name || '').replace(/"/g, '""')}",`;
                csv += `"${(project.description || '').replace(/"/g, '""')}",`;
                csv += `${project.startDate || ''},`;
                csv += `${project.endDate || ''},`;
                csv += `${project.status || ''}\n`;
            });
            
            csv += '\n';
        }
        
        // Tasks CSV
        if (data.tasks && data.tasks.length > 0) {
            csv += 'Tasks\n';
            csv += 'ID,Title,Description,Status,Priority,Due Date,Project ID';
            
            // Add time tracking columns if present in first task
            if (data.tasks[0].timeTracking) {
                csv += ',Time Spent (ms)';
            }
            
            csv += '\n';
            
            data.tasks.forEach(task => {
                csv += `${task.id},`;
                csv += `"${(task.title || '').replace(/"/g, '""')}",`;
                csv += `"${(task.description || '').replace(/"/g, '""')}",`;
                csv += `${task.status || ''},`;
                csv += `${task.priority || ''},`;
                csv += `${task.dueDate || ''},`;
                csv += `${task.projectId || ''}`;
                
                // Add time tracking data if present
                if (task.timeTracking) {
                    csv += `,${task.timeTracking.totalTime || 0}`;
                }
                
                csv += '\n';
            });
        }
        
        const blob = new Blob([csv], { type: 'text/csv' });
        this._downloadFile(blob, 'project-tms-analytics.csv');
    }

    /**
     * Download a file
     * @private
     * @param {Blob} blob - File blob
     * @param {string} filename - File name
     */
    _downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Handle window resize
     * @private
     */
    _handleResize() {
        if (window.projectCharts) {
            projectCharts.resizeCharts();
        }
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on analytics page
    if (window.location.pathname.includes('analytics')) {
        window.analyticsManager = new AnalyticsManager();
    }
});