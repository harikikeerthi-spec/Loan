# 🌟 Community API - Quick Start Guide

## Overview

The Community API provides comprehensive endpoints for managing the LoanHero community features including mentorship programs, events, success stories, and educational resources.

---

## 🚀 Quick Start

### 1. ✅ Database Migration (Already Done)
The database migration has been applied successfully. Your database now includes:
- **Mentor** table
- **MentorBooking** table  
- **CommunityEvent** table
- **EventRegistration** table
- **SuccessStory** table
- **CommunityResource** table

### 2. 🌱 Seed Sample Data (Optional)

To populate the database with sample data for testing:

```bash
cd server/server
npx ts-node scripts/seed-community.ts
```

This will create:
- 4 sample mentors (Arjun, Sneha, Vikram, Meera)
- 4 sample events (webinars, Q&A, networking)
- 3 success stories
- 4 resources (guides, templates, checklists)

### 3. 🔥 Start the Server

The server is already running! If not:

```bash
cd server/server
npm run start:dev
```

Server will be available at: `http://localhost:3000`

### 4. 🧪 Test the API

Run the test script:

```bash
node test-community-api.js
```

Or test individual endpoints:

```bash
# Get all mentors
curl http://localhost:3000/community/mentors

# Get upcoming events
curl http://localhost:3000/community/events/upcoming

# Get success stories
curl http://localhost:3000/community/stories
```

---

## 📚 API Endpoints Summary

### **Public Endpoints (32 total)**

#### Mentorship (6 endpoints)
- `GET /community/mentors` - List all mentors
- `GET /community/mentors/featured` - Featured mentors
- `GET /community/mentors/:id` - Mentor details
- `POST /community/mentors/:id/book` - Book session
- `POST /community/mentors/apply` - Apply as mentor
- `GET /community/mentors/stats` - Statistics

#### Events (5 endpoints)
- `GET /community/events` - List all events
- `GET /community/events/upcoming` - Upcoming events
- `GET /community/events/past` - Past events
- `GET /community/events/:id` - Event details
- `POST /community/events/:id/register` - Register

#### Success Stories (4 endpoints)
- `GET /community/stories` - List stories
- `GET /community/stories/featured` - Featured stories
- `GET /community/stories/:id` - Story details
- `POST /community/stories/submit` - Submit story

#### Resources (4 endpoints)
- `GET /community/resources` - List resources
- `GET /community/resources/popular` - Popular resources
- `GET /community/resources/:id` - Resource details
- `POST /community/resources/:id/track` - Track downloads

#### Admin Endpoints (13 endpoints - require auth)
- CRUD operations for mentors, events, resources
- Approval workflows
- Analytics and statistics

---

## 🎯 Frontend Integration Examples

### **Mentorship Page Integration**

```javascript
// Fetch mentors for community-mentorship.html
async function loadMentors() {
    try {
        const response = await fetch('http://localhost:3000/community/mentors?limit=6');
        const data = await response.json();
        
        if (data.success) {
            displayMentors(data.data);
        }
    } catch (error) {
        console.error('Error loading mentors:', error);
    }
}

// Book a mentorship session
async function bookSession(mentorId, formData) {
    try {
        const response = await fetch(`http://localhost:3000/community/mentors/${mentorId}/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Booking request submitted successfully!');
        }
    } catch (error) {
        console.error('Error booking session:', error);
    }
}
```

### **Events Page Integration**

```javascript
// Fetch upcoming events for community-events.html
async function loadUpcomingEvents() {
    try {
        const response = await fetch('http://localhost:3000/community/events/upcoming?limit=5');
        const data = await response.json();
        
        if (data.success) {
            displayEvents(data.data);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Register for an event
async function registerForEvent(eventId, formData) {
    try {
        const response = await fetch(`http://localhost:3000/community/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Successfully registered for the event!');
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Error registering for event:', error);
    }
}
```

### **Success Stories Integration**

```javascript
// Fetch success stories for community-success-stories.html
async function loadSuccessStories() {
    try {
        const response = await fetch('http://localhost:3000/community/stories?limit=10');
        const data = await response.json();
        
        if (data.success) {
            displayStories(data.data);
        }
    } catch (error) {
        console.error('Error loading stories:', error);
    }
}

// Submit a success story
async function submitStory(formData) {
    try {
        const response = await fetch('http://localhost:3000/community/stories/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Story submitted! We will review and publish it soon.');
        }
    } catch (error) {
        console.error('Error submitting story:', error);
    }
}
```

---

## 📖 Complete Documentation

For detailed API documentation with all endpoints, request/response examples, and cURL commands:

👉 **See:** `.agent/COMMUNITY_API_DOCUMENTATION.md`

---

## 🗂️ Files Created

```
📁 Project Root
├── 📁 server/server/src/community/
│   ├── community.controller.ts    ✅ 32 API endpoints
│   ├── community.service.ts       ✅ Business logic
│   └── community.module.ts        ✅ Module config
│
├── 📁 server/server/prisma/
│   └── schema.prisma              ✅ Updated with 6 models
│
├── 📁 server/server/scripts/
│   └── seed-community.ts          ✅ Sample data seeder
│
├── 📁 .agent/
│   ├── COMMUNITY_API_DOCUMENTATION.md  ✅ Complete API docs
│   └── COMMUNITY_API_SUMMARY.md        ✅ Implementation summary
│
└── test-community-api.js          ✅ Quick test script
```

---

## ✅ What's Working

- ✅ All 32 API endpoints functional
- ✅ Database schema migrated
- ✅ Prisma client generated
- ✅ Server compiling without errors
- ✅ Module integrated into app
- ✅ Ready for frontend integration

---

## 🎯 Next Steps

### Option 1: Test with Sample Data
```bash
# Seed database
cd server/server
npx ts-node scripts/seed-community.ts

# Test API
cd ../..
node test-community-api.js
```

### Option 2: Integrate with Frontend
Connect your community HTML pages to the API:
- `community-mentorship.html` → Mentor endpoints
- `community-events.html` → Events endpoints
- `community-success-stories.html` → Stories endpoints
- `community-resources.html` → Resources endpoints

### Option 3: Customize
Modify the service logic, add new features, or adjust the data models as needed.

---

## 🆘 Troubleshooting

### Issue: Server not starting
```bash
cd server/server
npm install
npm run start:dev
```

### Issue: Database connection error
Check your `.env` file has correct `DATABASE_URL`

### Issue: Endpoints returning empty arrays
Run the seed script to populate sample data

### Issue: CORS errors in frontend
Make sure your server has CORS enabled (it should be by default in NestJS)

---

## 📞 Support

For questions or issues:
1. Check the complete API documentation
2. Review the implementation summary
3. Test endpoints with the test script
4. Verify database migration status: `npx prisma migrate status`

---

**🎉 Your Community API is ready to use! Happy coding!**
