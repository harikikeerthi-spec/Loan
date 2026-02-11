// Drag and Drop Image Upload for Blog Creation
// Add this code to admin-dashboard.js

// ================= IMAGE UPLOAD FUNCTIONALITY =================

let uploadedImageFile = null;

// Initialize drag and drop on page load
function setupImageUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('imageUploadInput');

    if (!dropZone || !fileInput) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    // Handle click to browse
    dropZone.addEventListener('click', () => {
        if (!document.getElementById('imagePreviewContainer').classList.contains('hidden')) {
            return; // Don't open file browser if image is already uploaded
        }
        fileInput.click();
    });

    // Handle file selection from browse
    fileInput.addEventListener('change', handleFileSelect, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    const dropZone = document.getElementById('dropZone');
    dropZone.classList.add('border-primary', 'bg-primary/5');
}

function unhighlight(e) {
    const dropZone = document.getElementById('dropZone');
    dropZone.classList.remove('border-primary', 'bg-primary/5');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length === 0) return;

    const file = files[0];

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showError('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
        return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        showError('Image size must be less than 5MB');
        return;
    }

    uploadedImageFile = file;
    uploadImage(file);
}

async function uploadImage(file) {
    console.log('🖼️  Image Upload Functionality');
    console.log('File selected:', file.name, '(' + (file.size / 1024).toFixed(2) + ' KB)');

    // Show loading state
    document.getElementById('dropZoneContent').classList.add('hidden');
    document.getElementById('uploadLoading').classList.remove('hidden');

    try {
        // For demo: Convert to Base64 data URL
        // In production, you would upload to a server or cloud storage
        const reader = new FileReader();

        reader.onload = function (e) {
            const dataURL = e.target.result;

            // Simulate upload delay
            setTimeout(() => {
                // Hide loading
                document.getElementById('uploadLoading').classList.add('hidden');

                // Show preview
                document.getElementById('imagePreview').src = dataURL;
                document.getElementById('imagePreviewContainer').classList.remove('hidden');

                // Set the featured image value (in production, this would be the uploaded URL)
                document.getElementById('featuredImage').value = dataURL;

                showSuccess('Image uploaded successfully!');
                console.log('✅ Image uploaded and ready');
            }, 1000);
        };

        reader.readAsDataURL(file);

        // IN PRODUCTION: Upload to server or cloud storage
        /*
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/upload/blog-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            const imageUrl = data.url;
            
            // Hide loading
            document.getElementById('uploadLoading').classList.add('hidden');
            
            // Show preview
            document.getElementById('imagePreview').src = imageUrl;
            document.getElementById('imagePreviewContainer').classList.remove('hidden');
            
            // Set the featured image value
            document.getElementById('featuredImage').value = imageUrl;
            
            showSuccess('Image uploaded successfully!');
        } else {
            throw new Error('Upload failed');
        }
        */

    } catch (error) {
        console.error('Upload error:', error);
        showError('Failed to upload image. Please try again.');

        // Reset to initial state
        document.getElementById('uploadLoading').classList.add('hidden');
        document.getElementById('dropZoneContent').classList.remove('hidden');
        uploadedImageFile = null;
    }
}

function removeImage() {
    // Reset everything
    document.getElementById('imagePreviewContainer').classList.add('hidden');
    document.getElementById('dropZoneContent').classList.remove('hidden');
    document.getElementById('imagePreview').src = '';
    document.getElementById('featuredImage').value = '';
    document.getElementById('imageUploadInput').value = '';
    uploadedImageFile = null;

    showSuccess('Image removed');
}

function changeImage() {
    // Trigger file browser
    document.getElementById('imageUploadInput').click();
}

// Show success message
function showSuccess(message) {
    // Create or update notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-in';
    notification.innerHTML = `
        <span class="material-symbols-outlined">check_circle</span>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show error message  
function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-in';
    notification.innerHTML = `
        <span class="material-symbols-outlined">error</span>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }
`;
document.head.appendChild(style);

// Call this when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupImageUpload();
});
