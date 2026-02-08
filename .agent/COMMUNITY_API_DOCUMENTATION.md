# Community API Documentation

This document describes all the Community API endpoints for the LoanHero platform.

## Base URL
```
http://localhost:3000/community
```

---

## 📚 Table of Contents
1. [Mentorship Endpoints](#mentorship-endpoints)
2. [Events Endpoints](#events-endpoints)
3. [Success Stories Endpoints](#success-stories-endpoints)
4. [Resources Endpoints](#resources-endpoints)
5. [Admin Endpoints](#admin-endpoints)

---

## Mentorship Endpoints

### 1. Get All Mentors
**GET** `/community/mentors`

Get a paginated list of active mentors with optional filters.

**Query Parameters:**
- `university` (optional) - Filter by university
- `country` (optional) - Filter by country
- `loanType` (optional) - Filter by loan type
- `category` (optional) - Filter by category (MBA, Engineering, etc.)
- `limit` (optional, default: 10) - Number of results
- `offset` (optional, default: 0) - Pagination offset

**Example Request:**
```bash
curl -X GET "http://localhost:3000/community/mentors?country=USA&limit=5"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Arjun Patel",
      "university": "Harvard Business School",
      "degree": "MBA",
      "country": "USA",
      "loanBank": "HDFC",
      "loanAmount": "₹75L",
      "bio": "Successfully secured loan...",
      "rating": 4.9,
      "studentsMentored": 47,
      "expertise": ["Non-Collateral", "MBA", "USA"],
      "image": "avatar_url",
      "isActive": true
    }
  ],
  "pagination": {
    "total": 250,
    "limit": 5,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 2. Get Featured Mentors
**GET** `/community/mentors/featured`

Get top-rated mentors.

**Query Parameters:**
- `limit` (optional, default: 6)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/community/mentors/featured?limit=3"
```

---

### 3. Get Mentor by ID
**GET** `/community/mentors/:id`

Get detailed information about a specific mentor.

**Example Request:**
```bash
curl -X GET "http://localhost:3000/community/mentors/uuid-here"
```

---

### 4. Book Mentorship Session
**POST** `/community/mentors/:id/book`

Book a mentorship session with a specific mentor.

**Request Body:**
```json
{
  "studentName": "John Doe",
  "studentEmail": "john@example.com",
  "studentPhone": "+91 9876543210",
  "preferredDate": "2026-02-15",
  "preferredTime": "6:00 PM IST",
  "message": "I need guidance on HDFC loan application..."
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/community/mentors/uuid-here/book" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "John Doe",
    "studentEmail": "john@example.com",
    "preferredDate": "2026-02-15",
    "preferredTime": "6:00 PM IST",
    "message": "Need guidance on loan application"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Booking request submitted successfully",
  "data": {
    "id": "booking-uuid",
    "mentorId": "mentor-uuid",
    "studentName": "John Doe",
    "studentEmail": "john@example.com",
    "preferredDate": "2026-02-15",
    "preferredTime": "6:00 PM IST",
    "status": "pending",
    "createdAt": "2026-02-07T13:00:00Z"
  }
}
```

---

### 5. Apply as Mentor
**POST** `/community/mentors/apply`

Submit an application to become a mentor.

**Request Body:**
```json
{
  "name": "Sneha Iyer",
  "email": "sneha@example.com",
  "phone": "+91 9876543210",
  "university": "Stanford University",
  "degree": "MS Computer Science",
  "country": "USA",
  "loanBank": "SBI",
  "loanAmount": "₹40L",
  "bio": "I successfully secured an education loan...",
  "expertise": ["Computer Science", "Top Universities", "SBI Loans"],
  "linkedIn": "https://linkedin.com/in/sneha"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Mentor application submitted successfully. We will review and get back to you soon.",
  "data": {
    "id": "uuid",
    "name": "Sneha Iyer",
    "isApproved": false,
    "isActive": false
  }
}
```

---

### 6. Get Mentor Statistics
**GET** `/community/mentors/stats`

Get overall mentor statistics.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalMentors": 250,
    "activeMentors": 235,
    "averageRating": 4.8,
    "totalStudentsMentored": 3500
  }
}
```

---

## Events Endpoints

### 1. Get All Events
**GET** `/community/events`

Get all community events with filters.

**Query Parameters:**
- `type` (optional) - webinar, qa, networking, workshop
- `featured` (optional) - true/false
- `limit` (optional, default: 10)
- `offset` (optional, default: 0)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/community/events?type=webinar&limit=5"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "How to Get SBI Education Loan Approved in 15 Days",
      "description": "Join Rajesh Kumar, former SBI loan officer...",
      "type": "webinar",
      "date": "2026-02-05",
      "time": "6:00 PM - 7:30 PM IST",
      "duration": 90,
      "speaker": "Rajesh Kumar",
      "speakerTitle": "Ex-SBI",
      "attendeesCount": 420,
      "maxAttendees": 500,
      "isFree": true,
      "isFeatured": true
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 5,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 2. Get Upcoming Events
**GET** `/community/events/upcoming`

Get upcoming events only.

**Query Parameters:**
- `limit` (optional, default: 5)

---

### 3. Get Past Events
**GET** `/community/events/past`

Get past events with recordings.

**Query Parameters:**
- `limit` (optional, default: 10)
- `offset` (optional, default: 0)

---

### 4. Get Event by ID
**GET** `/community/events/:id`

Get detailed event information including registration count.

---

### 5. Register for Event
**POST** `/community/events/:id/register`

Register for an event.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/community/events/uuid-here/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Successfully registered for the event",
  "data": {
    "id": "registration-uuid",
    "eventId": "event-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-02-07T13:00:00Z"
  }
}
```

---

## Success Stories Endpoints

### 1. Get All Success Stories
**GET** `/community/stories`

Get all approved success stories with filters.

**Query Parameters:**
- `country` (optional) - Filter by country
- `category` (optional) - Filter by category
- `limit` (optional, default: 10)
- `offset` (optional, default: 0)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/community/stories?country=USA&limit=6"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Rahul Verma",
      "university": "University of Oxford",
      "country": "UK",
      "degree": "Master of Public Policy",
      "loanAmount": "₹40,00,000",
      "bank": "HDFC Bank",
      "interestRate": "7.5%",
      "story": "My journey to securing an education loan was challenging...",
      "tips": "Start the process early, prepare all documents...",
      "image": "avatar_url",
      "isApproved": true,
      "isFeatured": false
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 6,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 2. Get Featured Stories
**GET** `/community/stories/featured`

Get featured success stories.

**Query Parameters:**
- `limit` (optional, default: 6)

---

### 3. Get Story by ID
**GET** `/community/stories/:id`

Get a specific success story.

---

### 4. Submit Success Story
**POST** `/community/stories/submit`

Submit a new success story.

**Request Body:**
```json
{
  "name": "Rahul Verma",
  "email": "rahul@example.com",
  "university": "Oxford University",
  "country": "UK",
  "degree": "Master of Public Policy",
  "loanAmount": "₹40L",
  "bank": "HDFC Bank",
  "interestRate": "7.5%",
  "story": "My journey to securing an education loan...",
  "tips": "Start early, prepare documents...",
  "image": "optional_image_url"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Success story submitted successfully. We will review and publish it soon.",
  "data": {
    "id": "uuid",
    "name": "Rahul Verma",
    "isApproved": false
  }
}
```

---

## Resources Endpoints

### 1. Get All Resources
**GET** `/community/resources`

Get all community resources.

**Query Parameters:**
- `type` (optional) - guide, template, checklist, video
- `category` (optional) - Filter by category
- `limit` (optional, default: 10)
- `offset` (optional, default: 0)

---

### 2. Get Popular Resources
**GET** `/community/resources/popular`

Get most downloaded resources.

**Query Parameters:**
- `limit` (optional, default: 5)

---

### 3. Get Resource by ID
**GET** `/community/resources/:id`

Get a specific resource.

---

### 4. Track Resource View/Download
**POST** `/community/resources/:id/track`

Increment download counter for analytics.

---

## Admin Endpoints

All admin endpoints require authentication with admin role.

### 1. Create Mentor (Admin)
**POST** `/community/admin/mentors`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Vikram Shah",
  "email": "vikram@example.com",
  "university": "Cambridge",
  "degree": "Engineering",
  "country": "UK",
  "loanBank": "ICICI",
  "loanAmount": "₹55L",
  "interestRate": "8.2%",
  "bio": "Engineering graduate...",
  "expertise": ["UK", "Engineering", "ICICI"],
  "rating": 4.8,
  "studentsMentored": 42,
  "isActive": true
}
```

---

### 2. Update Mentor (Admin)
**PUT** `/community/admin/mentors/:id`

Update mentor details.

---

### 3. Delete Mentor (Admin)
**DELETE** `/community/admin/mentors/:id`

Delete a mentor.

---

### 4. Create Event (Admin)
**POST** `/community/admin/events`

Create a new community event.

**Request Body:**
```json
{
  "title": "Student Visa + Education Loan Guide",
  "description": "Complete guide to coordinating...",
  "type": "webinar",
  "date": "2026-02-08",
  "time": "5:30 PM - 7:00 PM IST",
  "duration": 90,
  "speaker": "Immigration Expert",
  "speakerTitle": "Senior Consultant",
  "maxAttendees": 500,
  "isFree": true,
  "isFeatured": false
}
```

---

### 5. Update Event (Admin)
**PUT** `/community/admin/events/:id`

Update event details.

---

### 6. Delete Event (Admin)
**DELETE** `/community/admin/events/:id`

Delete an event.

---

### 7. Create Resource (Admin)
**POST** `/community/admin/resources`

Create a new community resource.

---

### 8. Update Resource (Admin)
**PUT** `/community/admin/resources/:id`

Update resource details.

---

### 9. Delete Resource (Admin)
**DELETE** `/community/admin/resources/:id`

Delete a resource.

---

### 10. Approve/Reject Mentor Application (Admin)
**PUT** `/community/admin/mentors/:id/approve`

**Request Body:**
```json
{
  "approved": true,
  "reason": "Optional rejection reason"
}
```

---

### 11. Approve/Reject Success Story (Admin)
**PUT** `/community/admin/stories/:id/approve`

**Request Body:**
```json
{
  "approved": true,
  "reason": "Optional rejection reason"
}
```

---

### 12. Get All Bookings (Admin)
**GET** `/community/admin/bookings`

Get all mentor booking requests.

**Query Parameters:**
- `status` (optional) - pending, confirmed, cancelled, completed
- `mentorId` (optional) - Filter by mentor
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)

---

### 13. Get All Event Registrations (Admin)
**GET** `/community/admin/registrations`

Get all event registrations.

**Query Parameters:**
- `eventId` (optional) - Filter by event
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

---

### 14. Get Community Statistics (Admin)
**GET** `/community/admin/stats`

Get overall community statistics.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "mentors": 250,
    "events": 45,
    "stories": 150,
    "resources": 35,
    "bookings": 820,
    "registrations": 5400
  }
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400
}
```

**Common Error Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Database Migration

After creating the API, run the following commands to apply the database changes:

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_community_models

# Or for production
npx prisma migrate deploy
```

---

## Testing the API

You can test the API using the provided cURL examples or tools like Postman, Insomnia, or Thunder Client.

**Example: Get all mentors**
```bash
curl -X GET "http://localhost:3000/community/mentors?limit=5"
```

**Example: Register for an event**
```bash
curl -X POST "http://localhost:3000/community/events/EVENT_ID/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```
