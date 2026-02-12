# Community Hub API Reference

The **Community Hub** provides dynamic endpoints for fetching topic-specific content, managing forum discussions, and handling user interactions (likes, comments).

Base URL: `http://localhost:3000`

---

## 1. Explore Hub Data (Aggregated)

Fetch all data for a specific hub topic in a single call. This includes the hub metadata, featured mentor post, top mentors, events, resources, and recent forum discussions.

- **Endpoint**: `GET /community/explore/hub/:topic`
- **Parameters**:
  - `topic`: The topic identifier (e.g., `loan`, `visa`, `universities`, `gre`).
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "hub": {
        "title": "Loan Eligibility & Finance",
        "badge": "ELIGIBILITY",
        "description": "Navigate the complexities of loan approvals...",
        "stats": {
          "activeMentors": 12,
          "discussions": 45,
          "members": 150
        }
      },
      "featuredMentorPost": { ... },
      "mentors": [ ... ],
      "events": [ ... ],
      "resources": [ ... ],
      "forumPosts": [ ... ]
    }
  }
  ```

---

## 2. Forum Discussions

### Get Forum Posts
Fetch a list of discussions filtered by category or tag.

- **Endpoint**: `GET /community/forum`
- **Query Parameters**:
  - `category`: Filter by topic (e.g., `loan`, `visa`).
  - `tag`: Filter by specific tag.
  - `limit`: Number of posts to return (default: 10).
  - `offset`: Pagination offset (default: 0).
  - `sort`: `latest` (default) or `popular`.
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "post_123",
        "title": "Best banks for loans?",
        "content": "...",
        "author": { "firstName": "John", "role": "user" },
        "likes": 5,
        "commentCount": 2,
        "createdAt": "2023-10-27T10:00:00Z"
      }
    ]
  }
  ```

### Create a Post
Start a new discussion. Requires authentication.

- **Endpoint**: `POST /community/forum`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Discussion Title",
    "content": "What are the best options for...",
    "category": "loan",
    "tags": ["finance", "help"]
  }
  ```

### Get Single Post & Comments
Fetch a specific post along with its comments.

- **Endpoint**: `GET /community/forum/:id`
- **Parameters**: `id` (Post ID)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "post_123",
      "title": "...",
      "content": "...",
      "comments": [
        {
          "id": "comment_456",
          "content": "Try SBI or HDFC.",
          "author": { "firstName": "Mentor", "role": "mentor" },
          "createdAt": "..."
        }
      ]
    }
  }
  ```

---

## 3. Interactions (Likes & Comments)

### Add a Comment / Reply
Reply to a discussion or another comment. Requires authentication.

- **Endpoint**: `POST /community/forum/:id/comment`
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `id` (Post ID)
- **Body**:
  ```json
  {
    "content": "This is very helpful, thanks!",
    "parentId": "optional_comment_id_for_nested_reply"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Comment added successfully",
    "data": { ...comment }
  }
  ```

### Like a Comment
Like a specific comment. Requires authentication.

- **Endpoint**: `POST /community/forum/comments/:id/like`
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `id` (Comment ID)
- **Response**:
  ```json
  {
    "success": true,
    "likes": 5
  }
  ```

### Like a Post
Like a discussion. Requires authentication.

- **Endpoint**: `POST /community/forum/:id/like`
- **Headers**: `Authorization: Bearer <token>`
- **Parameters**: `id` (Post ID)
- **Response**:
  ```json
  {
    "success": true,
    "likes": 6
  }
  ```

---

## 4. Sidebar Widgets (Individual APIs)

Detailed endpoints used if you need to fetch specific lists independently.

### Get Top Mentors
- **Endpoint**: `GET /community/mentors`
- **Query**: `category=loan&limit=3`

### Get Upcoming Events
- **Endpoint**: `GET /community/events`
- **Query**: `category=loan&limit=3`

### Get Helpful Resources
- **Endpoint**: `GET /community/resources`
- **Query**: `category=loan&limit=3`
