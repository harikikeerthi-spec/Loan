/**
 * Blog Builder - Design Tools Manager
 * Manages design tools (color picker, typography, alignment, etc.)
 */

class DesignToolsManager {
    constructor() {
        this.colorPicker = null;
        this.fontSizeSlider = null;
        this.fontWeightSelect = null;
        this.fontFamilySelect = null;
        this.alignmentButtons = {};
        this.listeners = [];
    }

    /**
     * Initialize design tools
     */
    init(toolsPanel) {
        this.toolsPanel = toolsPanel;
        this.setupColorPicker();
        this.setupTypographyControls();
        this.setupAlignmentTools();
        this.setupLayerTools();

        // Listen to element selection changes
        ElementManager.listeners = ElementManager.listeners || [];
        this.setupElementSelectionListener();
    }

    /**
     * Setup color picker
     */
    setupColorPicker() {
        const colorInputs = this.toolsPanel.querySelectorAll('input[type="color"]');
        colorInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const propertyName = e.target.dataset.property;
                if (ElementManager.selectedElement && propertyName) {
                    const oldValue = ElementManager.selectedElement.properties[propertyName];
                    const newValue = e.target.value;

                    const command = new UpdateElementPropertyCommand(
                        ElementManager.selectedElement.id,
                        `properties.${propertyName}`,
                        oldValue,
                        newValue
                    );
                    UndoRedoManager.execute(command);
                    AutoSaveManager.markDirty();
                }
            });

            input.addEventListener('input', (e) => {
                if (ElementManager.selectedElement) {
                    const propertyName = e.target.dataset.property;
                    if (propertyName) {
                        ElementManager.updateElementProperty(
                            ElementManager.selectedElement.id,
                            propertyName,
                            e.target.value
                        );
                    }
                }
            });
        });
    }

    /**
     * Setup typography controls
     */
    setupTypographyControls() {
        // Font size
        const fontSizeInputs = this.toolsPanel.querySelectorAll('input[data-tool="fontSize"]');
        fontSizeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (ElementManager.selectedElement) {
                    const oldValue = ElementManager.selectedElement.properties.fontSize;
                    const newValue = parseInt(e.target.value);

                    const command = new UpdateElementPropertyCommand(
                        ElementManager.selectedElement.id,
                        'properties.fontSize',
                        oldValue,
                        newValue
                    );
                    UndoRedoManager.execute(command);
                    AutoSaveManager.markDirty();
                }
            });
        });

        // Font weight
        const fontWeightSelects = this.toolsPanel.querySelectorAll('select[data-tool="fontWeight"]');
        fontWeightSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                if (ElementManager.selectedElement) {
                    const oldValue = ElementManager.selectedElement.properties.fontWeight;
                    const newValue = e.target.value;

                    const command = new UpdateElementPropertyCommand(
                        ElementManager.selectedElement.id,
                        'properties.fontWeight',
                        oldValue,
                        newValue
                    );
                    UndoRedoManager.execute(command);
                    AutoSaveManager.markDirty();
                }
            });
        });

        // Font family
        const fontFamilySelects = this.toolsPanel.querySelectorAll('select[data-tool="fontFamily"]');
        fontFamilySelects.forEach(select => {
            select.addEventListener('change', (e) => {
                if (ElementManager.selectedElement) {
                    const oldValue = ElementManager.selectedElement.properties.fontFamily;
                    const newValue = e.target.value;

                    const command = new UpdateElementPropertyCommand(
                        ElementManager.selectedElement.id,
                        'properties.fontFamily',
                        oldValue,
                        newValue
                    );
                    UndoRedoManager.execute(command);
                    AutoSaveManager.markDirty();
                }
            });
        });
    }

    /**
     * Setup alignment tools
     */
    setupAlignmentTools() {
        const alignmentButtons = this.toolsPanel.querySelectorAll('button[data-alignment]');
        alignmentButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const alignment = button.dataset.alignment;
                if (ElementManager.selectedElement) {
                    const alignment_map = {
                        'left': 'left',
                        'center': 'center',
                        'right': 'right',
                        'center-vert': 'middle'
                    };

                    ElementManager.selectedElement.properties.textAlign = alignment_map[alignment] || 'left';
                    AutoSaveManager.markDirty();
                }
            });
        });
    }

    /**
     * Setup layer tools (bring to front, send to back)
     */
    setupLayerTools() {
        const bringToFrontBtn = this.toolsPanel.querySelector('[data-tool="bringToFront"]');
        const sendToBackBtn = this.toolsPanel.querySelector('[data-tool="sendToBack"]');

        if (bringToFrontBtn) {
            bringToFrontBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (ElementManager.selectedElement) {
                    ElementManager.bringToFront(ElementManager.selectedElement.id);
                    AutoSaveManager.markDirty();
                    BuilderUtils.showToast('Brought to front', 'info');
                }
            });
        }

        if (sendToBackBtn) {
            sendToBackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (ElementManager.selectedElement) {
                    ElementManager.sendToBack(ElementManager.selectedElement.id);
                    AutoSaveManager.markDirty();
                    BuilderUtils.showToast('Sent to back', 'info');
                }
            });
        }
    }

    /**
     * Setup element selection listener
     */
    setupElementSelectionListener() {
        // When element is selected on canvas, update design tools
        window.addEventListener('elementSelected', (e) => {
            this.updateToolsForElement(e.detail.element);
        });
    }

    /**
     * Update design tools based on selected element
     */
    updateToolsForElement(element) {
        if (!element) return;

        // Update color inputs
        const colorInputs = this.toolsPanel.querySelectorAll('input[type="color"]');
        colorInputs.forEach(input => {
            const property = input.dataset.property;
            if (property && element.properties[property]) {
                input.value = element.properties[property];
            }
        });

        // Update font size
        const fontSizeInput = this.toolsPanel.querySelector('input[data-tool="fontSize"]');
        if (fontSizeInput && element.properties.fontSize) {
            fontSizeInput.value = element.properties.fontSize;
        }

        // Update font weight
        const fontWeightSelect = this.toolsPanel.querySelector('select[data-tool="fontWeight"]');
        if (fontWeightSelect && element.properties.fontWeight) {
            fontWeightSelect.value = element.properties.fontWeight;
        }

        // Update font family
        const fontFamilySelect = this.toolsPanel.querySelector('select[data-tool="fontFamily"]');
        if (fontFamilySelect && element.properties.fontFamily) {
            fontFamilySelect.value = element.properties.fontFamily;
        }
    }

    /**
     * Add listener
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove listener
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }
}

/**
 * Export
 */
window.DesignToolsManager = new DesignToolsManager();
