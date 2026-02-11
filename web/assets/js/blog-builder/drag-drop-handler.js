/**
 * Blog Builder - Drag and Drop Handler
 * Handles HTML5 drag-and-drop for element creation and repositioning
 */

class DragDropHandler {
    constructor() {
        this.draggedElement = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDraggingFromSidebar = false;
        this.draggedElementData = null;
    }

    /**
     * Initialize drag-and-drop handlers
     */
    init(canvas) {
        this.canvas = canvas;
        this.setupCanvasDropZone(canvas);
        this.setupSidebarDragSource();
        this.setupCanvasDragReposition();
    }

    /**
     * Setup canvas as drop zone for new elements
     */
    setupCanvasDropZone(canvas) {
        canvas.addEventListener('dragover', (e) => this.onCanvasDragOver(e));
        canvas.addEventListener('drop', (e) => this.onCanvasDrop(e));
        canvas.addEventListener('dragleave', (e) => this.onCanvasDragLeave(e));
    }

    /**
     * Setup sidebar elements as drag sources
     */
    setupSidebarDragSource() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('draggable-element')) {
                this.onSidebarDragStart(e);
            }
        });
    }

    /**
     * Setup canvas elements for repositioning
     */
    setupCanvasDragReposition() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('canvas-element')) {
                this.onCanvasElementDragStart(e);
            }
        });

        this.canvas.addEventListener('dragover', (e) => {
            if (this.draggedElement && this.draggedElement.classList.contains('canvas-element')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }
        });

        this.canvas.addEventListener('drop', (e) => {
            if (this.draggedElement && this.draggedElement.classList.contains('canvas-element')) {
                this.onCanvasElementDrop(e);
            }
        });
    }

    /**
     * Sidebar drag start
     */
    onSidebarDragStart(e) {
        this.isDraggingFromSidebar = true;
        this.draggedElementData = e.target.dataset;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('elementType', e.target.dataset.type);

        // Create drag image
        const dragImage = document.createElement('div');
        dragImage.style.cssText = 'position: absolute; left: -9999px; background: #6605c7; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold;';
        dragImage.textContent = e.target.textContent;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => dragImage.remove(), 0);
    }

    /**
     * Canvas drag over
     */
    onCanvasDragOver(e) {
        if (this.isDraggingFromSidebar) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.canvas.classList.add('drag-over');
        }
    }

    /**
     * Canvas drag leave
     */
    onCanvasDragLeave(e) {
        if (e.target === this.canvas) {
            this.canvas.classList.remove('drag-over');
        }
    }

    /**
     * Canvas drop - create new element
     */
    onCanvasDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.canvas.classList.remove('drag-over');

        if (!this.isDraggingFromSidebar) return;

        const elementType = e.dataTransfer.getData('elementType');
        if (!elementType) return;

        const rect = this.canvas.getBoundingClientRect();
        const canvasRect = this.canvas.parentElement.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        const position = {
            top: Math.max(0, y - 30),
            left: Math.max(0, x - 60)
        };

        const element = ElementManager.createElement(elementType, position);
        if (element) {
            const command = new CreateElementCommand(element);
            UndoRedoManager.execute(command);
            AutoSaveManager.markDirty();
            BuilderUtils.showToast(`${elementType} element added`, 'success');
        }

        this.isDraggingFromSidebar = false;
    }

    /**
     * Canvas element drag start
     */
    onCanvasElementDragStart(e) {
        if (e.dataTransfer.effectAllowed === 'copy') return; // Ignore sidebar drags

        this.draggedElement = e.target;
        const elementId = e.target.dataset.elementId;

        try {
            ElementManager.selectElement(elementId);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('elementId', elementId);

            // Create drag image
            const dragImage = document.createElement('div');
            dragImage.style.cssText = 'position: absolute; left: -9999px; background: rgba(102, 5, 199, 0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;';
            dragImage.textContent = 'Moving...';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => dragImage.remove(), 0);
        } catch (error) {
            console.error('Error in drag start:', error);
        }
    }

    /**
     * Canvas element drop - reposition
     */
    onCanvasElementDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const elementId = e.dataTransfer.getData('elementId');
        if (!elementId) return;

        const rect = this.canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const x = e.clientX - rect.left;

        const element = ElementManager.getElementById(elementId);
        if (element) {
            const oldData = BuilderUtils.deepClone(element);
            element.position.top = Math.max(0, y - 30);
            element.position.left = Math.max(0, x - 60);

            const command = new UpdateElementCommand(elementId, oldData, element);
            UndoRedoManager.execute(command);
            AutoSaveManager.markDirty();
        }

        this.draggedElement = null;
    }

    /**
     * Enable/Disable dragging
     */
    setDraggingEnabled(enabled) {
        if (enabled) {
            this.canvas.style.cursor = 'grab';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
}

/**
 * Export
 */
window.DragDropHandler = new DragDropHandler();
