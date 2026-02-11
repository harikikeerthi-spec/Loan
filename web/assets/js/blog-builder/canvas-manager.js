/**
 * Blog Builder - Canvas Manager
 * Manages canvas rendering and element visualization
 */

class CanvasManager {
    constructor() {
        this.canvas = null;
        this.canvasContainer = null;
        this.canvasWidth = 1200;
        this.canvasHeight = null; // Auto-height
        this.renderer = null;
        this.selectedElementDOM = null;
    }

    /**
     * Initialize canvas
     */
    init(canvasContainer) {
        this.canvasContainer = canvasContainer;
        this.createCanvas();
        this.setupCanvasEventListeners();
        DragDropHandler.init(this.canvas);
    }

    /**
     * Create canvas element
     */
    createCanvas() {
        this.canvas = document.createElement('div');
        this.canvas.id = 'blog-canvas';
        this.canvas.className = 'relative border-4 border-gray-300 bg-white overflow-auto';
        this.canvas.style.cssText = `
            width: 100%;
            background: white;
            position: relative;
            min-height: 600px;
            border: 3px dashed #cccccc;
            border-radius: 8px;
            padding: 20px;
        `;

        // Add grid background (optional)
        this.addGridBackground();

        this.canvasContainer.appendChild(this.canvas);
    }

    /**
     * Add grid background for visual guide
     */
    addGridBackground() {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        const gridSize = 20;
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;

        for (let i = 0; i <= canvas.width; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }

        for (let i = 0; i <= canvas.height; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }

        const gridDataURL = canvas.toDataURL();
        this.canvas.style.backgroundImage = `url('${gridDataURL}')`;
        this.canvas.style.backgroundRepeat = 'repeat';
        this.canvas.style.backgroundAttachment = 'local';
    }

    /**
     * Setup canvas event listeners
     */
    setupCanvasEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas) {
                ElementManager.deselectElement();
                this.deselectElement();
            }
        });
    }

    /**
     * Render all elements on canvas
     */
    render() {
        // Clear canvas
        const existingElements = this.canvas.querySelectorAll('.canvas-element');
        existingElements.forEach(el => el.remove());

        // Sort by z-index
        const sortedElements = ElementManager.getElementsSortedByZIndex();

        // Render each element
        sortedElements.forEach(element => {
            this.renderElement(element);
        });
    }

    /**
     * Render single element on canvas
     */
    renderElement(element) {
        const elementDOM = document.createElement('div');
        elementDOM.className = 'canvas-element absolute cursor-grab hover:border-primary hover:shadow-lg transition-all';
        elementDOM.dataset.elementId = element.id;
        elementDOM.draggable = true;

        const position = element.position;
        elementDOM.style.cssText = `
            position: absolute;
            top: ${position.top}px;
            left: ${position.left}px;
            z-index: ${element.zIndex};
            min-width: 50px;
            min-height: 20px;
            border: 2px solid #ddd;
            border-radius: 4px;
            background: white;
            padding: 8px;
            cursor: grab;
            user-select: none;
            transition: all 0.2s;
        `;

        // Render content based on type
        let content = '';
        switch (element.type) {
            case 'text':
            case 'heading':
                content = `<div style="font-size: ${element.properties.fontSize}px; color: ${element.properties.fontColor}; font-weight: ${element.properties.fontWeight}; font-family: ${element.properties.fontFamily}; word-wrap: break-word;">
                    ${BuilderUtils.escapeHTML(element.properties.content)}
                </div>`;
                break;
            case 'image':
                if (element.properties.src) {
                    content = `<img src="${element.properties.src}" alt="${element.properties.alt}" style="max-width: 100%; height: auto; border-radius: 4px;" />`;
                } else {
                    content = `<div style="background: #f0f0f0; width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; color: #999;">
                        Click to add image
                    </div>`;
                }
                break;
            case 'button':
                content = `<button style="background: ${element.properties.backgroundColor}; color: ${element.properties.textColor}; padding: ${element.properties.padding}; border-radius: ${element.properties.borderRadius}px; border: none; cursor: pointer; font-weight: ${element.properties.fontWeight}; pointer-events: none;">
                    ${BuilderUtils.escapeHTML(element.properties.text)}
                </button>`;
                break;
            case 'divider':
                content = `<hr style="border: none; border-top: ${element.properties.thickness}px solid ${element.properties.color}; margin: ${element.properties.margin}px 0;" />`;
                break;
            case 'video':
                content = `<div style="background: #f0f0f0; width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; color: #999; border-radius: 4px;">
                    🎥 Video
                </div>`;
                break;
            case 'grid':
                content = `<div style="display: grid; grid-template-columns: repeat(${element.properties.columns}, 1fr); gap: ${element.properties.gap}px; width: 100%;">
                    ${Array(element.properties.columns).fill(null).map(() => '<div style="background: #f9f9f9; padding: 10px; border-radius: 4px; text-align: center; color: #999;">Item</div>').join('')}
                </div>`;
                break;
            default:
                content = '<div style="color: #999;">Unknown element</div>';
        }

        elementDOM.innerHTML = content;

        // Add control buttons
        this.addElementControls(elementDOM, element.id);

        // Click handler
        elementDOM.addEventListener('click', (e) => {
            e.stopPropagation();
            ElementManager.selectElement(element.id);
            this.selectElement(elementDOM, element);
            window.dispatchEvent(new CustomEvent('elementSelected', { detail: { element } }));
        });

        this.canvas.appendChild(elementDOM);
    }

    /**
     * Add control buttons to element
     */
    addElementControls(elementDOM, elementId) {
        const controls = document.createElement('div');
        controls.className = 'element-controls absolute top-0 right-0 flex gap-1 p-1 opacity-0 hover:opacity-100 transition-opacity';
        controls.style.cssText = `
            position: absolute;
            top: -30px;
            right: 0;
            display: flex;
            gap: 4px;
            background: rgba(102, 5, 199, 0.9);
            border-radius: 4px;
            padding: 4px;
            z-index: 1000;
        `;

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<span class="material-symbols-outlined text-sm" style="color: white; cursor: pointer;">delete</span>';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.padding = '2px 4px';
        deleteBtn.title = 'Delete element';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const element = ElementManager.getElementById(elementId);
            const command = new DeleteElementCommand(elementId);
            UndoRedoManager.execute(command);
            AutoSaveManager.markDirty();
            this.render();
            BuilderUtils.showToast('Element deleted', 'success');
        });

        // Duplicate button
        const duplicateBtn = document.createElement('button');
        duplicateBtn.innerHTML = '<span class="material-symbols-outlined text-sm" style="color: white; cursor: pointer;">content_copy</span>';
        duplicateBtn.style.background = 'none';
        duplicateBtn.style.border = 'none';
        duplicateBtn.style.cursor = 'pointer';
        duplicateBtn.style.padding = '2px 4px';
        duplicateBtn.title = 'Duplicate element';
        duplicateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const duplicated = ElementManager.duplicateElement(elementId);
            const command = new CreateElementCommand(duplicated);
            UndoRedoManager.execute(command);
            AutoSaveManager.markDirty();
            this.render();
            BuilderUtils.showToast('Element duplicated', 'success');
        });

        controls.appendChild(duplicateBtn);
        controls.appendChild(deleteBtn);
        elementDOM.appendChild(controls);
    }

    /**
     * Select element DOM
     */
    selectElement(elementDOM, elementData) {
        // Deselect previous
        if (this.selectedElementDOM) {
            this.selectedElementDOM.style.border = '2px solid #ddd';
            this.selectedElementDOM.style.boxShadow = 'none';
        }

        // Select new
        this.selectedElementDOM = elementDOM;
        elementDOM.style.border = '3px solid #6605c7';
        elementDOM.style.boxShadow = '0 0 0 3px rgba(102, 5, 199, 0.1)';
    }

    /**
     * Deselect element
     */
    deselectElement() {
        if (this.selectedElementDOM) {
            this.selectedElementDOM.style.border = '2px solid #ddd';
            this.selectedElementDOM.style.boxShadow = 'none';
            this.selectedElementDOM = null;
        }
    }

    /**
     * Update canvas size
     */
    updateCanvasSize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        if (this.canvas) {
            this.canvas.style.width = width + 'px';
            if (height) {
                this.canvas.style.height = height + 'px';
            }
        }
    }

    /**
     * Clear canvas
     */
    clear() {
        ElementManager.clearElements();
        this.render();
        this.deselectElement();
    }

    /**
     * Get canvas HTML
     */
    getCanvasHTML() {
        return this.canvas.innerHTML;
    }
}

/**
 * Export
 */
window.CanvasManager = new CanvasManager();
