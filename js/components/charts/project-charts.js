/**
 * Project Charts Component for Project-TMS
 * Handles chart creation and data visualization for project analytics
 */
class ProjectCharts {
    constructor() {
        this.chartInstances = {};
        this.chartColors = {
            todo: '#9ca3af',
            inProgress: '#9333ea',
            review: '#3b82f6',
            done: '#10b981'
        };
    }
    
    /**
     * Initialize charts for a specific container
     * @param {HTMLElement} container - Container element for charts
     * @param {Object} data - Data for charts
     */
    initCharts(container, data) {
        if (!container || !data) return;
        
        // Find all chart containers
        const chartElements = container.querySelectorAll('[data-chart]');
        
        chartElements.forEach(element => {
            const chartType = element.dataset.chart;
            
            if (chartType && this[`create${chartType}Chart`]) {
                // Call the appropriate chart creation method
                this[`create${chartType}Chart`](element, data);
            }
        });
    }
    
    /**
     * Create a task distribution chart
     * @param {HTMLElement} element - Chart container element
     * @param {Object} data - Chart data
     */
    createTaskDistributionChart(element, data) {
        if (!element || !data || !window.Chart) return;
        
        const chartId = element.id || `chart-${Date.now()}`;
        const ctx = element.getContext('2d');
        
        // Clean up existing chart
        if (this.chartInstances[chartId]) {
            this.chartInstances[chartId].destroy();
        }
        
        // Prepare data
        const tasksByStatus = {
            todo: data.tasks.filter(t => t.status === 'todo').length,
            inProgress: data.tasks.filter(t => t.status === 'in-progress').length,
            review: data.tasks.filter(t => t.status === 'review').length,
            done: data.tasks.filter(t => t.status === 'done').length
        };
        
        // Create chart
        this.chartInstances[chartId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['To Do', 'In Progress', 'Review', 'Done'],
                datasets: [{
                    data: [
                        tasksByStatus.todo,
                        tasksByStatus.inProgress,
                        tasksByStatus.review,
                        tasksByStatus.done
                    ],
                    backgroundColor: [
                        this.chartColors.todo,
                        this.chartColors.inProgress,
                        this.chartColors.review,
                        this.chartColors.done
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.raw;
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }
    
    /**
     * Create a project progress chart
     * @param {HTMLElement} element - Chart container element
     * @param {Object} data - Chart data
     */
    createProjectProgressChart(element, data) {
        if (!element || !data || !window.Chart) return;
        
        const chartId = element.id || `chart-${Date.now()}`;
        const ctx = element.getContext('2d');
        
        // Clean up existing chart
        if (this.chartInstances[chartId]) {
            this.chartInstances[chartId].destroy();
        }
        
        // Prepare data - project completion over time
        const projectsWithCompletion = data.projects.map(project => {
            const projectTasks = data.tasks.filter(t => t.projectId === project.id);
            const completedTasks = projectTasks.filter(t => t.status === 'done').length;
            const completionRate = projectTasks.length > 0 ? 
                (completedTasks / projectTasks.length) * 100 : 0;
            
            return {
                name: project.name,
                completion: Math.round(completionRate)
            };
        });
        
        // Sort by completion rate (highest first)
        projectsWithCompletion.sort((a, b) => b.completion - a.completion);
        
        // Limit to top 10 projects
        const topProjects = projectsWithCompletion.slice(0, 10);
        
        // Create chart
        this.chartInstances[chartId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topProjects.map(p => p.name),
                datasets: [{
                    label: 'Completion %',
                    data: topProjects.map(p => p.completion),
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Completion Percentage'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Completion: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create a time tracking chart
     * @param {HTMLElement} element - Chart container element
     * @param {Object} data - Chart data
     */
    createTimeTrackingChart(element, data) {
        if (!element || !data || !window.Chart) return;
        
        const chartId = element.id || `chart-${Date.now()}`;
        const ctx = element.getContext('2d');
        
        // Clean up existing chart
        if (this.chartInstances[chartId]) {
            this.chartInstances[chartId].destroy();
        }
        
        // Calculate time spent on each status
        const timeByStatus = {
            todo: 0,
            inProgress: 0,
            review: 0,
            done: 0
        };
        
        // Process task data
        data.tasks.forEach(task => {
            if (task.timeTracking && task.timeTracking.totalTime) {
                const status = task.status === 'in-progress' ? 'inProgress' : task.status;
                if (timeByStatus[status] !== undefined) {
                    timeByStatus[status] += task.timeTracking.totalTime;
                }
            }
        });
        
        // Convert time from ms to hours
        Object.keys(timeByStatus).forEach(key => {
            timeByStatus[key] = Math.round((timeByStatus[key] / (1000 * 60 * 60)) * 10) / 10;
        });
        
        // Create chart
        this.chartInstances[chartId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['To Do', 'In Progress', 'Review', 'Done'],
                datasets: [{
                    data: [
                        timeByStatus.todo,
                        timeByStatus.inProgress,
                        timeByStatus.review,
                        timeByStatus.done
                    ],
                    backgroundColor: [
                        this.chartColors.todo,
                        this.chartColors.inProgress,
                        this.chartColors.review,
                        this.chartColors.done
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return `${context.label}: ${value} hours`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create a task priority chart
     * @param {HTMLElement} element - Chart container element
     * @param {Object} data - Chart data
     */
    createPriorityChart(element, data) {
        if (!element || !data || !window.Chart) return;
        
        const chartId = element.id || `chart-${Date.now()}`;
        const ctx = element.getContext('2d');
        
        // Clean up existing chart
        if (this.chartInstances[chartId]) {
            this.chartInstances[chartId].destroy();
        }
        
        // Count tasks by priority
        const priorityCounts = {
            high: data.tasks.filter(t => t.priority === 'high').length,
            medium: data.tasks.filter(t => t.priority === 'medium').length,
            low: data.tasks.filter(t => t.priority === 'low').length
        };
        
        // Create chart
        this.chartInstances[chartId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    data: [
                        priorityCounts.high,
                        priorityCounts.medium,
                        priorityCounts.low
                    ],
                    backgroundColor: [
                        '#ef4444', // High - Red
                        '#f59e0b', // Medium - Amber
                        '#6b7280'  // Low - Gray
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.raw;
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create a time trend chart (time spent over days of the week)
     * @param {HTMLElement} element - Chart container element
     * @param {Object} data - Chart data
     */
    createTimeTrendChart(element, data) {
        if (!element || !data || !window.Chart) return;
        
        const chartId = element.id || `chart-${Date.now()}`;
        const ctx = element.getContext('2d');
        
        // Clean up existing chart
        if (this.chartInstances[chartId]) {
            this.chartInstances[chartId].destroy();
        }
        
        // Define days of the week
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Initialize time by day
        const timeByDay = daysOfWeek.reduce((acc, day) => {
            acc[day] = 0;
            return acc;
        }, {});
        
        // Process task data for time by day of week
        data.tasks.forEach(task => {
            if (task.timeTracking && task.timeTracking.totalTime) {
                // Use a placeholder for visualizing time distribution
                // In a real app, this would use actual tracking sessions per day
                
                // Assign random days for demonstration
                const randomDayIndex = Math.floor(Math.random() * 7);
                const day = daysOfWeek[randomDayIndex];
                
                // Add time (convert from ms to hours)
                timeByDay[day] += task.timeTracking.totalTime / (1000 * 60 * 60);
            }
        });
        
        // Round values
        Object.keys(timeByDay).forEach(day => {
            timeByDay[day] = Math.round(timeByDay[day] * 10) / 10;
        });
        
        // Create chart
        this.chartInstances[chartId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: daysOfWeek,
                datasets: [{
                    label: 'Hours Spent',
                    data: daysOfWeek.map(day => timeByDay[day]),
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.chartInstances = {};
    }
    
    /**
     * Resize all charts (call this on window resize)
     */
    resizeCharts() {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global ProjectCharts instance
    window.projectCharts = new ProjectCharts();
});