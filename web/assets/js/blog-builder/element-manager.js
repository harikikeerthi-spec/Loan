/**
 * Blog Builder - Element Manager
 * Manages element creation, editing, deletion, and properties
 */

class ElementManager {
    constructor() {
        this.elements = [];
        this.selectedElement = null;
        this.elementTypes = {
            text: { label: 'Text', icon: 'text_fields', defaultWidth: 300, defaultHeight: 'auto' },
            heading: { label: 'Heading', icon: 'title', defaultWidth: 400, defaultHeight: 'auto' },
            image: { label: 'Image', icon: 'image', defaultWidth: 400, defaultHeight: 300 },
            video: { label: 'Video', icon: 'video_camera', defaultWidth: 400, defaultHeight: 225 },
            button: { label: 'Button', icon: 'smart_button', defaultWidth: 150, defaultHeight: 40 },
            divider: { label: 'Divider', icon: 'remove', defaultWidth: '100%', defaultHeight: 2 },
            grid: { label: 'Grid', icon: 'dashboard', defaultWidth: 600, defaultHeight: 'auto' }
        };
    }

    /**
     * Create a new element
     */
    createElement(type, position = { top: 50, left: 50 }) {
        if (!this.elementTypes[type]) {
            console.error('Invalid element type:', type);
            return null;
        }

        const elementTypeConfig = this.elementTypes[type];
        const element = {
            id: BuilderUtils.generateElementId(),
            type: type,
            position: { ...position },
            size: {
                width: elementTypeConfig.defaultWidth,
                height: elementTypeConfig.defaultHeight
            },
            zIndex: this.getMaxZIndex() + 1,
            properties: this.getDefaultProperties(type),
            created: new Date().toISOString()
        };

        this.elements.push(element);
        return element;
    }

    /**
     * Get default properties for element type
     */
    getDefaultProperties(type) {
        switch (type) {
            case 'text':
                return {
                    content: 'Click to edit text',
                    fontSize: 16,
                    fontWeight: 'normal',
                    fontColor: '#000000',
                    fontFamily: 'sans-serif',
                    textAlign: 'left',
                    lineHeight: 1.5
                };
            case 'heading':
                return {
                    content: 'Click to edit heading',
                    level: 'h2',
                    fontSize: 32,
                    fontWeight: 'bold',
                    fontColor: '#000000',
                    fontFamily: 'serif',
                    textAlign: 'left'
                };
            case 'image':
                return {
                    src: '',
                    alt: 'Image',
                    objectFit: 'cover',
                    backgroundColor: '#f0f0f0'
                };
            case 'video':
                return {
                    src: '',
                    type: 'embed', // 'embed' or 'upload'
                    autoplay: false,
                    controls: true
                };
            case 'button':
                return {
                    text: 'Click me',
                    backgroundColor: '#6605c7',
                    textColor: '#ffffff',
                    fontSize: 14,
                    fontWeight: 'bold',
                    padding: '10px 20px',
                    borderRadius: 6,
                    link: ''
                };
            case 'divider':
                return {
                    color: '#cccccc',
                    thickness: 2,
                    margin: 20,
                    width: '100%'
                };
            case 'grid':
                return {
                    columns: 2,
                    gap: 20,
                    items: []
                };
            default:
                return {};
        }
    }

    /**
     * Update element position
     */
    updateElementPosition(elementId, top, left) {
        const element = this.getElementById(elementId);
        if (element) {
            element.position = { top: Math.max(0, top), left: Math.max(0, left) };
            return element;
        }
        return null;
    }

    /**
     * Update element size
     */
    updateElementSize(elementId, width, height) {
        const element = this.getElementById(elementId);
        if (element) {
            element.size = { width: Math.max(50, width), height: Math.max(20, height) };
            return element;
        }
        return null;
    }

    /**
     * Update element property
     */
    updateElementProperty(elementId, propertyName, value) {
        const element = this.getElementById(elementId);
        if (element) {
            element.properties[propertyName] = value;
            return element;
        }
        return null;
    }

    /**
     * Update multiple properties
     */
    updateElementProperties(elementId, properties) {
        const element = this.getElementById(elementId);
        if (element) {
            Object.assign(element.properties, properties);
            return element;
        }
        return null;
    }

    /**
     * Delete element
     */
    deleteElement(elementId) {
        const index = this.elements.findIndex(el => el.id === elementId);
        if (index > -1) {
            const deleted = this.elements.splice(index, 1)[0];
            if (this.selectedElement?.id === elementId) {
                this.selectedElement = null;
            }
            return deleted;
        }
        return null;
    }

    /**
     * Get element by ID
     */
    getElementById(elementId) {
        return this.elements.find(el => el.id === elementId);
    }

    /**
     * Select element
     */
    selectElement(elementId) {
        this.selectedElement = this.getElementById(elementId);
        return this.selectedElement;
    }

    /**
     * Deselect element
     */
    deselectElement() {
        this.selectedElement = null;
    }

    /**
     * Bring element to front
     */
    bringToFront(elementId) {
        const element = this.getElementById(elementId);
        if (element) {
            element.zIndex = this.getMaxZIndex() + 1;
            return element;
        }
        return null;
    }

    /**
     * Send element to back
     */
    sendToBack(elementId) {
        const element = this.getElementById(elementId);
        if (element) {
            element.zIndex = this.getMinZIndex() - 1;
            this.elements.forEach(el => {
                if (el.id !== elementId && el.zIndex < 0) {
                    el.zIndex++;
                }
            });
            return element;
        }
        return null;
    }

    /**
     * Get max z-index
     */
    getMaxZIndex() {
        if (this.elements.length === 0) return 0;
        return Math.max(...this.elements.map(el => el.zIndex));
    }

    /**
     * Get min z-index
     */
    getMinZIndex() {
        if (this.elements.length === 0) return 0;
        return Math.min(...this.elements.map(el => el.zIndex));
    }

    /**
     * Duplicate element
     */
    duplicateElement(elementId) {
        const original = this.getElementById(elementId);
        if (!original) return null;

        const duplicated = BuilderUtils.deepClone(original);
        duplicated.id = BuilderUtils.generateElementId();
        duplicated.zIndex = this.getMaxZIndex() + 1;
        duplicated.position.top += 20;
        duplicated.position.left += 20;

        this.elements.push(duplicated);
        return duplicated;
    }

    /**
     * Align elements
     */
    alignElements(elementIds, alignment) {
        const selectedElements = elementIds.map(id => this.getElementById(id)).filter(el => el);
        if (selectedElements.length === 0) return [];

        switch (alignment) {
            case 'left':
                const minLeft = Math.min(...selectedElements.map(el => el.position.left));
                selectedElements.forEach(el => el.position.left = minLeft);
                break;
            case 'center':
                const avgLeft = selectedElements.reduce((sum, el) => sum + el.position.left, 0) / selectedElements.length;
                selectedElements.forEach(el => el.position.left = avgLeft);
                break;
            case 'right':
                const maxRight = Math.max(...selectedElements.map(el => el.position.left + el.size.width));
                selectedElements.forEach(el => el.position.left = maxRight - el.size.width);
                break;
            case 'top':
                const minTop = Math.min(...selectedElements.map(el => el.position.top));
                selectedElements.forEach(el => el.position.top = minTop);
                break;
            case 'middle':
                const avgTop = selectedElements.reduce((sum, el) => sum + el.position.top, 0) / selectedElements.length;
                selectedElements.forEach(el => el.position.top = avgTop);
                break;
            case 'bottom':
                const maxBottom = Math.max(...selectedElements.map(el => el.position.top + el.size.height));
                selectedElements.forEach(el => el.position.top = maxBottom - el.size.height);
                break;
        }

        return selectedElements;
    }

    /**
     * Get all elements sorted by z-index
     */
    getElementsSortedByZIndex() {
        return [...this.elements].sort((a, b) => a.zIndex - b.zIndex);
    }

    /**
     * Clear all elements
     */
    clearElements() {
        this.elements = [];
        this.selectedElement = null;
    }

    /**
     * Get elements data
     */
    getElementsData() {
        return this.elements;
    }

    /**
     * Load elements data
     */
    loadElementsData(elementsData) {
        this.elements = BuilderUtils.deepClone(elementsData);
        this.selectedElement = null;
    }
}

/**
 * Export
 */
window.ElementManager = new ElementManager();
