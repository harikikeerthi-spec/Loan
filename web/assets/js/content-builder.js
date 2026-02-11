// Advanced Drag & Drop Content Builder for Blog Creation
// Supports: Containers, Grids, Headings, Images, Videos, Buttons, Text Editor

let contentBlocks = [];
let blockIdCounter = 0;
let currentEditingBlock = null;

// Content Block Templates
const blockTemplates = {
    container: {
        type: 'container',
        icon: 'view_agenda',
        label: 'Container',
        html: '<div class="content-block-container p-6 bg-gray-50 dark:bg-gray-800 rounded-lg"></div>',
        editable: { padding: true, background: true }
    },
    grid: {
        type: 'grid',
        icon: 'grid_view',
        label: 'Grid Layout',
        html: '<div class="content-block-grid grid grid-cols-2 gap-4"></div>',
        editable: { columns: true, gap: true }
    },
    heading: {
        type: 'heading',
        icon: 'title',
        label: 'Heading',
        html: '<h2 class="content-block-heading text-3xl font-bold mb-4">Your Heading Here</h2>',
        editable: { text: true, size: true, style: true }
    },
    image: {
        type: 'image',
        icon: 'image',
        label: 'Image',
        html: '<div class="content-block-image"><img src="https://via.placeholder.com/800x400" alt="Image" class="w-full rounded-lg"></div>',
        editable: { src: true, alt: true, size: true }
    },
    video: {
        type: 'video',
        icon: 'videocam',
        label: 'Video',
        html: '<div class="content-block-video aspect-video"><iframe class="w-full h-full rounded-lg" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe></div>',
        editable: { url: true }
    },
    button: {
        type: 'button',
        icon: 'smart_button',
        label: 'Button',
        html: '<a href="#" class="content-block-button inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:scale-105 transition-all">Click Me</a>',
        editable: { text: true, link: true, style: true }
    },
    text: {
        type: 'text',
        icon: 'text_fields',
        label: 'Text Editor',
        html: '<div class="content-block-text prose max-w-none"><p>Start writing your content here...</p></div>',
        editable: { richText: true }
    }
};

// Initialize Content Builder
function initializeContentBuilder() {
    const builderArea = document.getElementById('contentBuilderArea');
    if (!builderArea) return;

    // Create builder toolbar
    createBuilderToolbar();

    // Make builder area droppable
    setupDropZone(builderArea);

    // Initialize existing content if any
    loadExistingContent();
}

// Create Builder Toolbar with Draggable Elements
function createBuilderToolbar() {
    const toolbar = document.getElementById('builderToolbar');
    if (!toolbar) return;

    toolbar.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Content Blocks</h3>
            <div class="grid grid-cols-2 gap-2">
                ${Object.entries(blockTemplates).map(([key, block]) => `
                    <div draggable="true" 
                         data-block-type="${key}"
                         class="builder-block-item flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-move hover:bg-primary/10 hover:border-primary border-2 border-transparent transition-all group">
                        <span class="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-400 group-hover:text-primary mb-1">${block.icon}</span>
                        <span class="text-xs font-medium text-gray-700 dark:text-gray-300">${block.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Add drag event listeners
    toolbar.querySelectorAll('.builder-block-item').forEach(item => {
        item.addEventListener('dragstart', handleBlockDragStart);
        item.addEventListener('dragend', handleBlockDragEnd);
    });
}

// Setup drop zone for content blocks
function setupDropZone(area) {
    area.addEventListener('dragover', handleDragOver);
    area.addEventListener('drop', handleDrop);
    area.addEventListener('dragleave', handleDragLeave);
}

// Drag & Drop Handlers
function handleBlockDragStart(e) {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', e.target.dataset.blockType);
    e.target.classList.add('opacity-50');
}

function handleBlockDragEnd(e) {
    e.target.classList.remove('opacity-50');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const builderArea = document.getElementById('contentBuilderArea');
    builderArea.classList.add('border-primary', 'bg-primary/5');
}

function handleDragLeave(e) {
    const builderArea = document.getElementById('contentBuilderArea');
    builderArea.classList.remove('border-primary', 'bg-primary/5');
}

function handleDrop(e) {
    e.preventDefault();

    const builderArea = document.getElementById('contentBuilderArea');
    builderArea.classList.remove('border-primary', 'bg-primary/5');

    const blockType = e.dataTransfer.getData('text/plain');
    if (blockType && blockTemplates[blockType]) {
        addContentBlock(blockType);
    }
}

// Add Content Block to Builder
function addContentBlock(type) {
    const template = blockTemplates[type];
    const blockId = `block-${blockIdCounter++}`;

    const block = {
        id: blockId,
        type: type,
        data: {},
        order: contentBlocks.length
    };

    contentBlocks.push(block);
    renderContentBlock(block);

    showNotification(`${template.label} block added!`, 'success');
}

// Render Content Block
function renderContentBlock(block) {
    const builderArea = document.getElementById('contentBuilderArea');
    const template = blockTemplates[block.type];

    const blockWrapper = document.createElement('div');
    blockWrapper.className = 'content-block-wrapper relative group mb-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary transition-all';
    blockWrapper.id = block.id;
    blockWrapper.draggable = true;

    blockWrapper.innerHTML = `
        <!-- Block Controls -->
        <div class="block-controls absolute -top-3 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="editBlock('${block.id}')" 
                    class="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">edit</span>
                Edit
            </button>
            <button onclick="duplicateBlock('${block.id}')" 
                    class="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">content_copy</span>
                Copy
            </button>
            <button onclick="moveBlockUp('${block.id}')" 
                    class="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">
                <span class="material-symbols-outlined text-sm">arrow_upward</span>
            </button>
            <button onclick="moveBlockDown('${block.id}')" 
                    class="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">
                <span class="material-symbols-outlined text-sm">arrow_downward</span>
            </button>
            <button onclick="deleteBlock('${block.id}')" 
                    class="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                <span class="material-symbols-outlined text-sm">delete</span>
            </button>
        </div>
        
        <!-- Block Type Label -->
        <div class="absolute -top-3 left-2 px-2 py-1 bg-primary text-white text-xs rounded font-medium">
            ${template.label}
        </div>
        
        <!-- Block Content -->
        <div class="block-content mt-4">
            ${template.html}
        </div>
    `;

    builderArea.appendChild(blockWrapper);

    // Add reorder drag listeners
    blockWrapper.addEventListener('dragstart', handleBlockReorderStart);
    blockWrapper.addEventListener('dragover', handleBlockReorderOver);
    blockWrapper.addEventListener('drop', handleBlockReorderDrop);
}

// Block Reordering
let draggedBlock = null;

function handleBlockReorderStart(e) {
    draggedBlock = e.currentTarget;
    e.currentTarget.classList.add('opacity-50');
}

function handleBlockReorderOver(e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(e.currentTarget.parentElement, e.clientY);
    const builderArea = document.getElementById('contentBuilderArea');

    if (afterElement == null) {
        builderArea.appendChild(draggedBlock);
    } else {
        builderArea.insertBefore(draggedBlock, afterElement);
    }
}

function handleBlockReorderDrop(e) {
    e.preventDefault();
    if (draggedBlock) {
        draggedBlock.classList.remove('opacity-50');
        draggedBlock = null;
        updateBlockOrder();
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.content-block-wrapper:not(.opacity-50)')];

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

// Edit Block
function editBlock(blockId) {
    const block = contentBlocks.find(b => b.id === blockId);
    if (!block) return;

    const template = blockTemplates[block.type];
    currentEditingBlock = block;

    // Open edit modal based on block type
    openBlockEditModal(block, template);
}

function openBlockEditModal(block, template) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'blockEditModal';

    let editFields = '';

    // Generate edit fields based on block type
    switch (block.type) {
        case 'heading':
            editFields = `
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Heading Text</label>
                    <input type="text" id="editHeadingText" value="${block.data.text || 'Your Heading Here'}" 
                           class="w-full px-4 py-2 border rounded-lg">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Size</label>
                    <select id="editHeadingSize" class="w-full px-4 py-2 border rounded-lg">
                        <option value="text-xl">Small (H3)</option>
                        <option value="text-2xl">Medium (H2)</option>
                        <option value="text-3xl" selected>Large (H1)</option>
                        <option value="text-4xl">Extra Large</option>
                    </select>
                </div>
            `;
            break;
        case 'image':
            editFields = `
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Image URL</label>
                    <input type="url" id="editImageSrc" value="${block.data.src || ''}" 
                           class="w-full px-4 py-2 border rounded-lg" placeholder="https://example.com/image.jpg">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Alt Text</label>
                    <input type="text" id="editImageAlt" value="${block.data.alt || ''}" 
                           class="w-full px-4 py-2 border rounded-lg">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Or Upload Image</label>
                    <button type="button" onclick="uploadBlockImage('${block.id}')" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg">
                        Upload Image
                    </button>
                </div>
            `;
            break;
        case 'video':
            editFields = `
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Video URL (YouTube/Vimeo)</label>
                    <input type="url" id="editVideoUrl" value="${block.data.url || ''}" 
                           class="w-full px-4 py-2 border rounded-lg" placeholder="https://youtube.com/embed/...">
                    <p class="text-xs text-gray-500 mt-1">Use embed URL format</p>
                </div>
            `;
            break;
        case 'button':
            editFields = `
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Button Text</label>
                    <input type="text" id="editButtonText" value="${block.data.text || 'Click Me'}" 
                           class="w-full px-4 py-2 border rounded-lg">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Link URL</label>
                    <input type="url" id="editButtonLink" value="${block.data.link || '#'}" 
                           class="w-full px-4 py-2 border rounded-lg">
                </div>
            `;
            break;
        case 'text':
            editFields = `
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Content</label>
                    <textarea id="editTextContent" rows="10" 
                              class="w-full px-4 py-2 border rounded-lg font-mono">${block.data.content || '<p>Start writing...</p>'}</textarea>
                    <p class="text-xs text-gray-500 mt-1">Supports HTML</p>
                </div>
            `;
            break;
        default:
            editFields = '<p class="text-gray-500">This block type has no editable properties.</p>';
    }

    modal.innerHTML = `
        <div class="modal-content p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold">Edit ${template.label}</h3>
                <button onclick="closeBlockEditModal()" class="material-symbols-outlined text-2xl cursor-pointer">close</button>
            </div>
            <div>
                ${editFields}
            </div>
            <div class="flex gap-4 mt-6">
                <button onclick="saveBlockEdit()" 
                        class="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:scale-105 transition-all">
                    Save Changes
                </button>
                <button onclick="closeBlockEditModal()" 
                        class="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium">
                    Cancel
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function saveBlockEdit() {
    if (!currentEditingBlock) return;

    const block = currentEditingBlock;

    // Save data based on block type
    switch (block.type) {
        case 'heading':
            block.data.text = document.getElementById('editHeadingText').value;
            block.data.size = document.getElementById('editHeadingSize').value;
            break;
        case 'image':
            block.data.src = document.getElementById('editImageSrc').value;
            block.data.alt = document.getElementById('editImageAlt').value;
            break;
        case 'video':
            block.data.url = document.getElementById('editVideoUrl').value;
            break;
        case 'button':
            block.data.text = document.getElementById('editButtonText').value;
            block.data.link = document.getElementById('editButtonLink').value;
            break;
        case 'text':
            block.data.content = document.getElementById('editTextContent').value;
            break;
    }

    // Re-render the block
    updateBlockContent(block);
    closeBlockEditModal();

    showNotification('Block updated successfully!', 'success');
}

function updateBlockContent(block) {
    const blockElement = document.getElementById(block.id);
    if (!blockElement) return;

    const contentArea = blockElement.querySelector('.block-content');

    switch (block.type) {
        case 'heading':
            contentArea.innerHTML = `<h2 class="content-block-heading ${block.data.size || 'text-3xl'} font-bold mb-4">${block.data.text}</h2>`;
            break;
        case 'image':
            contentArea.innerHTML = `<img src="${block.data.src}" alt="${block.data.alt}" class="w-full rounded-lg">`;
            break;
        case 'video':
            contentArea.innerHTML = `<div class="aspect-video"><iframe class="w-full h-full rounded-lg" src="${block.data.url}" frameborder="0" allowfullscreen></iframe></div>`;
            break;
        case 'button':
            contentArea.innerHTML = `<a href="${block.data.link}" class="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:scale-105 transition-all">${block.data.text}</a>`;
            break;
        case 'text':
            contentArea.innerHTML = `<div class="prose max-w-none">${block.data.content}</div>`;
            break;
    }
}

function closeBlockEditModal() {
    const modal = document.getElementById('blockEditModal');
    if (modal) modal.remove();
    currentEditingBlock = null;
}

// Delete Block
function deleteBlock(blockId) {
    if (!confirm('Are you sure you want to delete this block?')) return;

    contentBlocks = contentBlocks.filter(b => b.id !== blockId);
    document.getElementById(blockId)?.remove();

    showNotification('Block deleted', 'success');
}

// Duplicate Block
function duplicateBlock(blockId) {
    const block = contentBlocks.find(b => b.id === blockId);
    if (!block) return;

    const newBlock = {
        ...block,
        id: `block-${blockIdCounter++}`,
        order: contentBlocks.length
    };

    contentBlocks.push(newBlock);
    renderContentBlock(newBlock);

    showNotification('Block duplicated!', 'success');
}

// Move Blocks
function moveBlockUp(blockId) {
    const index = contentBlocks.findIndex(b => b.id === blockId);
    if (index <= 0) return;

    [contentBlocks[index], contentBlocks[index - 1]] = [contentBlocks[index - 1], contentBlocks[index]];
    reorderBlocks();
}

function moveBlockDown(blockId) {
    const index = contentBlocks.findIndex(b => b.id === blockId);
    if (index === -1 || index >= contentBlocks.length - 1) return;

    [contentBlocks[index], contentBlocks[index + 1]] = [contentBlocks[index + 1], contentBlocks[index]];
    reorderBlocks();
}

function reorderBlocks() {
    const builderArea = document.getElementById('contentBuilderArea');
    builderArea.innerHTML = '';
    contentBlocks.forEach(block => renderContentBlock(block));
}

function updateBlockOrder() {
    const builderArea = document.getElementById('contentBuilderArea');
    const blockElements = builderArea.querySelectorAll('.content-block-wrapper');

    contentBlocks = Array.from(blockElements).map((el, index) => {
        const block = contentBlocks.find(b => b.id === el.id);
        return { ...block, order: index };
    });
}

// Get Final HTML Content
function getBuilderContent() {
    let html = '';

    contentBlocks.forEach(block => {
        const blockEl = document.getElementById(block.id);
        if (blockEl) {
            const content = blockEl.querySelector('.block-content').innerHTML;
            html += content + '\n';
        }
    });

    return html;
}

// Save content to the main form
function saveBuilderToForm() {
    const contentHtml = getBuilderContent();
    const contentJson = JSON.stringify(contentBlocks);

    // Update the main content textarea
    document.getElementById('content').value = contentHtml;

    // Store JSON structure (optional, for future editing)
    document.getElementById('contentBuilderData').value = contentJson;

    showNotification('Content saved to form!', 'success');
}

// Load existing content
function loadExistingContent() {
    const savedData = document.getElementById('contentBuilderData')?.value;
    if (savedData) {
        try {
            contentBlocks = JSON.parse(savedData);
            contentBlocks.forEach(block => renderContentBlock(block));
        } catch (e) {
            console.error('Failed to load existing content:', e);
        }
    }
}

// Notification Helper
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-in ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white`;
    notification.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'info'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeContentBuilder();
});
