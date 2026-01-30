# Admin Blog Management API Documentation

## Overview
This API provides comprehensive blog management capabilities for administrators. All admin endpoints require authentication with an admin role.

---

## Authentication

### Admin Access
All admin endpoints require:
1. Valid JWT token in the Authorization header
2. User account with `role = "admin"`

**Authorization Header Format:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### Error Responses
- **401 Unauthorized**: No token or invalid token
- **403 Forbidden**: Valid token but user is not an admin

---

## API Endpoints

### 1. Get All Blogs (Including Unpublished) 📚
**GET** `/blogs/admin/all`

**Description:** Retrieve all blogs (both published and unpublished) for admin management.

**Query Parameters:**
- `limit` (optional, default: 50) - Number of blogs to return
- `offset` (optional, default: 0) - Number of blogs to skip

**Example Request:**
```bash
curl -X GET "http://localhost:3000/blogs/admin/all?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Blog Title",
      "slug": "blog-title",
      "excerpt": "Short description",
      "category": "Technology",
      "authorName": "John Doe",
      "featuredImage": "image-url",
      "readTime": 5,
      "views": 1250,
      "isFeatured": true,
      "isPublished": false,
      "publishedAt": null,
      "createdAt": "2026-01-30T...",
      "updatedAt": "2026-01-30T...",
      "tags": ["technology", "innovation"]
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 2. Get Blog Statistics 📊
**GET** `/blogs/admin/stats`

**Description:** Get comprehensive blog statistics for admin dashboard.

**Example Request:**
```bash
curl -X GET "http://localhost:3000/blogs/admin/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "published": 120,
    "draft": 30,
    "featured": 5,
    "totalViews": 45620
  }
}
```

---

### 3. Create Blog Post ✍️
**POST** `/blogs`

**Description:** Create a new blog post.

**Request Body:**
```json
{
  "title": "Understanding TypeScript Generics",
  "slug": "understanding-typescript-generics",
  "excerpt": "Learn how to use TypeScript generics effectively",
  "content": "<h2>Introduction</h2><p>...</p>",
  "category": "Programming",
  "authorName": "Jane Smith",
  "authorImage": "https://example.com/avatar.jpg",
  "authorRole": "Senior Developer",
  "featuredImage": "https://example.com/featured.jpg",
  "readTime": 8,
  "isFeatured": false,
  "isPublished": true,
  "tags": ["typescript", "programming", "generics"]
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/blogs" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Understanding TypeScript Generics",
    "slug": "understanding-typescript-generics",
    "excerpt": "Learn how to use TypeScript generics effectively",
    "content": "<h2>Introduction</h2><p>Content here...</p>",
    "category": "Programming",
    "authorName": "Jane Smith",
    "readTime": 8,
    "isPublished": true,
    "tags": ["typescript", "programming"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Blog created successfully",
  "data": {
    "id": "new-blog-uuid",
    "title": "Understanding TypeScript Generics",
    ...
  }
}
```

---

### 4. Update Blog Post ✏️
**PUT** `/blogs/:id`

**Description:** Update an existing blog post.

**URL Parameters:**
- `id` - Blog ID (UUID)

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "isPublished": true,
  "isFeatured": true,
  "tags": ["updated", "tags"]
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/blogs/abc-123-def" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Blog Title",
    "isPublished": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Blog updated successfully",
  "data": {
    "id": "abc-123-def",
    "title": "Updated Blog Title",
    ...
  }
}
```

---

### 5. Delete Blog Post 🗑️
**DELETE** `/blogs/:id`

**Description:** Permanently delete a blog post.

**URL Parameters:**
- `id` - Blog ID (UUID)

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/blogs/abc-123-def" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Blog deleted successfully"
}
```

---

### 6. Bulk Delete Blogs 🗑️🗑️🗑️
**POST** `/blogs/admin/bulk-delete`

**Description:** Delete multiple blogs at once.

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

**Example Request:**
```bash
curl -X POST "http://localhost:3000/blogs/admin/bulk-delete" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blogIds": ["uuid-1", "uuid-2", "uuid-3"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "3 blog(s) deleted successfully",
  "deleted": 3
}
```

---

### 7. Bulk Update Blog Status 📝
**POST** `/blogs/admin/bulk-status`

**Description:** Publish or unpublish multiple blogs at once.

**Request Body:**
```json
{
  "blogIds": ["uuid-1", "uuid-2"],
  "isPublished": true
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/blogs/admin/bulk-status" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blogIds": ["uuid-1", "uuid-2"],
    "isPublished": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "2 blog(s) published successfully",
  "updated": 2
}
```

---

## Setting Up Admin Access

### Step 1: Create Admin User
To create an admin user, you need to update a user's role in the database.

**Using Prisma Studio:**
```bash
cd server/server
npx prisma studio
```
Then:
1. Navigate to the `User` table
2. Find the user you want to make admin
3. Set `role` field to `"admin"`
4. Save changes

**Using SQL:**
```sql
UPDATE "User" 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

**Using Prisma Client:**
```typescript
// Add this temporary endpoint in auth.controller.ts
@Post('make-admin')
async makeAdmin(@Body() body: { email: string }) {
  await this.prisma.user.update({
    where: { email: body.email },
    data: { role: 'admin' }
  });
  return { success: true, message: 'User is now an admin' };
}
```

### Step 2: Login as Admin
1. Login normally through the login endpoint
2. The JWT token will contain your user information
3. Use this token for all admin requests

### Step 3: Test Admin Access
```bash
# Get your admin token after login
TOKEN="your-jwt-token-here"

# Test admin endpoint
curl -X GET "http://localhost:3000/blogs/admin/stats" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Complete Admin Workflow Example

### 1. Create a Draft Blog
```bash
curl -X POST "http://localhost:3000/blogs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Draft Blog Post",
    "slug": "draft-blog-post",
    "excerpt": "This is a draft",
    "content": "<p>Content</p>",
    "category": "News",
    "authorName": "Admin",
    "isPublished": false
  }'
```

### 2. View All Blogs (Including Drafts)
```bash
curl -X GET "http://localhost:3000/blogs/admin/all" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Update Blog and Publish
```bash
curl -X PUT "http://localhost:3000/blogs/BLOG_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true,
    "isFeatured": true
  }'
```

### 4. Check Statistics
```bash
curl -X GET "http://localhost:3000/blogs/admin/stats" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Bulk Operations
```bash
# Publish multiple blogs
curl -X POST "http://localhost:3000/blogs/admin/bulk-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blogIds": ["id1", "id2", "id3"],
    "isPublished": true
  }'

# Delete multiple blogs
curl -X POST "http://localhost:3000/blogs/admin/bulk-delete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blogIds": ["id1", "id2"]
  }'
```

---

## Error Handling

### Common Errors

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "No authorization token provided"
}
```

**403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "Access denied. Admin privileges required."
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Blog not found"
}
```

**400 Bad Request**
```json
{
  "success": false,
  "message": "No blog IDs provided"
}
```

---

## Security Considerations

1. **JWT Token Expiration**: Tokens should have reasonable expiration times
2. **HTTPS Only**: Admin endpoints should only be accessible via HTTPS in production
3. **Rate Limiting**: Consider implementing rate limiting for admin endpoints
4. **Audit Logging**: Log all admin actions for security auditing
5. **Role Validation**: Always verify admin role on each request

---

## Testing with Postman

### 1. Set Up Environment Variables
```
BASE_URL: http://localhost:3000
ADMIN_TOKEN: <your-jwt-token>
```

### 2. Create Collection
- Import the endpoints listed above
- Set Authorization to "Bearer Token" with `{{ADMIN_TOKEN}}`
- Add Content-Type: application/json to headers

### 3. Test Sequence
1. Login to get token
2. Get blog stats
3. Create a blog
4. Update the blog
5. Delete the blog

---

## JavaScript/TypeScript Client Example

```typescript
class AdminBlogAPI {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAllBlogs(limit = 50, offset = 0) {
    return this.request(`/blogs/admin/all?limit=${limit}&offset=${offset}`);
  }

  async getStatistics() {
    return this.request('/blogs/admin/stats');
  }

  async createBlog(blogData: any) {
    return this.request('/blogs', {
      method: 'POST',
      body:JSON.stringify(blogData),
    });
  }

  async updateBlog(id: string, updates: any) {
    return this.request(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteBlog(id: string) {
    return this.request(`/blogs/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkDelete(blogIds: string[]) {
    return this.request('/blogs/admin/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ blogIds }),
    });
  }

  async bulkUpdateStatus(blogIds: string[], isPublished: boolean) {
    return this.request('/blogs/admin/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ blogIds, isPublished }),
    });
  }
}

// Usage
const api = new AdminBlogAPI('http://localhost:3000', 'YOUR_JWT_TOKEN');

// Get statistics
const stats = await api.getStatistics();
console.log('Blog stats:', stats);

// Create a blog
const newBlog = await api.createBlog({
  title: 'My New Blog',
  slug: 'my-new-blog',
  excerpt: 'This is a new blog',
  content: '<p>Blog content here</p>',
  category: 'Technology',
  authorName: 'Admin User',
  isPublished: true,
  tags: ['tech', 'news']
});

// Publish multiple blogs
await api.bulkUpdateStatus(['id1', 'id2'], true);
```

---

## Summary

### Admin Capabilities:
✅ View all blogs (published & draft)  
✅ Create new blogs  
✅ Update existing blogs  
✅ Delete blogs  
✅ Bulk delete multiple blogs  
✅ Bulk publish/unpublish blogs  
✅ View comprehensive statistics  

### All Protected By:
🔒 JWT Authentication  
🔒 Admin Role Verification  
🔒 Guard-based Authorization  

---

**API Base URL (Development):** `http://localhost:3000`  
**API Base URL (Production):** Update based on deployment  

**Created:** January 30, 2026  
**Version:** 1.0.0  
**Author:** LoanHero Development Team
