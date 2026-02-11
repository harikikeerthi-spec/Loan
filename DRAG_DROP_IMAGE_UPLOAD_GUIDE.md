# Drag & Drop Image Upload Integration Guide

## 🎯 What's Been Added

A complete drag-and-drop image upload system for blog creation in the admin dashboard.

---

## 📁 Files Created

✅ **`web/assets/js/blog-image-upload.js`** - Complete drag-and-drop functionality

---

## 🔧 Integration Steps

### Step 1: Add the JavaScript File

Add this script tag to `admin-dashboard.html` before the closing `</body>` tag:

```html
<!-- Drag and Drop Image Upload -->
<script src="assets/js/blog-image-upload.js"></script>
```

### Step 2: Replace the Featured Image Section

In `admin-dashboard.html`, find this section (around line 478-489):

```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
        <label class="block text-sm font-medium mb-2">Featured Image URL</label>
        <input type="url" id="featuredImage" placeholder="https://example.com/image.jpg"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:border-primary">
    </div>
    <div>
        <label class="block text-sm font-medium mb-2">Read Time (minutes)</label>
        <input type="number" id="readTime" placeholder="5" min="1"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:border-primary">
    </div>
</div>
```

**Replace it with this:**

```html
<!-- Image Upload Section -->
<div class="space-y-4">
    <label class="block text-sm font-medium mb-2">Featured Image</label>
    
    <!-- Drag and Drop Zone -->
    <div id="dropZone" 
        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-all bg-gray-50 dark:bg-gray-800/50">
        <div id="dropZoneContent">
            <span class="material-symbols-outlined text-6xl text-gray-400 mb-4 block">cloud_upload</span>
            <p class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Drag & Drop Image Here</p>
            <p class="text-sm text-gray-500 mb-4">or click to browse files</p>
            <p class="text-xs text-gray-400">Supported formats: JPG, PNG, GIF, WebP (Max: 5MB)</p>
        </div>
        
        <!-- Loading State -->
        <div id="uploadLoading" class="hidden">
            <div class="flex flex-col items-center">
                <div class="loading-spinner w-12 h-12 mb-4"></div>
                <p class="text-gray-600 dark:text-gray-400">Uploading image...</p>
            </div>
        </div>
        
        <!-- Preview Image -->
        <div id="imagePreviewContainer" class="hidden">
            <img id="imagePreview" src="" alt="Preview" class="max-w-full max-h-64 mx-auto rounded-lg shadow-lg">
            <div class="mt-4 flex justify-center gap-2">
                <button type="button" onclick="removeImage()"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">delete</span>
                    Remove
                </button>
                <button type="button" onclick="changeImage()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">swap_horiz</span>
                    Change
                </button>
            </div>
        </div>
    </div>
    
    <!-- Hidden file input -->
    <input type="file" id="imageUploadInput" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden">
    
    <!-- Hidden URL input (to store uploaded image URL) -->
    <input type="hidden" id="featuredImage" value="">
</div>

<!-- Read Time -->
<div>
    <label class="block text-sm font-medium mb-2">Read Time (minutes)</label>
    <input type="number" id="readTime" placeholder="5" min="1"
        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:border-primary">
</div>
```

---

## ✨ Features

### User Interface
- ✅ **Drag & Drop Zone** - Drag images directly from file explorer
- ✅ **Click to Browse** - Click the zone to select files
- ✅ **Image Preview** - See uploaded image before publishing
- ✅ **Remove/Change Buttons** - Easy image management
- ✅ **Loading Animation** - Visual feedback during upload

### Validations
- ✅ **File Type** - Only JPG, PNG, GIF, WebP allowed
- ✅ **File Size** - Maximum 5MB
- ✅ **Error Messages** - Clear feedback for invalid uploads

### Visual States
1. **Empty State** - Upload icon with instructions
2. **Uploading State** - Loading spinner
3. **Preview State** - Uploaded image with action buttons

---

## 🎨 How It Works

### For Demo/Development:
- Images are converted to **Base64 Data URLs**
- Stored directly in the blog post
- No server upload needed for testing

### For Production:
The code includes commented-out server upload logic around line 130-160 in `blog-image-upload.js`:

```javascript
// IN PRODUCTION: Upload to server or cloud storage
const formData = new FormData();
formData.append('image', file);

const response = await fetch(`${API_BASE_URL}/upload/blog-image`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${adminToken}`
    },
    body: formData
});
```

**Backend Endpoint Needed:**
- `POST /upload/blog-image`
- Accepts multipart/form-data
- Returns: `{ url: 'https://your-cdn.com/image.jpg' }`

---

## 🧪 Testing

1. Go to Admin Dashboard → Create Blog
2. Scroll to "Featured Image" section
3. **Test Drag & Drop:**
   - Drag an image file from your computer
   - Drop it on the zone
   - See upload animation → Preview

4. **Test Browse:**
   - Click the drop zone
   - Select an image from file browser
   - See upload animation → Preview

5. **Test Validation:**
   - Try uploading a PDF (should error)
   - Try uploading a >5MB file (should error)

6. **Test Remove/Change:**
   - Click "Remove" to clear image
   - Click "Change" to select a different image

---

## 📊 What's Stored

The uploaded image URL (or Base64) is stored in the hidden input:
```html
<input type="hidden" id="featuredImage" value="data:image/jpeg;base64,/9j/4AAQ...">
```

This value is then submitted with the blog creation form and saved to the database.

---

## 🚀 Production Setup

### Option 1: Cloud Storage (Recommended)
Upload to AWS S3, Cloudinary, or similar:

```javascript
// backend/src/upload/upload.controller.ts
@Post('blog-image')
@UseGuards(AdminGuard)
@UseInterceptors(FileInterceptor('image'))
async uploadBlogImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.cloudinaryService.upload(file);
    return { success: true, url };
}
```

### Option 2: Local Server Storage
Store in `public/uploads` folder:

```javascript
const storage = multer.diskStorage({
    destination: './public/uploads/blogs/',
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});
```

---

## ✅ Summary

**What You Need to Do:**
1. ✅ Add `<script src="assets/js/blog-image-upload.js"></script>` to admin-dashboard.html
2. ✅ Replace the featured image section with the new HTML (provided above)
3. ✅ Test the drag & drop functionality
4. ✅ (Optional) Implement production image upload endpoint

**Everything else is ready to go!** 🎉

The drag-and-drop system is fully functional for development/demo use with Base64 encoding. For production, just implement the upload endpoint and uncomment/modify the upload code in `blog-image-upload.js`.
