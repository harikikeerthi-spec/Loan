// Canva-Style Blog Editor with Drag & Drop
// © 2026 Advanced Blog Creation System

let blockCounter = 0;
let currentEditingId = null;
let draggedElement = null;
let draggedBlock = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeDragAndDrop();
    setCurrentDate();
    setupAutoSave();
});

// Set current date
function setCurrentDate() {
    const dateEl = document.getElementById('canvasDate');
    const today = new Date();
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    dateEl.textContent = today.toLocaleDateString('en-US', options);
}

// Update canvas title in real-time
function updateCanvasTitle() {
    const title = document.getElementById('blogTitle').value;
    document.getElementById('canvasBlogTitle').textContent = title || 'Your Blog Title';
    markAsModified();
}

// Update canvas author in real-time
function updateCanvasAuthor() {
    const author = document.getElementById('blogAuthor').value;
    document.getElementById('canvasAuthor').textContent = author || 'Author Name';
    markAsModified();
}

// Auto-generate slug from title
function generateSlug() {
    const title = document.getElementById('blogTitle').value;
    const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens

    document.getElementById('blogSlug').value = slug;
    markAsModified();
}

// Initialize Drag and Drop
function initializeDragAndDrop() {
    const elementItems = document.querySelectorAll('.element-item[draggable="true"]');
    const dropZone = document.getElementById('canvasContent');

    // Make element items draggable
    elementItems.forEach(item => {
        item.addEventListener('dragstart', handleElementDragStart);
        item.addEventListener('dragend', handleElementDragEnd);
    });

    // Setup drop zone
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('dragleave', handleDragLeave);
}

// Handle element drag start
function handleElementDragStart(e) {
    draggedElement = e.currentTarget.dataset.elementType;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    e.currentTarget.style.opacity = '0.5';
}

// Handle element drag end
function handleElementDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    draggedElement = null;
}

// Handle drag over drop zone
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

// Handle drag leave
function handleDragLeave(e) {
    // Optional: visual feedback
}

// Handle drop on canvas
function handleDrop(e) {
    e.preventDefault();

    // Remove empty state if exists
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.remove();
    }

    if (draggedElement) {
        addElement(draggedElement, true);
    } else if (draggedBlock) {
        // Reordering blocks
        const dropTarget = e.target.closest('.content-block');
        if (dropTarget && dropTarget !== draggedBlock) {
            const content = document.getElementById('canvasContent');
            content.insertBefore(draggedBlock, dropTarget);
        }
    }

    draggedElement = null;
    draggedBlock = null;
}

// Add Element to Canvas
function addElement(type, isDragged = false) {
    const content = document.getElementById('canvasContent');

    // Remove empty state if exists
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.remove();
    }

    const blockId = `block-${blockCounter++}`;
    const block = document.createElement('div');
    block.className = 'content-block';
    block.id = blockId;
    block.draggable = true;
    block.dataset.type = type;

    // Add drag events for reordering
    block.addEventListener('dragstart', handleBlockDragStart);
    block.addEventListener('dragend', handleBlockDragEnd);
    block.addEventListener('dragover', handleBlockDragOver);
    block.addEventListener('drop', handleBlockDrop);

    let blockHTML = getElementHTML(type);

    block.innerHTML = `
        <div class="block-controls flex items-center gap-1 bg-white shadow-md p-1 rounded-lg border border-gray-200">
            <!-- Quick Width Adjust -->
            <div class="flex items-center px-1 border-r border-gray-200 mr-1" title="Adjust Width">
                <span class="material-symbols-outlined text-gray-400 text-[10px] mr-1">width</span>
                <input type="range" min="20" max="100" value="100" 
                       class="w-12 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                       oninput="updateBlockWidth('${blockId}', this.value)" title="20% - 100%">
            </div>

            <!-- Free Resize Toggle -->
            <button onclick="toggleBlockResize('${blockId}', this)" class="block-control-btn hover:text-purple-600" title="Enable Manual Resize Handle">
                <span class="material-symbols-outlined text-xs">aspect_ratio</span>
            </button>
            
            <div class="w-px h-4 bg-gray-200 mx-1"></div>

            <button onclick="editBlock('${blockId}', '${type}')" class="block-control-btn" title="Edit Properties">
                <span class="material-symbols-outlined text-xs">edit</span>
            </button>
            <button onclick="duplicateBlock('${blockId}')" class="block-control-btn" title="Duplicate">
                <span class="material-symbols-outlined text-xs">content_copy</span>
            </button>
            <button onclick="moveBlockUp('${blockId}')" class="block-control-btn" title="Move Up">
                <span class="material-symbols-outlined text-xs">arrow_upward</span>
            </button>
            <button onclick="moveBlockDown('${blockId}')" class="block-control-btn" title="Move Down">
                <span class="material-symbols-outlined text-xs">arrow_downward</span>
            </button>
            <button onclick="deleteBlock('${blockId}')" class="block-control-btn hover:text-red-600" title="Delete">
                <span class="material-symbols-outlined text-xs">delete</span>
            </button>
        </div>
        <div class="block-type-label absolute -top-3 left-2 px-2 py-1 bg-purple-600 text-white text-xs rounded font-medium">
            ${type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        ${blockHTML}
    `;

    content.appendChild(block);
    markAsModified();

    // Show notification
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} added!`, 'success');
}

// Get HTML for each element type
function getElementHTML(type) {
    const templates = {
        heading: `<h2 class="text-3xl font-bold text-gray-900">Your Heading Here</h2>`,

        container: `
            <div class="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p class="text-gray-500 text-center">Container - Drag elements here or click Edit to customize</p>
            </div>
        `,

        text: `<p class="text-gray-700 leading-relaxed">Start writing your content here. Click edit to customize this text block with rich formatting.</p>`,

        image: `
            <img src="https://via.placeholder.com/800x400/6366f1/ffffff?text=Click+Edit+to+Upload+Image" alt="Image" class="w-full rounded-lg">
            <p class="text-sm text-gray-500 text-center mt-2">Click edit to upload your image</p>
        `,

        video: `
            <div class="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-300">
                <div class="text-center">
                    <span class="material-symbols-outlined text-6xl text-gray-400">videocam</span>
                    <p class="text-gray-500 mt-2">Click edit to add video URL</p>
                </div>
            </div>
        `,

        button: `
            <div class="text-center my-4">
                <a href="#" class="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                    Click Me
                </a>
            </div>
        `,

        list: `
            <ul class="list-disc list-inside space-y-2 text-gray-700">
                <li>First item</li>
                <li>Second item</li>
                <li>Third item</li>
            </ul>
        `,

        quote: `
            <blockquote class="border-l-4 border-purple-500 pl-6 py-4 italic text-gray-700 bg-purple-50 rounded-r-lg">
                "Your inspirational quote goes here. Click edit to customize."
            </blockquote>
        `,

        code: `
            <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto"><code>// Your code here
function example() {
    console.log("Hello World!");
}</code></pre>
        `,

        divider: `<hr class="border-t-2 border-gray-300 my-8">`,

        spacer: `<div class="h-16"></div>`
    };

    return templates[type] || '<p>Unknown element type</p>';
}

// Block reordering
function handleBlockDragStart(e) {
    draggedBlock = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleBlockDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    draggedBlock = null;
}

function handleBlockDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleBlockDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

// Helper to get the actual content element inside a block
function getContentElement(blockId) {
    const block = document.getElementById(blockId);
    if (!block) return null;

    // Find first non-control child
    let contentEl = Array.from(block.children).find(el =>
        !el.classList.contains('block-controls') &&
        !el.classList.contains('block-type-label')
    );

    // Check type for override (read from dataset)
    const type = block.dataset.type;
    if (type === 'button') contentEl = block.querySelector('a');

    return contentEl;
}

// Quick Width Adjustment
function updateBlockWidth(blockId, width) {
    const el = getContentElement(blockId);
    if (el) {
        el.style.width = width + '%';
        // Auto-center if < 100%
        if (width < 100) {
            el.style.marginLeft = 'auto';
            el.style.marginRight = 'auto';
            el.style.display = 'block'; // Ensure block display for centering
        }
        markAsModified();
    }
}

// Toggle Free Resize Handle
function toggleBlockResize(blockId, btn) {
    const el = getContentElement(blockId);
    if (el) {
        const isResizing = el.style.resize === 'both';

        if (isResizing) {
            // Disable
            el.style.resize = 'none';
            el.style.overflow = '';
            el.classList.remove('border', 'border-dashed', 'border-purple-500');
            if (btn) btn.classList.remove('text-purple-600', 'bg-purple-100');
        } else {
            // Enable
            el.style.resize = 'both';
            el.style.overflow = 'hidden';
            el.style.maxWidth = '100%';
            el.classList.add('border', 'border-dashed', 'border-purple-500');
            if (btn) btn.classList.add('text-purple-600', 'bg-purple-100');
            showNotification('Resize handle enabled (bottom-right corner)', 'info');
        }
        markAsModified();
    }
}

// Edit Block
function editBlock(blockId, type) {
    currentEditingId = blockId;
    const modal = document.getElementById('editModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    modalTitle.textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;

    let fields = getEditFields(blockId, type);
    modalContent.innerHTML = fields;
    modal.classList.remove('hidden');
}

// Get edit fields based on element type
function getEditFields(blockId, type) {
    let dimensionControls = '';

    // Get content element (target the actual content, skipping controls)
    const block = document.getElementById(blockId);
    let elForDimensions = null;

    if (block) {
        // Generic finder: first non-control child
        elForDimensions = Array.from(block.children).find(el =>
            !el.classList.contains('block-controls') &&
            !el.classList.contains('block-type-label')
        );

        // Specific overrides for deep nesting
        if (type === 'button') elForDimensions = document.querySelector(`#${blockId} a`);
    }

    if (elForDimensions) {
        dimensionControls = getDimensionControls(elForDimensions);
    }

    switch (type) {
        case 'heading':
            const headingText = document.querySelector(`#${blockId} h2`)?.textContent || '';
            const headingElement = document.querySelector(`#${blockId} h2`);
            const currentFont = headingElement?.style.fontFamily || 'inherit';
            const currentWeight = headingElement?.style.fontWeight || '700';
            const currentStyle = headingElement?.style.fontStyle || 'normal';
            const currentAlign = headingElement?.style.textAlign || 'left';
            return `
                <label class="block text-sm font-medium mb-2">Heading Text</label>
                <input type="text" id="editValue" value="${headingText}" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">
                
                <label class="block text-sm font-medium mb-2">Font Family</label>
                <select id="editFontFamily" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">
                    <option value="inherit" ${currentFont === 'inherit' ? 'selected' : ''}>Default (System)</option>
                    <option value="'Playfair Display', serif" ${currentFont.includes('Playfair') ? 'selected' : ''}>Playfair Display</option>
                    <option value="'Merriweather', serif" ${currentFont.includes('Merriweather') ? 'selected' : ''}>Merriweather</option>
                    <option value="'Montserrat', sans-serif" ${currentFont.includes('Montserrat') ? 'selected' : ''}>Montserrat</option>
                    <option value="'Poppins', sans-serif" ${currentFont.includes('Poppins') ? 'selected' : ''}>Poppins</option>
                    <option value="'Roboto', sans-serif" ${currentFont.includes('Roboto') ? 'selected' : ''}>Roboto</option>
                    <option value="'Open Sans', sans-serif" ${currentFont.includes('Open Sans') ? 'selected' : ''}>Open Sans</option>
                    <option value="'Lato', sans-serif" ${currentFont.includes('Lato') ? 'selected' : ''}>Lato</option>
                    <option value="'Raleway', sans-serif" ${currentFont.includes('Raleway') ? 'selected' : ''}>Raleway</option>
                    <option value="'Ubuntu', sans-serif" ${currentFont.includes('Ubuntu') ? 'selected' : ''}>Ubuntu</option>
                </select>

                <label class="block text-sm font-medium mb-2">Size</label>
                <select id="editSize" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">
                    <option value="text-xl">Small (H3)</option>
                    <option value="text-2xl">Medium (H2)</option>
                    <option value="text-3xl" selected>Large (H1)</option>
                    <option value="text-4xl">Extra Large</option>
                    <option value="text-5xl">Huge</option>
                </select>

                <div class="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Weight</label>
                        <select id="editFontWeight" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                            <option value="300" ${currentWeight === '300' ? 'selected' : ''}>Light</option>
                            <option value="400" ${currentWeight === '400' ? 'selected' : ''}>Normal</option>
                            <option value="600" ${currentWeight === '600' ? 'selected' : ''}>Semi-Bold</option>
                            <option value="700" ${currentWeight === '700' ? 'selected' : ''}>Bold</option>
                            <option value="900" ${currentWeight === '900' ? 'selected' : ''}>Black</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Style</label>
                        <select id="editFontStyle" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                            <option value="normal" ${currentStyle === 'normal' ? 'selected' : ''}>Normal</option>
                            <option value="italic" ${currentStyle === 'italic' ? 'selected' : ''}>Italic</option>
                        </select>
                    </div>
                </div>

                <label class="block text-sm font-medium mb-2">Alignment</label>
                <div class="grid grid-cols-3 gap-2 mb-4">
                    <button type="button" onclick="setTempAlign('left')" 
                            class="px-4 py-2 border rounded-lg ${currentAlign === 'left' ? 'bg-purple-100 border-purple-500' : 'border-gray-300'} hover:bg-gray-50">
                        <span class="material-symbols-outlined">format_align_left</span>
                    </button>
                    <button type="button" onclick="setTempAlign('center')" 
                            class="px-4 py-2 border rounded-lg ${currentAlign === 'center' ? 'bg-purple-100 border-purple-500' : 'border-gray-300'} hover:bg-gray-50">
                        <span class="material-symbols-outlined">format_align_center</span>
                    </button>
                    <button type="button" onclick="setTempAlign('right')" 
                            class="px-4 py-2 border rounded-lg ${currentAlign === 'right' ? 'bg-purple-100 border-purple-500' : 'border-gray-300'} hover:bg-gray-50">
                        <span class="material-symbols-outlined">format_align_right</span>
                    </button>
                </div>
                <input type="hidden" id="editAlignment" value="${currentAlign}">
                
                <label class="block text-sm font-medium mb-2">Color</label>
                <input type="color" id="editColor" value="#111827" 
                       class="w-full h-12 px-2 border border-gray-300 rounded-lg mb-4">
                
                ${dimensionControls}

                <button onclick="saveHeading()" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 mt-4">
                    Save Changes
                </button>
            `;

        case 'container':
            return `
                <label class="block text-sm font-medium mb-2">Background Color</label>
                <input type="color" id="editBgColor" value="#f9fafb" 
                       class="w-full h-12 px-2 border border-gray-300 rounded-lg mb-4">
                       
                ${dimensionControls}

                <button onclick="saveContainer()" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 mt-4">
                    Save Changes
                </button>
            `;

        case 'text':
            const textContent = document.querySelector(`#${blockId} p`)?.textContent || '';
            const textElement = document.querySelector(`#${blockId} p`);
            const currentTextFont = textElement?.style.fontFamily || 'inherit';
            const currentTextWeight = textElement?.style.fontWeight || '400';
            const currentTextStyle = textElement?.style.fontStyle || 'normal';
            const currentTextAlign = textElement?.style.textAlign || 'left';
            const currentTextColor = textElement?.style.color || '#374151';
            return `
                <label class="block text-sm font-medium mb-2">Text Content</label>
                <textarea id="editValue" rows="8" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 font-mono">${textContent}</textarea>
                
                <label class="block text-sm font-medium mb-2">Font Family</label>
                <select id="editFontFamily" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">
                    <option value="inherit" ${currentTextFont === 'inherit' ? 'selected' : ''}>Default (System)</option>
                    <option value="'Playfair Display', serif" ${currentTextFont.includes('Playfair') ? 'selected' : ''}>Playfair Display</option>
                    <option value="'Merriweather', serif" ${currentTextFont.includes('Merriweather') ? 'selected' : ''}>Merriweather</option>
                    <option value="'Montserrat', sans-serif" ${currentTextFont.includes('Montserrat') ? 'selected' : ''}>Montserrat</option>
                    <option value="'Poppins', sans-serif" ${currentTextFont.includes('Poppins') ? 'selected' : ''}>Poppins</option>
                    <option value="'Roboto', sans-serif" ${currentTextFont.includes('Roboto') ? 'selected' : ''}>Roboto</option>
                    <option value="'Open Sans', sans-serif" ${currentTextFont.includes('Open Sans') ? 'selected' : ''}>Open Sans</option>
                    <option value="'Lato', sans-serif" ${currentTextFont.includes('Lato') ? 'selected' : ''}>Lato</option>
                    <option value="'Georgia', serif" ${currentTextFont.includes('Georgia') ? 'selected' : ''}>Georgia</option>
                </select>
                
                <label class="block text-sm font-medium mb-2">Text Size</label>
                <select id="editTextSize" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">
                    <option value="text-sm">Small</option>
                    <option value="text-base">Medium</option>
                    <option value="text-lg">Large</option>
                    <option value="text-xl">Extra Large</option>
                </select>

                <div class="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Weight</label>
                        <select id="editFontWeight" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                            <option value="300" ${currentTextWeight === '300' ? 'selected' : ''}>Light</option>
                            <option value="400" ${currentTextWeight === '400' ? 'selected' : ''}>Normal</option>
                            <option value="600" ${currentTextWeight === '600' ? 'selected' : ''}>Semi-Bold</option>
                            <option value="700" ${currentTextWeight === '700' ? 'selected' : ''}>Bold</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Style</label>
                        <select id="editFontStyle" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                            <option value="normal" ${currentTextStyle === 'normal' ? 'selected' : ''}>Normal</option>
                            <option value="italic" ${currentTextStyle === 'italic' ? 'selected' : ''}>Italic</option>
                        </select>
                    </div>
                </div>

                <label class="block text-sm font-medium mb-2">Alignment</label>
                <div class="grid grid-cols-4 gap-2 mb-4">
                    <button type="button" onclick="setTempAlign('left')" 
                            class="px-2 py-2 border rounded-lg ${currentTextAlign === 'left' ? 'bg-purple-100 border-purple-500' : 'border-gray-300'} hover:bg-gray-50">
                        <span class="material-symbols-outlined text-sm">format_align_left</span>
                    </button>
                    <button type="button" onclick="setTempAlign('center')" 
                            class="px-2 py-2 border rounded-lg ${currentTextAlign === 'center' ? 'bg-purple-100 border-purple-500' : 'border-gray-300'} hover:bg-gray-50">
                        <span class="material-symbols-outlined text-sm">format_align_center</span>
                    </button>
                    <button type="button" onclick="setTempAlign('right')" 
                            class="px-2 py-2 border rounded-lg ${currentTextAlign === 'right' ? 'bg-purple-100 border-purple-500' : 'border-gray-300'} hover:bg-gray-50">
                        <span class="material-symbols-outlined text-sm">format_align_right</span>
                    </button>
                     <button type="button" onclick="setTempAlign('justify')" 
                            class="px-2 py-2 border rounded-lg ${currentTextAlign === 'justify' ? 'bg-purple-100 border-purple-500' : 'border-gray-300'} hover:bg-gray-50">
                        <span class="material-symbols-outlined text-sm">format_align_justify</span>
                    </button>
                </div>
                <input type="hidden" id="editAlignment" value="${currentTextAlign}">
                
                <label class="block text-sm font-medium mb-2">Text Color</label>
                <input type="color" id="editTextColor" value="${rgbToHex(currentTextColor)}" 
                       class="w-full h-12 px-2 border border-gray-300 rounded-lg mb-4">

                ${dimensionControls}

                <button onclick="saveText()" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 mt-4">
                    Save Changes
                </button>
            `;

        case 'image':
            const currentUrl = document.querySelector(`#${blockId} img`)?.src || '';
            const currentAlt = document.querySelector(`#${blockId} img`)?.alt || '';
            const currentBorderRadius = document.querySelector(`#${blockId} img`)?.style.borderRadius || '0.5rem';
            const currentShadow = document.querySelector(`#${blockId} img`)?.style.boxShadow !== 'none' ? 'shadow' : 'none';
            // Note: We use generic dimension controls for Width now, but keep border radius/shadow specific

            return `
                <label class="block text-sm font-medium mb-2">Image Source</label>
                <div class="mb-4">
                    <div class="flex items-center gap-2 mb-2">
                        <input type="radio" name="imgSource" id="sourceUrl" checked onclick="document.getElementById('urlInput').classList.remove('hidden');document.getElementById('fileInput').classList.add('hidden')">
                        <label for="sourceUrl" class="text-sm">Image URL</label>
                        <input type="radio" name="imgSource" id="sourceUpload" class="ml-4" onclick="document.getElementById('urlInput').classList.add('hidden');document.getElementById('fileInput').classList.remove('hidden')">
                        <label for="sourceUpload" class="text-sm">Upload</label>
                    </div>
                     <input type="url" id="editValue" value="${currentUrl}" placeholder="https://..." 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg" id="urlInput">
                    <input type="file" id="imageUpload" accept="image/*" class="w-full hidden" id="fileInput">
                </div>

                <label class="block text-sm font-medium mb-2">Alt Text</label>
                <input type="text" id="editAlt" value="${currentAlt}" placeholder="Description for SEO" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Border Radius</label>
                        <select id="editBorderRadius" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                            <option value="0" ${currentBorderRadius === '0px' ? 'selected' : ''}>None</option>
                            <option value="0.375rem" ${currentBorderRadius === '0.375rem' ? 'selected' : ''}>Small</option>
                            <option value="0.5rem" ${currentBorderRadius === '0.5rem' ? 'selected' : ''}>Medium</option>
                            <option value="1rem" ${currentBorderRadius === '1rem' ? 'selected' : ''}>Large</option>
                            <option value="50%" ${currentBorderRadius === '50%' ? 'selected' : ''}>Circle</option>
                        </select>
                    </div>
                     <div>
                        <label class="block text-sm font-medium mb-2">Shadow</label>
                        <select id="editShadow" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                            <option value="none">None</option>
                            <option value="shadow">Light</option>
                            <option value="shadow-lg">Medium</option>
                            <option value="shadow-2xl">Strong</option>
                        </select>
                    </div>
                </div>

                <label class="block text-sm font-medium mb-2">Alignment</label>
                <div class="grid grid-cols-3 gap-2 mb-4">
                    <button type="button" onclick="setImageAlign('left')" 
                            class="px-4 py-2 border rounded-lg border-gray-300 hover:bg-gray-50">
                        <span class="text-sm">Left</span>
                    </button>
                    <button type="button" onclick="setImageAlign('center')" 
                            class="px-4 py-2 border rounded-lg border-gray-300 hover:bg-gray-50">
                        <span class="text-sm">Center</span>
                    </button>
                    <button type="button" onclick="setImageAlign('right')" 
                            class="px-4 py-2 border rounded-lg border-gray-300 hover:bg-gray-50">
                        <span class="text-sm">Right</span>
                    </button>
                </div>
                <input type="hidden" id="editImageAlign" value="center">

                ${dimensionControls}

                <button onclick="saveImage()" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 mt-4">
                    Save Changes
                </button>
            `;

        case 'video':
            return `
                <label class="block text-sm font-medium mb-2">Video Embed URL</label>
                <input type="url" id="editValue" placeholder="https://youtube.com/embed/..." 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">
                <p class="text-xs text-gray-500 mb-4">
                    ✅ Use: https://youtube.com/embed/VIDEO_ID<br>
                    ❌ Don't use: https://youtube.com/watch?v=VIDEO_ID
                </p>
                <button onclick="saveVideo()" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
                    Save Changes
                </button>
            `;

        case 'button':
            const btnText = document.querySelector(`#${blockId} a`)?.textContent || '';
            return `
                <label class="block text-sm font-medium mb-2">Button Text</label>
                <input type="text" id="editValue" value="${btnText}" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">
                <label class="block text-sm font-medium mb-2">Link URL</label>
                <input type="url" id="editLink" placeholder="https://..." 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">
                <label class="block text-sm font-medium mb-2">Button Color</label>
                <input type="color" id="editBtnColor" value="#9333ea" 
                       class="w-full h-12 px-2 border border-gray-300 rounded-lg mb-4">
                <button onclick="saveButton()" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
                    Save Changes
                </button>
            `;

        case 'list':
            const listItems = Array.from(document.querySelectorAll(`#${blockId} li`)).map(li => li.textContent).join('\n');
            return `
                <label class="block text-sm font-medium mb-2">List Items (one per line)</label>
                <textarea id="editValue" rows="8" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">${listItems}</textarea>
                <label class="block text-sm font-medium mb-2">List Type</label>
                <select id="editListType" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">
                    <option value="disc">Bullet Points</option>
                    <option value="decimal">Numbered List</option>
                </select>
                <button onclick="saveList()" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
                    Save Changes
                </button>
            `;

        case 'quote':
            const quoteText = document.querySelector(`#${blockId} blockquote`)?.textContent.trim() || '';
            return `
                <label class="block text-sm font-medium mb-2">Quote Text</label>
                <textarea id="editValue" rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4">${quoteText}</textarea>
                <button onclick="saveQuote()" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
                    Save Changes
                </button>
            `;

        case 'code':
            const codeText = document.querySelector(`#${blockId} code`)?.textContent || '';
            return `
                <label class="block text-sm font-medium mb-2">Code</label>
                <textarea id="editValue" rows="12" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 font-mono">${codeText}</textarea>
                <button onclick="saveCode()" class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
                    Save Changes
                </button>
            `;

        default:
            return '<p class="text-gray-500">This element type cannot be edited.</p>';
    }
}

// Save functions
function saveHeading() {
    const text = document.getElementById('editValue').value;
    const size = document.getElementById('editSize').value;
    const color = document.getElementById('editColor').value;
    const fontFamily = document.getElementById('editFontFamily').value;
    const fontWeight = document.getElementById('editFontWeight').value;
    const fontStyle = document.getElementById('editFontStyle').value;
    const alignment = document.getElementById('editAlignment').value;

    const heading = document.querySelector(`#${currentEditingId} h2`);
    heading.textContent = text;
    heading.className = `${size} font-bold`;
    heading.style.color = color;
    heading.style.fontFamily = fontFamily;
    heading.style.fontWeight = fontWeight;
    heading.style.fontStyle = fontStyle;
    heading.style.textAlign = alignment;

    applyDimensionStyles(heading);

    closeEditModal();
    markAsModified();
}

function saveContainer() {
    const bgColor = document.getElementById('editBgColor').value;
    const container = document.querySelector(`#${currentEditingId} div`);

    // Note: Padding is now handled by applyDimensionStyles, so we only need base classes
    container.className = `rounded-lg border-2 border-dashed border-gray-300`;
    container.style.backgroundColor = bgColor;

    applyDimensionStyles(container);

    closeEditModal();
    markAsModified();
}

function saveText() {
    const text = document.getElementById('editValue').value;
    const size = document.getElementById('editTextSize').value;
    const fontFamily = document.getElementById('editFontFamily').value;
    const fontWeight = document.getElementById('editFontWeight').value;
    const fontStyle = document.getElementById('editFontStyle').value;
    const alignment = document.getElementById('editAlignment').value;
    const textColor = document.getElementById('editTextColor').value;

    const paragraph = document.querySelector(`#${currentEditingId} p`);
    paragraph.textContent = text;
    paragraph.className = `${size} leading-relaxed`;
    paragraph.style.fontFamily = fontFamily;
    paragraph.style.fontWeight = fontWeight;
    paragraph.style.fontStyle = fontStyle;
    paragraph.style.textAlign = alignment;
    paragraph.style.color = textColor;

    applyDimensionStyles(paragraph);

    closeEditModal();
    markAsModified();
}

function saveImage() {
    const urlInput = document.getElementById('editValue');
    const url = urlInput ? urlInput.value : '';
    const alt = document.getElementById('editAlt').value;
    const fileInput = document.getElementById('imageUpload'); // Ensure this ID matches getEditFields
    const borderRadius = document.getElementById('editBorderRadius').value;
    const shadow = document.getElementById('editShadow').value;
    const alignment = document.getElementById('editImageAlign').value;

    const img = document.querySelector(`#${currentEditingId} img`);
    // const imgContainer = img.parentElement; // We target img directly now for styles

    const updateImage = (src) => {
        if (src) img.src = src;
        img.alt = alt || 'Image';

        // 1. Apply Dimensions & Common Spacing
        applyDimensionStyles(img);

        // 2. Apply Image-Specific Styles
        img.style.borderRadius = borderRadius;

        const shadowEffects = {
            'none': 'none',
            'shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            'shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        };
        img.style.boxShadow = shadowEffects[shadow] || 'none';

        // 3. Apply Alignment (Overrides margins set by applyDimensionStyles if specific alignment requested)
        // Ensure image is block level to accept margins if width < 100%
        img.style.display = 'block';

        if (alignment === 'center') {
            img.style.marginLeft = 'auto';
            img.style.marginRight = 'auto';
        } else if (alignment === 'right') {
            img.style.marginLeft = 'auto';
            img.style.marginRight = '0';
        } else if (alignment === 'left') {
            img.style.marginLeft = '0';
            img.style.marginRight = 'auto';
        }

        closeEditModal();
        markAsModified();
    };

    if (fileInput && fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function (e) {
            updateImage(e.target.result);
        }
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        updateImage(url);
    }
}

function saveVideo() {
    const url = document.getElementById('editValue').value;
    const videoContainer = document.querySelector(`#${currentEditingId} .aspect-video`);

    if (url && videoContainer) {
        // Simple YouTube ID extraction or Embed URL check
        let finalUrl = url;
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1].split('&')[0];
            finalUrl = `https://youtube.com/embed/${videoId}`;
        } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1];
            finalUrl = `https://youtube.com/embed/${videoId}`;
        }

        videoContainer.innerHTML = `
            <iframe class="w-full h-full rounded-lg" src="${finalUrl}" frameborder="0" allowfullscreen></iframe>
        `;
        videoContainer.classList.remove('bg-gray-100', 'flex', 'items-center', 'justify-center', 'border-2', 'border-gray-300');
    }

    if (videoContainer) {
        applyDimensionStyles(videoContainer);
    }

    closeEditModal();
    markAsModified();
}

function saveButton() {
    const text = document.getElementById('editValue').value;
    const link = document.getElementById('editLink').value;
    const color = document.getElementById('editBtnColor').value;
    const btn = document.querySelector(`#${currentEditingId} a`);

    btn.textContent = text;
    btn.href = link || '#';
    btn.style.backgroundColor = color;

    applyDimensionStyles(btn);

    closeEditModal();
    markAsModified();
}

function saveList() {
    const items = document.getElementById('editValue').value.split('\n').filter(i => i.trim());
    const listType = document.getElementById('editListType').value;

    // For lists, we replace the list element inside the block
    const oldList = document.querySelector(`#${currentEditingId} ul`) || document.querySelector(`#${currentEditingId} ol`);

    if (oldList) {
        const newList = document.createElement(listType === 'decimal' ? 'ol' : 'ul');
        newList.className = listType === 'decimal'
            ? 'list-decimal list-inside space-y-2 text-gray-700'
            : 'list-disc list-inside space-y-2 text-gray-700';

        // Copy processed dimensions from old list if we wanted to persist them? 
        // No, current Edit flow resets content. 
        // We should apply new dimensions from controls.

        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            newList.appendChild(li);
        });

        oldList.replaceWith(newList);

        // Re-query to get the new element in DOM
        const updatedList = document.querySelector(`#${currentEditingId} ul`) || document.querySelector(`#${currentEditingId} ol`);
        if (updatedList) applyDimensionStyles(updatedList);
    }

    closeEditModal();
    markAsModified();
}

function saveQuote() {
    const text = document.getElementById('editValue').value;
    const quote = document.querySelector(`#${currentEditingId} blockquote`);
    quote.textContent = text; // Preserves quotes if they are part of CSS or structure? 
    // The template has quotes in textContent "Your inspirational quote...".
    // If I just set textContent it removes the " " unless added.
    // Let's wrap in quotes if not present? Or just raw text.
    // The template uses `border-l-4` style, quotes might be typographic.
    // Let's just set the text. The user can add quotes if they want.

    applyDimensionStyles(quote);

    closeEditModal();
    markAsModified();
}

function saveCode() {
    const text = document.getElementById('editValue').value;
    const codeBlock = document.querySelector(`#${currentEditingId} code`);
    const preBlock = document.querySelector(`#${currentEditingId} pre`);

    codeBlock.textContent = text;

    // Apply dimensions to the pre wrapper
    applyDimensionStyles(preBlock);

    closeEditModal();
    markAsModified();
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    currentEditingId = null;
}

// Block Management
function duplicateBlock(blockId) {
    const original = document.getElementById(blockId);
    const clone = original.cloneNode(true);
    clone.id = `block-${blockCounter++}`;

    // Re-attach event listeners
    clone.draggable = true;
    clone.addEventListener('dragstart', handleBlockDragStart);
    clone.addEventListener('dragend', handleBlockDragEnd);
    clone.addEventListener('dragover', handleBlockDragOver);
    clone.addEventListener('drop', handleBlockDrop);

    original.parentNode.insertBefore(clone, original.nextSibling);
    showNotification('Block duplicated!', 'success');
    markAsModified();
}

function moveBlockUp(blockId) {
    const block = document.getElementById(blockId);
    const prev = block.previousElementSibling;
    if (prev) {
        block.parentNode.insertBefore(block, prev);
        markAsModified();
    }
}

function moveBlockDown(blockId) {
    const block = document.getElementById(blockId);
    const next = block.nextElementSibling;
    if (next) {
        block.parentNode.insertBefore(next, block);
        markAsModified();
    }
}

function deleteBlock(blockId) {
    if (confirm('Delete this element?')) {
        document.getElementById(blockId).remove();

        // Check if canvas is empty
        const content = document.getElementById('canvasContent');
        if (!content.querySelector('.content-block')) {
            content.innerHTML = `
                <div class="text-center text-gray-400 py-20" id="emptyState">
                    <span class="material-symbols-outlined text-6xl mb-4 block">edit_note</span>
                    <p class="text-lg font-medium">Drag elements from the sidebar</p>
                    <p class="text-sm mt-2">Or choose a template to get started</p>
                </div>
            `;
        }

        showNotification('Block deleted', 'info');
        markAsModified();
    }
}

// Templates
function loadTemplate(templateName) {
    const content = document.getElementById('canvasContent');
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.remove();

    content.innerHTML = '';

    switch (templateName) {
        case 'basic':
            addElement('heading');
            addElement('image');
            addElement('text');
            addElement('text');
            break;
        case 'multimedia':
            addElement('heading');
            addElement('image');
            addElement('text');
            addElement('video');
            addElement('text');
            addElement('button');
            break;
        case 'tutorial':
            addElement('heading');
            addElement('text');
            addElement('image');
            addElement('list');
            addElement('image');
            addElement('list');
            addElement('quote');
            break;
    }

    showNotification(`${templateName.charAt(0).toUpperCase() + templateName.slice(1)} template loaded!`, 'success');
}

// Auto-save
let isModified = false;

function setupAutoSave() {
    setInterval(() => {
        if (isModified) {
            autoSave();
        }
    }, 30000); // Auto-save every 30 seconds
}

function markAsModified() {
    isModified = true;
    document.getElementById('saveStatus').textContent = 'Unsaved';
}

function autoSave() {
    const data = collectBlogData();
    localStorage.setItem('blog_draft', JSON.stringify(data));
    document.getElementById('saveStatus').textContent = 'Saved';
    isModified = false;
}

// Preview Blog
function previewBlog() {
    const content = document.getElementById('blogCanvas').innerHTML;
    const win = window.open('', 'Preview', 'width=900,height=800');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Blog Preview</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
            <style>
                body { padding: 40px; max-width: 900px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .content-block, .block-controls, .block-type-label { display: none !important; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `);
}

// Collect blog data
// --- Dimension & Spacing Helpers ---

function getDimensionControls(element) {
    // Get existing values or defaults (use Computed Style to capture class-based styles)
    const computed = window.getComputedStyle(element);

    const width = element.style.width ? parseInt(element.style.width) : 100;
    const minHeight = element.style.minHeight ? parseInt(element.style.minHeight) : 0;

    // Use computed padding/margin if inline style is not set (handles Tailwind classes like p-6)
    const padding = element.style.padding ? parseInt(element.style.padding) : (parseInt(computed.paddingTop) || 0);
    const marginTop = element.style.marginTop ? parseInt(element.style.marginTop) : (parseInt(computed.marginTop) || 0);

    const isResizable = element.style.resize === 'both';

    return `
        <div class="border-t border-gray-200 pt-4 mt-4">
            <h4 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-base">aspect_ratio</span>
                Dimensions & Spacing
            </h4>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Width (%)</label>
                    <div class="flex items-center gap-2">
                        <input type="range" id="editWidth" min="20" max="100" value="${width}" 
                               class="flex-1 h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                               oninput="document.getElementById('widthVal').textContent = this.value + '%'">
                        <span class="text-xs text-gray-500 w-8" id="widthVal">${width}%</span>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Min Height (px)</label>
                    <input type="number" id="editMinHeight" value="${minHeight}" min="0" 
                           class="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Inside Spacing (px)</label>
                    <div class="flex items-center gap-2">
                        <input type="range" id="editPadding" min="0" max="100" value="${padding}" 
                               class="flex-1 h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                               oninput="document.getElementById('paddingVal').textContent = this.value + 'px'">
                        <span class="text-xs text-gray-500 w-8" id="paddingVal">${padding}px</span>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Vertical Gap (px)</label>
                    <div class="flex items-center gap-2">
                        <input type="range" id="editSpacing" min="0" max="100" value="${marginTop}" 
                               class="flex-1 h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                               oninput="document.getElementById('spacingVal').textContent = this.value + 'px'">
                        <span class="text-xs text-gray-500 w-8" id="spacingVal">${marginTop}px</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input type="checkbox" id="editResize" ${isResizable ? 'checked' : ''} 
                       class="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500">
                <label for="editResize" class="ml-2 text-sm text-gray-700 select-none">
                    Enable Manual Drag-to-Resize Handle
                </label>
            </div>
        </div>
    `;
}

function applyDimensionStyles(element) {
    const width = document.getElementById('editWidth').value;
    const minHeight = document.getElementById('editMinHeight').value;
    const padding = document.getElementById('editPadding').value;
    const spacing = document.getElementById('editSpacing').value;
    const isResizable = document.getElementById('editResize').checked;

    // Apply dimensions
    element.style.width = width + '%';
    element.style.minHeight = minHeight > 0 ? minHeight + 'px' : '';
    element.style.padding = padding + 'px';
    element.style.marginTop = spacing + 'px';
    element.style.marginBottom = spacing + 'px';

    // Auto-center if width < 100% and not explicitly aligned
    if (parseInt(width) < 100) {
        if (!element.style.textAlign || element.style.textAlign === 'left') {
            // If strictly left aligned, simple margin auto works for centering block but keeping content left?
            // No, margin:auto centers the Block itself.
            element.style.marginLeft = 'auto';
            element.style.marginRight = 'auto';
        }
        // If specific alignment logic exists (like for images), it handles margins separately
    } else {
        element.style.marginLeft = '';
        element.style.marginRight = '';
    }

    // Handle Resize Capability
    if (isResizable) {
        element.style.resize = 'both';
        element.style.overflow = 'hidden'; // Needed for resize handle to show
        element.style.maxWidth = '100%';
        element.classList.add('border', 'border-dashed', 'border-gray-300', 'hover:border-purple-500');
    } else {
        element.style.resize = '';
        element.style.overflow = '';
        element.classList.remove('border', 'border-dashed', 'border-gray-300', 'hover:border-purple-500');
    }
}

function extractFirstImage(htmlContent) {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    const img = div.querySelector('img');
    return img ? img.src : '';
}

function collectBlogData() {
    const content = document.getElementById('canvasContent').innerHTML;

    return {
        title: document.getElementById('blogTitle').value,
        slug: document.getElementById('blogSlug').value,
        category: document.getElementById('blogCategory').value,
        author: document.getElementById('blogAuthor').value,
        tags: document.getElementById('blogTags').value,
        excerpt: document.getElementById('blogExcerpt').value,
        content: content,
        isFeatured: document.getElementById('isFeatured').checked,
        isPublished: document.getElementById('isPublished').checked,
        enableComments: document.getElementById('enableComments').checked,
        createdAt: new Date().toISOString()
    };
}

// Save Blog
function saveBlog() {
    const rawData = collectBlogData();

    // Validation
    if (!rawData.title) {
        showNotification('Please enter a blog title', 'error');
        return;
    }
    if (!rawData.slug) {
        showNotification('Please enter a URL slug', 'error');
        return;
    }
    if (!rawData.author) {
        showNotification('Please enter author name', 'error');
        return;
    }

    // Map data to match API expectations
    const payload = {
        title: rawData.title,
        slug: rawData.slug,
        excerpt: rawData.excerpt,
        content: rawData.content,
        category: rawData.category,
        authorName: rawData.author,
        tags: rawData.tags ? rawData.tags.split(',').map(tag => tag.trim()) : [],
        isFeatured: rawData.isFeatured,
        isPublished: rawData.isPublished,
        // Optional fields
        readTime: Math.ceil(rawData.content.split(' ').length / 200), // Estimate read time
        featuredImage: extractFirstImage(rawData.content) // Extract first image from content
    };

    console.log('Sending blog data:', payload);
    showNotification('Publishing blog...', 'info');

    // Send to backend API
    fetch('http://localhost:3000/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Failed to save blog') });
            }
            return response.json();
        })
        .then(result => {
            console.log('Blog saved successfully:', result);
            showNotification('Blog published successfully!', 'success');
            localStorage.removeItem('blog_draft');

            // Updates the "Saved" status
            document.getElementById('saveStatus').textContent = 'Saved';
            isModified = false;

            // Redirect to the new blog article
            if (result.data && result.data.slug) {
                setTimeout(() => {
                    window.location.href = `blog-article.html?slug=${result.data.slug}`;
                }, 1000);
            } else {
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Error saving blog:', error);
            showNotification(`Error: ${error.message}`, 'error');
        });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600'
    };

    notification.className = `fixed top-20 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-in`;
    notification.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'info'}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Helper function for alignment buttons
function setTempAlign(alignment) {
    document.getElementById('editAlignment').value = alignment;

    // Update button styles
    const buttons = document.querySelectorAll('[onclick^="setTempAlign"]');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${alignment}'`)) {
            btn.className = 'px-4 py-2 border rounded-lg bg-purple-100 border-purple-500';
        } else {
            btn.className = 'px-4 py-2 border rounded-lg border-gray-300 hover:bg-gray-50';
        }
    });
}

// Helper function to convert RGB to HEX
function rgbToHex(rgb) {
    // Handle hex colors that are already in hex format
    if (rgb.startsWith('#')) return rgb;

    // Handle rgb() format
    if (rgb.startsWith('rgb')) {
        const values = rgb.match(/\d+/g);
        if (values && values.length >= 3) {
            const r = parseInt(values[0]).toString(16).padStart(2, '0');
            const g = parseInt(values[1]).toString(16).padStart(2, '0');
            const b = parseInt(values[2]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
    }

    // Default fallback
    return '#374151';
}

// Helper function for image alignment buttons
function setImageAlign(alignment) {
    document.getElementById('editImageAlign').value = alignment;

    // Update button styles
    const buttons = document.querySelectorAll('[onclick^="setImageAlign"]');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${alignment}'`)) {
            btn.className = 'px-4 py-2 border rounded-lg bg-purple-100 border-purple-500';
        } else {
            btn.className = 'px-4 py-2 border rounded-lg border-gray-300 hover:bg-gray-50';
        }
    });
}
