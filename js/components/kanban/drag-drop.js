/**
 * Drag and Drop Component for Project-TMS
 * Handles drag and drop functionality for kanban board
 */
class DragDropManager {
    constructor(options = {}) {
        this.options = {
            draggableSelector: '.task-card',
            containerSelector: '.tasks-container',
            dragActiveClass: 'dragging',
            dragHoverClass: 'drag-hover',
            ...options
        };
        
        this.draggedElement = null;
        this.containers = [];
        this.callbacks = {
            onDragStart: null,
            onDragEnd: null,
            onDrop: null
        };
        
        this.init();
    }
    
    /**
     * Initialize the drag and drop manager
     */
    init() {
        // Find all containers
        this.containers = document.querySelectorAll(this.options.containerSelector);
        
        // Set up containers for drag events
        this._setupContainers();
        
        // Set up draggable elements
        this._setupDraggables();
        
        // Listen for new elements
        if (window.EventBus) {
            EventBus.subscribe('tasks:loaded', () => {
                // Setup new draggable elements
                this._setupDraggables();
            });
        }
    }
    
    /**
     * Set up containers to accept dropped elements
     * @private
     */
    _setupContainers() {
        this.containers.forEach(container => {
            // Allow dropping
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                container.classList.add(this.options.dragHoverClass);
                
                const afterElement = this._getDragAfterElement(container, e.clientY);
                const draggable = document.querySelector(`.${this.options.dragActiveClass}`);
                
                if (draggable) {
                    if (afterElement) {
                        container.insertBefore(draggable, afterElement);
                    } else {
                        container.appendChild(draggable);
                    }
                }
            });
            
            // Handle dragleave
            container.addEventListener('dragleave', () => {
                container.classList.remove(this.options.dragHoverClass);
            });
            
            // Handle drop
            container.addEventListener('drop', (e) => {
                e.preventDefault();
                container.classList.remove(this.options.dragHoverClass);
                
                // Get status from container
                const status = this._getStatusFromContainer(container);
                
                // If we have a callback and element, trigger it
                if (this.callbacks.onDrop && this.draggedElement) {
                    const taskId = this.draggedElement.dataset.taskId;
                    
                    if (taskId && status) {
                        this.callbacks.onDrop(taskId, status);
                    }
                }
            });
        });
    }
    
    /**
     * Set up draggable elements
     * @private
     */
    _setupDraggables() {
        const draggables = document.querySelectorAll(this.options.draggableSelector);
        
        draggables.forEach(draggable => {
            // Skip if already initialized
            if (draggable.dataset.dragInitialized === 'true') return;
            
            // Mark as initialized
            draggable.dataset.dragInitialized = 'true';
            
            // Add dragstart event
            draggable.addEventListener('dragstart', (e) => {
                this.draggedElement = draggable;
                draggable.classList.add(this.options.dragActiveClass);
                
                // Set drag data (for compatibility)
                if (e.dataTransfer) {
                    const taskId = draggable.dataset.taskId;
                    if (taskId) {
                        e.dataTransfer.setData('text/plain', taskId);
                        e.dataTransfer.effectAllowed = 'move';
                    }
                }
                
                // Call callback
                if (this.callbacks.onDragStart) {
                    this.callbacks.onDragStart(draggable);
                }
                
                // Schedule a redraw after drag started (helps with drag image)
                setTimeout(() => {
                    draggable.classList.add('opacity-50');
                }, 0);
            });
            
            // Add dragend event
            draggable.addEventListener('dragend', () => {
                draggable.classList.remove(this.options.dragActiveClass, 'opacity-50');
                this.draggedElement = null;
                
                // Clean up container hover states
                this.containers.forEach(container => {
                    container.classList.remove(this.options.dragHoverClass);
                });
                
                // Call callback
                if (this.callbacks.onDragEnd) {
                    this.callbacks.onDragEnd(draggable);
                }
            });
        });
    }
    
    /**
     * Helper function to determine where to insert dragged element
     * @private
     * @param {HTMLElement} container - Container element
     * @param {number} y - Mouse Y position
     * @returns {HTMLElement|null} Element to insert before, or null to append
     */
    _getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(
            `${this.options.draggableSelector}:not(.${this.options.dragActiveClass})`
        )];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    /**
     * Get status from container element
     * @private
     * @param {HTMLElement} container - Container element
     * @returns {string|null} Status or null if not found
     */
    _getStatusFromContainer(container) {
        if (!container || !container.id) return null;
        
        const containerId = container.id;
        
        if (containerId === 'todoTasks') return 'todo';
        if (containerId === 'inProgressTasks') return 'in-progress';
        if (containerId === 'reviewTasks') return 'review';
        if (containerId === 'doneTasks') return 'done';
        
        return null;
    }
    
    /**
     * Set callback for drag start
     * @param {function} callback - Function to call on drag start
     */
    onDragStart(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onDragStart = callback;
        }
        return this;
    }
    
    /**
     * Set callback for drag end
     * @param {function} callback - Function to call on drag end
     */
    onDragEnd(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onDragEnd = callback;
        }
        return this;
    }
    
    /**
     * Set callback for drop
     * @param {function} callback - Function to call on drop
     */
    onDrop(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onDrop = callback;
        }
        return this;
    }
    
    /**
     * Refresh draggable elements
     * Call this if new elements are added to the DOM
     */
    refresh() {
        this._setupDraggables();
    }
}

// Make DragDropManager available globally
window.DragDropManager = DragDropManager;