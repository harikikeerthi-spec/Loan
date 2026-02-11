# 🎨 Visual Content Builder - Complete Guide

## ✨ What's New

A complete **drag-and-drop page builder** for creating rich blog content with visual blocks!

---

## 📦 Content Blocks Available

### 1. **📦 Container**
- Creates a styled container with padding and background
- Perfect for grouping content
- Editable: Padding, Background color

### 2. **📊 Grid Layout**
- Multi-column grid system
- Responsive layouts
- Editable: Number of columns, Gap spacing

### 3. **📝 Heading**
- Large, bold headings for sections
- Multiple sizes (H1, H2, H3, etc.)
- Editable: Text, Size, Style

### 4. **🖼️ Image**
- Full-width images with rounded corners
- Alt text support
- Editable: Image URL, Alt text, Size
- **Supports Drag & Drop Upload!**

### 5. **🎥 Video**
- Responsive video embeds
- YouTube/Vimeo support
- Editable: Video URL

### 6. **🔘 Button**
- Call-to-action buttons
- Customizable styling
- Editable: Text, Link URL, Style

### 7. **✍️ Text Editor**
- Rich text content
- HTML support
- Perfect for paragraphs and formatted text
- Editable: Full HTML content

---

## 🎯 How to Use

### **Step 1: Open Visual Builder**

1. Go to **Admin Dashboard** → **Create Blog**
2. You'll see **two tabs**:
   - **Simple Editor** (plain textarea)
   - **Visual Page Builder** (drag-and-drop)
3. Click **"Visual Page Builder"**

### **Step 2: Drag Blocks**

**Left Sidebar - Block Toolbar:**
```
┌─────────────────┐
│ Container  📦   │
│ Grid       📊   │
│ Heading    📝   │
│ Image      🖼️   │
│ Video      🎥   │
│ Button     🔘   │
│ Text       ✍️   │
└─────────────────┘
```

**Right Area - Canvas:**
```
┌──────────────────────────┐
│  Drop blocks here        │
│  to build your content   │
└──────────────────────────┘
```

1. **Grab a block** from the left sidebar
2. **Drag it** to the canvas on the right
3. **Drop it** where you want

### **Step 3: Edit Blocks**

Each block has controls that appear on hover:

```
┌─────────────────────────────────────┐
│ Heading     [Edit] [Copy] [↑][↓][✕] │
│ ─────────────────────────────────   │
│   Your Content Here                 │
└─────────────────────────────────────┘
```

**Actions:**
- **Edit** (✏️) - Edit block content and settings
- **Copy** (📋) - Duplicate the block
- **↑** - Move block up
- **↓** - Move block down
- **Delete** (🗑️) - Remove block

### **Step 4: Reorder Blocks**

You can also **drag entire blocks** to reorder them!
- Click and hold a block
- Drag it up or down
- Drop it in the new position

### **Step 5: Save Content**

When you're done building:

1. Click **"Save to Form"** button
2. Your visual content is converted to HTML
3. The HTML is saved in the main content field
4. Submit the form to create the blog!

---

## 🎬 Example Workflow

### Creating a Blog Post:

1. **Add a Heading** → Edit to "Welcome to My Blog"
2. **Add an Image** → Upload or paste image URL
3. **Add Text** → Write your introduction
4. **Add another Heading** → "Key Features"
5. **Add a Grid** → For multi-column content
6. **Add Buttons** → Call-to-action links
7. **Add Video** → YouTube embed
8. **Click "Save to Form"**
9. **Submit** to create the blog!

Result:
```
┌─────────────────────────────────────┐
│ Welcome to My Blog                  │
│ [Beautiful Header Image]            │
│ This is my introduction text...     │
│                                     │
│ Key Features                        │
│ [Grid with 2 columns of content]    │
│                                     │
│ [Watch Video] [Learn More Button]   │
└─────────────────────────────────────┘
```

---

## ⚙️ Detailed Block Editing

### **Heading Block**
When you click "Edit":
- **Text**: Change the heading text
- **Size**: Small (H3), Medium (H2), Large (H1), Extra Large

### **Image Block**
When you click "Edit":
- **Image URL**: Paste image URL
- **Alt Text**: For SEO and accessibility
- **Upload Image**: Click to upload from computer

### **Video Block**
When you click "Edit":
- **Video URL**: Use YouTube/Vimeo **embed URL**
  - Example: `https://youtube.com/embed/VIDEO_ID`
  - Not: `https://youtube.com/watch?v=VIDEO_ID`

### **Button Block**
When you click "Edit":
- **Button Text**: "Click Me", "Learn More", etc.
- **Link URL**: Where the button goes when clicked

### **Text Block**
When you click "Edit":
- **Content**: Full HTML editor
- Supports: Paragraphs, bold, italic, lists, etc.
- Example HTML:
  ```html
  <p>This is a <strong>bold</strong> paragraph.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
  ```

---

## 🎨 Builder Actions

### **Save to Form** 💾
- Converts your visual blocks to HTML
- Saves to the main content field
- Required before submitting the form

### **Preview** 👁️
- Opens a new window
- Shows how your content will look
- No changes are saved

### **Clear All** 🗑️
- Removes all blocks
- Confirms before deleting
- Cannot be undone!

---

## 💡 Pro Tips

### **1. Use Containers for Sections**
```
Container Block
  ↳ Heading
  ↳ Text
  ↳ Button
```
Groups related content together with styling

### **2. Grid for Side-by-Side Content**
```
Grid (2 columns)
  ↳ Column 1: Image
  ↳ Column 2: Text
```

### **3. Mix Simple + Visual Editors**
- Build structure with **Visual Builder**
- Fine-tune HTML in **Simple Editor**
- Switch between tabs anytime!

### **4. Save Frequently**
Click "Save to Form" often to preserve your work

### **5. Preview Before Publishing**
Use the Preview button to see final result

---

## 🔧 Technical Details

### **Data Storage**

**Two fields are used:**

1. **`content`** (textarea)
   - Final HTML output
   - What's displayed on the blog

2. **`contentBuilderData`** (hidden field)
   - JSON structure of blocks
   - Allows re-editing in visual builder later

Example JSON:
```json
[
  {
    "id": "block-0",
    "type": "heading",
    "data": { "text": "My Heading", "size": "text-3xl" },
    "order": 0
  },
  {
    "id": "block-1",
    "type": "image",
    "data": { "src": "https://...", "alt": "Description" },
    "order": 1
  }
]
```

### **HTML Output**

Visual blocks are converted to clean HTML:

```html
<h2 class="text-3xl font-bold mb-4">My Heading</h2>
<img src="https://..." alt="Description" class="w-full rounded-lg">
<div class="prose max-w-none"><p>My text content...</p></div>
```

---

## 🐛 Troubleshooting

### **Blocks don't appear when dragging?**
- Make sure you're dragging to the canvas area (not the toolbar)
- Look for the dashed border to highlight when dragging

### **Edit modal doesn't open?**
- Click the "Edit" button on the block
- Make sure the block has rendered (has content)

### **Content doesn't save?**
- Click "Save to Form" button first
- Then submit the main create blog form

### **Visual builder doesn't show?**
- Click the "Visual Page Builder" tab
- Refresh the page if needed

---

## 🎉 Summary

**What You Can Do:**
- ✅ Drag and drop 7 different content blocks
- ✅ Edit each block's content and settings
- ✅ Reorder blocks by dragging
- ✅ Duplicate blocks instantly
- ✅ Preview before publishing
- ✅ Save to form for submission

**Perfect For:**
- Creating rich, formatted blog posts
- Building landing pages within blogs
- Adding multimedia content easily
- Non-technical users who prefer visual editing

---

## 🚀 Next Steps

1. **Refresh** your admin dashboard page
2. **Go to** Create Blog
3. **Click** "Visual Page Builder" tab
4. **Start** dragging blocks!

**Everything is ready!** The visual content builder is fully functional and integrated with your blog creation system. 🎨✨
