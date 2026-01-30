# Complete Admin Blog Management API Reference

## Base URL
```
http://localhost:3000
```

---

## 🔐 Authentication
All admin endpoints require:
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## 📊 ADMIN ENDPOINTS

### 1. Get Blog Statistics
**GET** `/blogs/admin/stats`

**Description:** Get dashboard statistics

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "published": 12,
    "draft": 3,
    "featured": 5,
    "totalViews": 4500
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/blogs/admin/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Get ALL Blogs (Including Drafts)
**GET** `/blogs/admin/all`

**Description:** Get all blogs including unpublished drafts

**Query Parameters:**
- `limit` (optional, default: 50) - Number of blogs
- `offset` (optional, default: 0) - Skip blogs

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Blog Title",
      "slug": "blog-slug",
      "excerpt": "Short description",
      "content": "Full content (only in detail views)",
      "category": "Category",
      "authorName": "Author",
      "authorImage": "url",
      "authorRole": "Role",
      "featuredImage": "url",
      "readTime": 5,
      "views": 100,
      "isFeatured": true,
      "isPublished": false,
      "publishedAt": null,
      "createdAt": "2026-01-30T...",
      "updatedAt": "2026-01-30T...",
      "tags": ["tag1", "tag2"]
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/blogs/admin/all?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Create New Blog
**POST** `/blogs`

**Description:** Create a new blog post

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Blog Title",
  "slug": "blog-title",
  "excerpt": "Short description",
  "content": "<h2>Heading</h2><p>Content...</p>",
  "category": "Finance",
  "authorName": "Author Name",
  "authorImage": "https://example.com/author.jpg",
  "authorRole": "Financial Advisor",
  "featuredImage": "https://example.com/featured.jpg",
  "readTime": 5,
  "isFeatured": false,
  "isPublished": true,
  "tags": ["tag1", "tag2", "tag3"]
}
```

**All Fields:**
- `title` *(required)* - Blog title
- `slug` *(required)* - URL-friendly slug
- `excerpt` *(required)* - Short description
- `content` *(required)* - Full HTML content
- `category` *(required)* - Blog category
- `authorName` *(required)* - Author's name
- `authorImage` *(optional)* - Author's profile image URL
- `authorRole` *(optional)* - Author's role/title
- `featuredImage` *(optional)* - Main blog image URL
- `readTime` *(optional)* - Read time in minutes
- `isFeatured` *(optional, default: false)* - Featured flag
- `isPublished` *(optional, default: false)* - Publication status
- `tags` *(optional)* - Array of tags

**Response:**
```json
{
  "success": true,
  "message": "Blog created successfully",
  "data": {
    "id": "new-blog-uuid",
    "title": "Blog Title",
    ...
  }
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/blogs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Understanding Education Loans",
    "slug": "understanding-education-loans",
    "excerpt": "Everything you need to know",
    "content": "<h2>Introduction</h2><p>Content here...</p>",
    "category": "Education",
    "authorName": "Admin Team",
    "readTime": 7,
    "isPublished": true,
    "tags": ["education", "loans", "students"]
  }'
```

---

### 4. Update Blog
**PUT** `/blogs/:id`

**Description:** Update any existing blog

**URL Parameters:**
- `id` - Blog ID (UUID)

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "slug": "updated-slug",
  "excerpt": "Updated excerpt",
  "content": "<h2>Updated content</h2>",
  "category": "New Category",
  "authorName": "New Author",
  "authorImage": "new-url",
  "authorRole": "New Role",
  "featuredImage": "new-image-url",
  "readTime": 10,
  "isFeatured": true,
  "isPublished": true,
  "tags": ["new", "tags"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Blog updated successfully",
  "data": {
    "id": "blog-id",
    "title": "Updated Title",
    ...
  }
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:3000/blogs/BLOG_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Blog Title",
    "isPublished": true,
    "isFeatured": true
  }'
```

---

### 5. Delete Blog
**DELETE** `/blogs/:id`

**Description:** Permanently delete a blog

**URL Parameters:**
- `id` - Blog ID (UUID)

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Blog deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:3000/blogs/BLOG_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Bulk Delete Blogs
**POST** `/blogs/admin/bulk-delete`

**Description:** Delete multiple blogs at once

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "blogIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 blog(s) deleted successfully",
  "deleted": 3
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/blogs/admin/bulk-delete" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blogIds": ["id1", "id2", "id3"]
  }'
```

---

### 7. Bulk Update Blog Status
**POST** `/blogs/admin/bulk-status`

**Description:** Publish or unpublish multiple blogs

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "blogIds": ["uuid-1", "uuid-2"],
  "isPublished": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 blog(s) published successfully",
  "updated": 2
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/blogs/admin/bulk-status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blogIds": ["id1", "id2"],
    "isPublished": true
  }'
```

---

## 🌐 PUBLIC ENDPOINTS (No Auth Required)

### 8. Get Published Blogs
**GET** `/blogs`

**Query Parameters:**
- `category` (optional) - Filter by category
- `featured` (optional) - Filter featured blogs
- `limit` (optional, default: 10)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "success": true,
  "data": [ /* published blogs only */ ],
  "pagination": { ... }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/blogs?limit=10&offset=0"
```

---

### 9. Get Featured Blog
**GET** `/blogs/featured`

**Response:**
```json
{
  "success": true,
  "data": { /* featured blog */ }
}
```

---

### 10. Get Blog by Slug
**GET** `/blogs/slug/:slug`

**URL Parameters:**
- `slug` - Blog slug

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Blog Title",
    "content": "Full content here",
    "comments": [ /* comments */ ],
    ...
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/blogs/slug/understanding-education-loans"
```

---

### 11. Get Blog by ID
**GET** `/blogs/:id`

**URL Parameters:**
- `id` - Blog ID

**Response:**
```json
{
  "success": true,
  "data": { /* blog details */ }
}
```

---

### 12. Get Categories
**GET** `/blogs/categories`

**Response:**
```json
{
  "success": true,
  "data": [
    { "name": "Finance", "count": 10 },
    { "name": "Education", "count": 5 }
  ]
}
```

---

### 13. Search Blogs
**GET** `/blogs/search`

**Query Parameters:**
- `query` (required) - Search term
- `limit` (optional, default: 10)

**Response:**
```json
{
  "success": true,
  "data": [ /* matching blogs */ ],
  "count": 5
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/blogs/search?query=loan&limit=10"
```

---

### 14. Get All Tags
**GET** `/blogs/tags`

**Query Parameters:**
- `limit` (optional) - Limit number of tags

**Response:**
```json
{
  "success": true,
  "data": [
    { "name": "education", "slug": "education", "count": 5 },
    { "name": "finance", "slug": "finance", "count": 8 }
  ]
}
```

---

### 15. Search by Tag
**GET** `/blogs/search-by-tag`

**Query Parameters:**
- `tag` (required) - Tag name (with or without #)
- `limit` (optional, default: 10)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "success": true,
  "data": [ /* blogs with this tag */ ],
  "count": 3,
  "pagination": { ... }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/blogs/search-by-tag?tag=education&limit=10"
# Or with #
curl -X GET "http://localhost:3000/blogs/search-by-tag?tag=%23education"
```

---

### 16. Get Popular Blogs
**GET** `/blogs/popular`

**Query Parameters:**
- `limit` (optional, default: 10)

**Response:**
```json
{
  "success": true,
  "data": [ /* blogs sorted by views */ ]
}
```

---

### 17. Get Related Blogs
**GET** `/blogs/related`

**Query Parameters:**
- `category` (required) - Category name
- `excludeSlug` (required) - Slug to exclude (current blog)
- `limit` (optional, default: 3)

**Response:**
```json
{
  "success": true,
  "data": [ /* related blogs */ ]
}
```

---

### 18. Add Comment to Blog
**POST** `/blogs/:id/comments`

**URL Parameters:**
- `id` - Blog ID

**Request Body:**
```json
{
  "author": "John Doe",
  "content": "Great article!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": { /* comment */ }
}
```

---

### 19. Get Blog Comments
**GET** `/blogs/:id/comments`

**URL Parameters:**
- `id` - Blog ID

**Query Parameters:**
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "success": true,
  "data": [ /* comments */ ],
  "pagination": { ... }
}
```

---

## 📋 Complete API Summary

### Admin Only (Requires Admin Token):
1. `GET /blogs/admin/stats` - Statistics
2. `GET /blogs/admin/all` - All blogs (including drafts)
3. `POST /blogs` - Create blog
4. `PUT /blogs/:id` - Update blog
5. `DELETE /blogs/:id` - Delete blog
6. `POST /blogs/admin/bulk-delete` - Bulk delete
7. `POST /blogs/admin/bulk-status` - Bulk publish/unpublish

### Public (No Auth):
8. `GET /blogs` - Get published blogs
9. `GET /blogs/featured` - Get featured blog
10. `GET /blogs/slug/:slug` - Get blog by slug
11. `GET /blogs/:id` - Get blog by ID
12. `GET /blogs/categories` - Get categories
13. `GET /blogs/search` - Search blogs
14. `GET /blogs/tags` - Get all tags
15. `GET /blogs/search-by-tag` - Search by tag
16. `GET /blogs/popular` - Get popular blogs
17. `GET /blogs/related` - Get related blogs
18. `POST /blogs/:id/comments` - Add comment
19. `GET /blogs/:id/comments` - Get comments

---

## 🔐 Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "No authorization token provided"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Blog not found"
}
```

---

**All APIs are LIVE and ready to use!** ✅
