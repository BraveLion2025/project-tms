/**
 * Time Tracker for Project-TMS
 * Manages time tracking functionality for tasks
 */

const TimeTracker = {
    activeTimerId: null,
    
    /**
     * Initialize time tracker
     */
    init: function() {
        this.startTimerUpdates();
        this.setupBeforeUnload();
    },
    
    /**
     * Start periodic timer updates for active tasks
     */
    startTimerUpdates: function() {
        // Update time displays every second
        setInterval(() => {
            // Find active task
            const tasks = StorageManager.getTasks();
            const activeTask = tasks.find(task => 
                task.timeTracking && 
                task.timeTracking.isActive
            );
            
            if (activeTask) {
                // Update active task time display
                const taskElements = document.querySelectorAll(`.task-card[data-task-id="${activeTask.id}"]`);
                taskElements.forEach(taskEl => {
                    const timeDisplay = taskEl.querySelector('.task-time-display');
                    if (timeDisplay && TasksManager) {
                        const timeSpent = TasksManager.calculateTimeSpent(activeTask);
                        timeDisplay.textContent = `Time: ${TasksManager.formatTimeSpent(timeSpent)}`;
                    }
                });
                
                // Update project metrics if needed
                if (window.ProjectsManager && ProjectsManager.currentProject) {
                    ProjectsManager.updateProjectMetrics(ProjectsManager.currentProject.id);
                }
                
                // Update view task modal if open and showing the active task
                if (window.TasksManager && TasksManager.currentTask && TasksManager.currentTask.id === activeTask.id) {
                    const timeInfoEl = document.getElementById('viewTaskTimeInfo');
                    if (timeInfoEl) {
                        const timeSpentEl = timeInfoEl.querySelector('.time-spent-value');
                        if (timeSpentEl && TasksManager) {
                            const totalTime = TasksManager.calculateTimeSpent(activeTask);
                            const timeSpentText = TasksManager.formatTimeSpent(totalTime);
                            timeSpentEl.textContent = `Time spent: ${timeSpentText}`;
                        } else if (TasksManager) {
                            TasksManager.updateTaskTimeInfo(activeTask);
                        }
                    }
                }
            }
        }, 1000);
    },
    
    /**
     * Setup event handler for page unload to pause timers
     */
    setupBeforeUnload: function() {
        window.addEventListener('beforeunload', () => {
            this.handleUnload();
        });
    },
    
    /**
     * Handle timer actions on page unload
     */
    handleUnload: function() {
        // Automatically pause any active timers when the page is closed
        const tasks = StorageManager.getTasks();
        const activeTask = tasks.find(task => 
            task.timeTracking && 
            task.timeTracking.isActive
        );
        
        if (activeTask) {
            // Calculate final time
            const now = new Date();
            const lastStarted = new Date(activeTask.timeTracking.lastStarted);
            const timeSpentThisSession = now - lastStarted;
            
            const updatedTimeTracking = {
                ...activeTask.timeTracking,
                isActive: false,
                totalTime: (activeTask.timeTracking.totalTime || 0) + timeSpentThisSession,
                lastStarted: null
            };
            
            // Update task with new time tracking data
            StorageManager.updateTask(activeTask.id, {
                timeTracking: updatedTimeTracking
            });
        }
    }
};