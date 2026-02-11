/**
 * Blog Builder - Undo/Redo System
 * Manages command history for undo/redo functionality
 */

class UndoRedoManager {
    constructor(maxHistorySize = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = maxHistorySize;
        this.listeners = [];
    }

    /**
     * Execute a command and add to history
     */
    execute(command) {
        // Remove any redo history after current index
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Execute the command
        if (command.execute) {
            command.execute();
        }

        // Add to history
        this.history.push(command);
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        this.notifyListeners();
    }

    /**
     * Undo last command
     */
    undo() {
        if (this.canUndo()) {
            const command = this.history[this.currentIndex];
            if (command.undo) {
                command.undo();
            }
            this.currentIndex--;
            this.notifyListeners();
            return true;
        }
        return false;
    }

    /**
     * Redo last undone command
     */
    redo() {
        if (this.canRedo()) {
            this.currentIndex++;
            const command = this.history[this.currentIndex];
            if (command.execute) {
                command.execute();
            }
            this.notifyListeners();
            return true;
        }
        return false;
    }

    /**
     * Check if can undo
     */
    canUndo() {
        return this.currentIndex >= 0;
    }

    /**
     * Check if can redo
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Clear history
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.notifyListeners();
    }

    /**
     * Add listener for changes
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

    /**
     * Notify listeners
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback({
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
                currentIndex: this.currentIndex,
                historySize: this.history.length
            });
        });
    }
}

/**
 * Command classes for different operations
 */

class CreateElementCommand {
    constructor(element) {
        this.element = BuilderUtils.deepClone(element);
    }

    execute() {
        ElementManager.elements.push(this.element);
    }

    undo() {
        ElementManager.elements = ElementManager.elements.filter(el => el.id !== this.element.id);
        if (ElementManager.selectedElement?.id === this.element.id) {
            ElementManager.selectedElement = null;
        }
    }
}

class DeleteElementCommand {
    constructor(elementId) {
        this.element = BuilderUtils.deepClone(ElementManager.getElementById(elementId));
        this.elementId = elementId;
    }

    execute() {
        ElementManager.deleteElement(this.elementId);
    }

    undo() {
        ElementManager.elements.push(this.element);
    }
}

class UpdateElementCommand {
    constructor(elementId, oldData, newData) {
        this.elementId = elementId;
        this.oldData = BuilderUtils.deepClone(oldData);
        this.newData = BuilderUtils.deepClone(newData);
    }

    execute() {
        const element = ElementManager.getElementById(this.elementId);
        if (element) {
            Object.assign(element, this.newData);
        }
    }

    undo() {
        const element = ElementManager.getElementById(this.elementId);
        if (element) {
            Object.assign(element, this.oldData);
        }
    }
}

class UpdateElementPropertyCommand {
    constructor(elementId, propertyPath, oldValue, newValue) {
        this.elementId = elementId;
        this.propertyPath = propertyPath;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    execute() {
        const element = ElementManager.getElementById(this.elementId);
        if (element) {
            this.setPropertyByPath(element, this.propertyPath, this.newValue);
        }
    }

    undo() {
        const element = ElementManager.getElementById(this.elementId);
        if (element) {
            this.setPropertyByPath(element, this.propertyPath, this.oldValue);
        }
    }

    setPropertyByPath(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
    }
}

/**
 * Export
 */
window.UndoRedoManager = new UndoRedoManager();
window.CreateElementCommand = CreateElementCommand;
window.DeleteElementCommand = DeleteElementCommand;
window.UpdateElementCommand = UpdateElementCommand;
window.UpdateElementPropertyCommand = UpdateElementPropertyCommand;
