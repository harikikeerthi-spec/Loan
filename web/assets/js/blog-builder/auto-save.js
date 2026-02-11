/**
 * Blog Builder - Auto-Save System
 * Automatically persists builder state to localStorage
 */

class AutoSaveManager {
    constructor(saveInterval = 5000) {
        this.saveInterval = saveInterval;
        this.saveTimer = null;
        this.lastSave = null;
        this.isDirty = false;
        this.listeners = [];
        this.storageKey = 'blog-builder-autosave';
        this.metadataKey = 'blog-builder-metadata';
    }

    /**
     * Mark as dirty (has unsaved changes)
     */
    markDirty() {
        this.isDirty = true;
        this.scheduleSave();
    }

    /**
     * Schedule auto-save
     */
    scheduleSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        this.saveTimer = setTimeout(() => {
            this.save();
        }, this.saveInterval);
    }

    /**
     * Save to localStorage
     */
    save() {
        if (!this.isDirty) return;

        try {
            const data = {
                elements: ElementManager.getElementsData(),
                metadata: this.getMetadata(),
                timestamp: Date.now()
            };

            localStorage.setItem(this.storageKey, JSON.stringify(data));
            this.isDirty = false;
            this.lastSave = Date.now();
            this.notifyListeners({ saved: true });
            console.log('Blog builder auto-saved');
        } catch (error) {
            console.error('Error auto-saving blog builder:', error);
            this.notifyListeners({ saved: false, error: error.message });
        }
    }

    /**
     * Load from localStorage
     */
    load() {
        try {
            const data = JSON.parse(localStorage.getItem(this.storageKey));
            if (data && data.elements) {
                ElementManager.loadElementsData(data.elements);
                this.loadMetadata(data.metadata);
                console.log('Blog builder loaded from auto-save');
                return data;
            }
            return null;
        } catch (error) {
            console.error('Error loading auto-saved blog builder:', error);
            return null;
        }
    }

    /**
     * Save metadata (title, slug, category, etc.)
     */
    saveMetadata(metadata) {
        try {
            localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
        } catch (error) {
            console.error('Error saving metadata:', error);
        }
    }

    /**
     * Load metadata
     */
    loadMetadata(metadata) {
        if (!metadata) {
            return this.getMetadata();
        }
        return metadata;
    }

    /**
     * Get metadata
     */
    getMetadata() {
        try {
            return JSON.parse(localStorage.getItem(this.metadataKey)) || {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Clear saved data
     */
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.metadataKey);
            this.isDirty = false;
            if (this.saveTimer) {
                clearTimeout(this.saveTimer);
            }
            console.log('Blog builder auto-save cleared');
        } catch (error) {
            console.error('Error clearing auto-save:', error);
        }
    }

    /**
     * Get last save time
     */
    getLastSaveTime() {
        return this.lastSave;
    }

    /**
     * Check if has unsaved changes
     */
    hasUnsavedChanges() {
        return this.isDirty;
    }

    /**
     * Add listener for save events
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
    notifyListeners(event) {
        this.listeners.forEach(callback => {
            callback(event);
        });
    }

    /**
     * Force save immediately
     */
    forceSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.save();
    }
}

/**
 * Export
 */
window.AutoSaveManager = new AutoSaveManager(5000); // Auto-save every 5 seconds
