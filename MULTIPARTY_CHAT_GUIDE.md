# Multi-Party Chat Implementation Guide

## Overview

The multi-party chat system enables centralized communication between customers, staff, bank members, and administrators for loan applications. All participants can see shared documents, send email notifications, and maintain real-time conversation updates.

---

## System Architecture

### Components Created

1. **Backend Services**
   - `MultiPartyChatService` - Core multi-party chat logic
   - `EmailService` - HTML email notifications with Nodemailer
   - `MultiPartyChatController` - REST API endpoints

2. **Database Tables** (via SQL migration)
   - `Conversation_Participant` - Tracks all conversation participants
   - `Document_Share` - Centralized document tracking
   - `Message_Recipient` - Per-recipient message status
   - `Email_Log` - Email audit trail

3. **Frontend Component**
   - `MultiPartyChatInterface` - React component for multi-party chat UI

4. **Module Configuration**
   - Updated `ChatModule` with new services and controllers

---

## Database Schema

### Conversation_Participant Table
```sql
- id: UUID (PK)
- conversationId: UUID (FK to Conversation)
- email: VARCHAR (user's email)
- fullName: VARCHAR (display name)
- role: VARCHAR ('customer', 'staff', 'bank', 'admin')
- joinedAt: TIMESTAMP
- canShare: BOOLEAN (can upload documents)
- isActive: BOOLEAN (soft delete)
```

### Document_Share Table
```sql
- id: UUID (PK)
- conversationId: UUID (FK)
- applicationId: UUID (FK to LoanApplication)
- documentId: VARCHAR (unique identifier)
- documentName: VARCHAR
- documentType: VARCHAR ('pdf', 'image', 'document')
- uploadedBy: VARCHAR (email of uploader)
- uploaderRole: VARCHAR (role of uploader)
- sharedWith: TEXT[] (array of recipient emails)
- sharedWithRoles: TEXT[] (array of roles)
- status: VARCHAR ('active', 'rejected', 'approved')
- reviewNotes: TEXT (optional notes)
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

### Message_Recipient Table
```sql
- id: UUID (PK)
- messageId: UUID (FK to Message)
- recipientEmail: VARCHAR
- recipientRole: VARCHAR
- status: VARCHAR ('sent', 'delivered', 'read')
- readAt: TIMESTAMP (optional)
```

### Email_Log Table
```sql
- id: UUID (PK)
- recipientEmail: VARCHAR
- subject: VARCHAR
- documentShareId: UUID (optional FK)
- status: VARCHAR ('pending', 'sent', 'failed')
- failureReason: TEXT (optional)
- sentAt: TIMESTAMP
```

---

## API Endpoints

### Create Multi-Party Conversation
**POST** `/chat/multiparty/create`

Request body:
```json
{
  "applicationId": "app-uuid",
  "topic": "Loan Application Review",
  "customers": [
    { "email": "customer@example.com", "fullName": "John Doe" }
  ],
  "staffMembers": [
    { "email": "staff@bank.com", "fullName": "Jane Smith" }
  ],
  "bankMembers": [
    { "email": "banker@bank.com", "fullName": "Bob Johnson" }
  ]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "conv-uuid",
    "applicationId": "app-uuid",
    "isMultiParty": true,
    "conversationTopic": "Loan Application Review",
    "status": "active"
  }
}
```

### Get User Conversations
**GET** `/chat/conversations/my`

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "conv-uuid",
      "applicationId": "app-uuid",
      "conversationTopic": "Loan Application Review",
      "isMultiParty": true,
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Conversation Details
**GET** `/chat/multiparty/:conversationId/details`

Returns messages, documents, and participants for a conversation.

### Send Message
**POST** `/chat/multiparty/:conversationId/message`

Request body:
```json
{
  "content": "Message content here",
  "recipientEmails": ["user1@example.com", "user2@example.com"]
}
```

### Share Document
**POST** `/chat/multiparty/:conversationId/share-document`

Request body:
```json
{
  "applicationId": "app-uuid",
  "documentId": "doc-123",
  "documentName": "Loan Application.pdf",
  "documentType": "pdf"
}
```

When a document is shared:
- A system message is created in the conversation
- All participants receive email notifications
- Document is visible in the centralized document panel
- Email notifications include document details

### Get Shared Documents
**GET** `/chat/multiparty/:conversationId/documents`

### Add Participant
**POST** `/chat/multiparty/:conversationId/participant`

Request body:
```json
{
  "email": "newuser@example.com",
  "fullName": "New User",
  "role": "staff"
}
```

### Send Email Notification
**POST** `/chat/multiparty/:conversationId/notify-email`

Request body:
```json
{
  "recipientEmail": "user@example.com",
  "messageContent": "This is the message to include in email",
  "conversationTopic": "Application Update",
  "applicationNumber": "app-123",
  "bank": "SunBank"
}
```

---

## Frontend Usage

### Import Component
```typescript
import MultiPartyChatInterface from '@/components/Chat/MultiPartyChatInterface';
```

### Basic Implementation
```tsx
export default function LoanApplicationPage() {
  const applicationId = "your-app-id";

  return (
    <div>
      <h1>Loan Application</h1>
      <MultiPartyChatInterface applicationId={applicationId} />
    </div>
  );
}
```

### Component Features

1. **Conversation List (Sidebar)**
   - Shows all conversations user participates in
   - Click to select conversation
   - Displays participant count

2. **Message Area**
   - Real-time message display
   - Message sender info
   - Timestamps
   - Different styling for sent/received messages

3. **Participants Panel**
   - View all conversation participants
   - Shows name, email, and role
   - Identify who can share documents

4. **Documents Panel**
   - View all shared documents
   - See who uploaded each document
   - Track document status

5. **Email Notification Feature**
   - Select specific recipient
   - Set email subject
   - Send notification with current message
   - Automatic logging

### Real-Time Updates

The component uses Socket.IO for real-time updates:
- New messages instantly appear
- Participant joins trigger notifications
- Document shares broadcast to all connected clients
- Email logs are recorded

---

## Email Notifications

### Features

1. **Chat Notification Emails**
   - HTML formatted with branding
   - Message preview included
   - Sender name and role displayed
   - Application reference number
   - Professional design

2. **Document Share Notification Emails**
   - Document name and type
   - Uploader information
   - Status indicator
   - Document download/review link

### Email Template Example

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #6605c7 0%, #5504a6 100%); padding: 30px; color: white; text-align: center;">
    <h1>💬 New Message in Loan Application</h1>
  </div>
  
  <div style="padding: 30px; background: #f5f5f5;">
    <p>Hi {recipient_name},</p>
    
    <div style="background: white; padding: 20px; border-left: 4px solid #6605c7; margin: 20px 0;">
      <p><strong>From:</strong> {sender_name} ({sender_role})</p>
      <p><strong>Subject:</strong> {application_topic}</p>
      <p style="margin-top: 15px;"><strong>Message:</strong></p>
      <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
        {message_preview}
      </p>
    </div>
    
    <button style="background: #6605c7; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer;">
      View in Communication Hub
    </button>
  </div>
</div>
```

### Configuration

Email settings in `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@vidhyaloan.com
```

---

## Workflow Examples

### Example 1: Customer Uploads Document

1. Customer uses document upload in loan application page
2. Document uploaded to storage
3. Customer triggers "Share Document" in chat
4. Backend:
   - Creates Document_Share record
   - Adds system message to conversation
   - Sends email to all participants (staff, bank, admin)
   - Logs email send status
5. Staff/bank/admin:
   - See new document in Documents panel
   - Receive email notification
   - Can download/review immediately
   - All changes sync in real-time

### Example 2: Staff Needs to Update Customer

1. Staff opens multi-party conversation
2. Staff types message in chat
3. Staff clicks "Email" button
4. Staff selects customer from recipients
5. Staff enters email subject
6. Backend sends email notification to customer
7. Email includes:
   - Staff member name and role
   - Message content
   - Application reference
   - Link to view in hub
8. Customer receives email and notification in dashboard

### Example 3: Admin Manages Multiple Participants

1. Admin creates multi-party conversation for application
2. Admin adds customer, 2 staff members, and 2 bank members
3. All participants automatically added and notified
4. Admin can:
   - See all participants and their roles
   - Remove/add participants dynamically
   - Send announcements to all or specific groups
   - Review all shared documents
   - Track email delivery status

---

## Data Flow

### Message Send Flow
```
User sends message → API endpoint → MultiPartyChatService → 
Save to DB → Create recipient records → Emit Socket.IO event → 
Real-time delivery to all connected clients
```

### Document Share Flow
```
User uploads document → Document_Share record created → 
Recipient records created → System message added → 
Email notification sent to all participants → 
Real-time broadcast to all connected clients
```

### Email Notification Flow
```
Email send triggered → EmailService formats HTML → 
Nodemailer SMTP send → Log status to Email_Log table → 
Response to client
```

---

## Integration Steps

### 1. Database Migration
Execute the SQL migration to create new tables:
```sql
-- Run server/scripts/migrate_chat_multiparty.sql
```

### 2. Install Dependencies
Ensure these packages are in `server/package.json`:
- `nodemailer` - Email service
- `@types/nodemailer` - TypeScript types

### 3. Update Backend Module
The `ChatModule` has been updated to include:
- MultiPartyChatService
- EmailService
- MultiPartyChatController
- All necessary imports and exports

### 4. Build Backend
```bash
cd server
npm run build
```

### 5. Add Frontend Component
The `MultiPartyChatInterface` component is ready to use in any page that needs chat.

### 6. Update Application Routes
Add chat to relevant application pages:
```typescript
import MultiPartyChatInterface from '@/components/Chat/MultiPartyChatInterface';

export default function ApplicationDetail({ appId }) {
  return (
    <>
      <ApplicationForm appId={appId} />
      <MultiPartyChatInterface applicationId={appId} />
    </>
  );
}
```

---

## Key Features Summary

✅ **Multi-Party Messaging** - Up to 4 parties (customer, staff, bank, admin)
✅ **Centralized Documents** - All documents visible to all participants
✅ **Email Notifications** - Send chat messages or document notifications via email
✅ **Real-Time Updates** - Socket.IO for instant message delivery
✅ **Participant Management** - Add/remove participants dynamically
✅ **Email Audit Trail** - Track all email sends in Email_Log table
✅ **Read Receipts** - Track who has seen messages (via Message_Recipient)
✅ **Role-Based Access** - Different capabilities based on user role
✅ **Application Linking** - Conversations tied to specific loan applications
✅ **System Messages** - Automatic notifications for participant joins, document shares

---

## Security Considerations

1. **JWT Authentication** - All endpoints protected with JwtAuthGuard
2. **Role-Based Authorization** - Email sending restricted to staff/admin
3. **Email Validation** - Recipients must exist in conversation participants
4. **HTML Escaping** - Email templates escape user content for XSS prevention
5. **Database Constraints** - Foreign keys ensure referential integrity
6. **Read-Only Soft Deletes** - Participants marked inactive, not deleted
7. **Real-Time Validation** - Socket.IO events validated on server

---

## Performance Optimizations

1. **Database Indices** - 10 indices on frequently queried columns
2. **Real-Time Publication** - Supabase realtime includes all new tables
3. **Pagination Ready** - Message queries can be paginated
4. **Batch Operations** - Multiple participants added in loops (can be optimized)
5. **Caching Opportunity** - Conversation metadata could be cached

---

## Future Enhancements

1. Message pagination for large conversations
2. Document preview/versioning
3. Conversation archiving
4. Advanced search across conversations
5. File upload integration with document table
6. Bulk operations (add multiple participants at once)
7. Conversation templates for common workflows
8. Analytics on communication patterns
9. Automated follow-up reminders
10. Document approval workflow with role-based signing

---

## Testing the Implementation

### Test Multi-Party Conversation Creation
```javascript
const response = await fetch('http://localhost:5000/api/chat/multiparty/create', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    applicationId: 'test-app-123',
    topic: 'Test Conversation',
    customers: [{ email: 'customer@test.com', fullName: 'Test Customer' }],
    staffMembers: [{ email: 'staff@test.com', fullName: 'Test Staff' }],
    bankMembers: [{ email: 'bank@test.com', fullName: 'Test Banker' }]
  })
});
```

### Test Document Sharing
```javascript
const response = await fetch('http://localhost:5000/api/chat/multiparty/CONV_ID/share-document', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    applicationId: 'test-app-123',
    documentId: 'doc-456',
    documentName: 'Application Form.pdf',
    documentType: 'pdf'
  })
});
```

---

## Troubleshooting

### Documents Not Appearing to All Participants
- Verify all participants are in Conversation_Participant table
- Check Document_Share.sharedWithRoles includes participant's role
- Verify Socket.IO connection is active

### Email Not Sending
- Check .env variables for SMTP credentials
- Verify email provider allows SMTP access
- Check Email_Log table for failure reasons
- Test SMTP connection manually

### Messages Not Appearing in Real-Time
- Verify Socket.IO namespace `/chat` is correct
- Check that token is passed in Socket.IO auth
- Ensure broadcast to room `conv_{conversationId}` is working

### Participant Not Able to Share Documents
- Check canShare flag is true in Conversation_Participant
- Verify user role allows document sharing

---

## Support & Maintenance

For issues or questions:
1. Check Email_Log for email delivery issues
2. Review application logs for backend errors
3. Check database constraints are properly set
4. Verify Supabase real-time is enabled
5. Test Socket.IO connection independently
