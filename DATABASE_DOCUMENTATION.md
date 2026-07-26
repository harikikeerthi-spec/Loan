# Database Schema Documentation & Table Breakdown

**Project**: Sun Glade Loan Application  
**Database System**: PostgreSQL (managed via Prisma ORM)  
**Total Tables / Models**: 53  

---

## 📋 Executive Overview

The database powers an end-to-end Study Abroad Education Loan and Mentorship platform. It supports multi-role access (Students, Admins, Super Admins, Bank Partners, Support Staff, and Agents) and is organized into 10 major operational modules:

1. **User Management & Profiles** (Accounts, Roles, Admin Profiles, Parents)
2. **Loan Applications & Document Management** (Applications, Documents, History, Fees, DigiLocker)
3. **Student Evaluation & AI Simulation Tools** (Eligibility Checks, Visa Mock Interviews)
4. **Referral & Rewards System** (Referrals, Codes, Audit Logs, Visit Analytics)
5. **Content, Blogs & Community Forum** (Blogs, Categories, Tags, Comments, Forum Threads)
6. **Mentorship & Community Platform** (Mentors, Bookings, Events, Success Stories, Resources)
7. **Reference Catalogs & Directory Data** (Banks, Universities, Countries, Loan Types, Scholarships)
8. **Onboarding Pipeline & User Preferences** (Leads, Cohorts, Academic/Financial Profiles)
9. **Campaign & Email Marketing Automation** (Campaigns, Queues, Logs, AI Copy, Automation Rules)
10. **Support Ticket Management System** (Tickets, Comments, SLAs, Teams, Knowledge Base)

---

## 🗂️ Module 1: User Management & Profiles

### 1. `User`
- **Model Name**: `User`
- **Purpose**: Central entity for all registered platform accounts (Students, Admins, Super Admins, Staff, Agents).
- **Data Stored**: 
  - Authentication: Email, Mobile number, Hashed Password, Refresh Tokens.
  - Profile Info: First Name, Last Name, Date of Birth, Gender, Role (`user`, `admin`, `super_admin`).
  - Onboarding Responses: Goal, study destination, target university, budget, loan amount required, GPA, test scores.
  - Tracking: Referral codes, timestamps (`createdAt`, `updatedAt`).

### 2. `AdminProfile`
- **Model Name**: `AdminProfile`
- **Purpose**: Extended administrative metadata and granular permissions for admin users.
- **Data Stored**: 
  - Foreign Key: `userId` (1-to-1 with `User`).
  - Admin Title, Department, Bio, Profile Image URL.
  - Permissions: `canApproveBlogs` (Boolean), `canManageUsers` (Boolean).

### 3. `parents`
- **Model Name**: `Parent`
- **Purpose**: Stores information about applicant parents or co-signers linked to a user account.
- **Data Stored**: 
  - Foreign Key: `userId`.
  - Relation Type: `father`, `mother`, `coapplicant`.
  - Full Name, Aadhar Number, PAN Number.

---

## 💳 Module 2: Loan Applications & Document Management

### 4. `LoanApplication`
- **Model Name**: `LoanApplication`
- **Purpose**: Master record tracking student loan applications across all processing stages.
- **Data Stored**: 
  - Application Details: Unique Application Number, Loan Type (Education, Home, Personal, Business, Vehicle), Selected Bank, Loan Amount, Tenure, Purpose, Progress %.
  - Applicant Info: Full Name, Contact Details, DOB, Gender, Address (City, State, Pincode, Country).
  - Academic Details: University Name, Course Name, Course Duration, Admission Status.
  - Financial & Co-Applicant: Employer Name, Income, Co-Applicant Info (Name, Relation, Phone, Income), Collateral Info (Type, Value).
  - Electronic Verification & Validation (EVV): EVV Score (0-100), EVV Grade (A+, A, B, C, D), Decision (`APPROVE`, `MANUAL_REVIEW`, `REJECT`), Risk Flags JSON, Daily Balances JSON, Monthly Breakdown.
  - Status & Timestamps: Status (`pending`, `submitted`, `approved`, `disbursed`, etc.), Stage, Submitted At, Review Started At.

### 5. `ApplicationDocument`
- **Model Name**: `ApplicationDocument`
- **Purpose**: Tracks file uploads submitted specifically for a loan application.
- **Data Stored**: 
  - Foreign Key: `applicationId`.
  - Document Info: `docType`, `docName`, `fileName`, `filePath`, `fileSize`, `mimeType`.
  - Status: `pending`, `uploaded`, `verified`, `rejected`, `isRequired` flag.
  - Verification Metadata: Verified At, Verified By, DigiLocker Transaction ID, Rejection Reason.

### 6. `ApplicationStatusHistory`
- **Model Name**: `ApplicationStatusHistory`
- **Purpose**: Complete audit trail of stage and status transitions for every application.
- **Data Stored**: 
  - Foreign Key: `applicationId`.
  - State Transitions: `fromStatus`, `toStatus`, `fromStage`, `toStage`.
  - Actor Info: `changedBy`, `changedByName`, `changeReason`, `notes`, `isAutomatic` flag.

### 7. `ApplicationNote`
- **Model Name**: `ApplicationNote`
- **Purpose**: Internal or shared notes attached to an application by platform agents or staff.
- **Data Stored**: 
  - Foreign Key: `applicationId`.
  - Author Info: `authorId`, `authorName`.
  - Note Details: Content text, Note Type, `isInternal` flag.

### 8. `UserDocument`
- **Model Name**: `UserDocument`
- **Purpose**: Master document vault for a user across multiple applications.
- **Data Stored**: 
  - Foreign Key: `userId`.
  - Document Type: `aadhar`, `pan`, `passport`, `10th`, `12th`, `degree`.
  - File details, status (`pending`, `verified`, `available_in_digilocker`), DigiLocker transaction IDs, rejection reasons.

### 9. `ProcessingFee`
- **Model Name**: `ProcessingFee`
- **Purpose**: Tracks loan processing fees and waiver approvals.
- **Data Stored**: 
  - Foreign Key: `applicationId`.
  - Financials: Fee Amount, GST Amount, Total Amount, Payment Mode, Payment Reference.
  - Status & Waiver: Status (`pending`, `paid`, `waived`), `waivedBy`, `waiverReason`, Paid At timestamp.

### 10. `DigilockerConsentRequest`
- **Model Name**: `DigilockerConsentRequest`
- **Purpose**: Manages student consent for retrieving documents via DigiLocker API integrations.
- **Data Stored**: 
  - `userId`, Student Email, Array of requested document types (`documentTypes`), Status (`pending`, `approved`, `expired`).

---

## 🤖 Module 3: Student Evaluation & AI Simulation Tools

### 11. `LoanEligibilityCheck`
- **Model Name**: `LoanEligibilityCheck`
- **Purpose**: Stores results of quick loan eligibility calculator checks.
- **Data Stored**: 
  - Inputs: Age, Credit score, Income, Loan amount, Employment type, Study destination, Co-applicant status, Collateral.
  - Outputs: Score, Status, Rate Range, Coverage %, Recommendations JSON.
  - Linking: Optional `userId` association.

### 12. `VisaMockInterviewResult`
- **Model Name**: `VisaMockInterviewResult`
- **Purpose**: Records performance analytics from AI-powered student visa mock interview simulations.
- **Data Stored**: 
  - Foreign Key: Optional `userId`.
  - Evaluation: Visa type, Overall Score, Risk Level, Approval Likelihood rating.
  - Insights: Section Scores JSON, Strengths array, Weaknesses array, Critical Issues array, DS-160 Inconsistencies array, Tips.
  - Transcripts: Full message history JSON and granular AI evaluation logs JSON.

---

## 🎁 Module 4: Referral & Rewards System

### 13. `referrals`
- **Model Name**: `Referral`
- **Purpose**: Manages referral invitations and completed reward conversions.
- **Data Stored**: 
  - `referrerId` (User sharing code), `refereeId` (User signed up), Referee Email.
  - Status: `pending`, `signed_up`, `completed`.
  - Reward details text, Completed At timestamp.

### 14. `referral_codes`
- **Model Name**: `ReferralCode`
- **Purpose**: Stores unique referral codes generated for users.
- **Data Stored**: 
  - `code` (Unique string), `userId` (1-to-1 mapping).

### 15. `referral_audit_log`
- **Model Name**: `ReferralAuditLog`
- **Purpose**: Tracks manual or automated status adjustments on referrals by administrators.
- **Data Stored**: 
  - `referralId`, Previous Status, New Status, `changedBy` (Admin User ID), Reason text.

### 16. `ReferralVisit`
- **Model Name**: `ReferralVisit`
- **Purpose**: Analytics log for tracking clicks on shared referral links.
- **Data Stored**: 
  - Referral Code, Visitor IP address, User-Agent string, Referrer ID.

---

## 📰 Module 5: Content, Blogs & Community Forum

### 17. `Blog`
- **Model Name**: `Blog`
- **Purpose**: Articles, study abroad guides, and financial planning blogs.
- **Data Stored**: 
  - Content: Title, Slug, Excerpt, Full HTML/Text Content, Category, Featured Image URL.
  - Author: `authorId`, Author Name, Author Image, Author Role.
  - Publishing State: Status (`draft`, `pending`, `published`), Visibility (`private`, `public`), `isPublished` Boolean, Published At timestamp, Rejection Reason.
  - Metrics: Read Time, Views counter, Featured flag.

### 18. `Tag`
- **Model Name**: `Tag`
- **Purpose**: Tag master list for categorization.
- **Data Stored**: Tag Name, Unique Slug.

### 19. `BlogTag`
- **Model Name**: `BlogTag`
- **Purpose**: Junction table linking Blogs to Tags.
- **Data Stored**: `blogId`, `tagId`.

### 20. `Comment`
- **Model Name**: `Comment`
- **Purpose**: Reader comments on blog posts.
- **Data Stored**: 
  - `blogId`, `userId`, Author Name, Comment Text.
  - Threading: `parentId` (for nested replies).
  - Moderation: Status (`pending`, `approved`, `spam`), Likes count.

### 21. `CommentLike`
- **Model Name**: `CommentLike`
- **Purpose**: Prevents duplicate liking of blog comments.
- **Data Stored**: `commentId`, `userId` (User ID or Anonymous IP address).

### 22. `AuditLog`
- **Model Name**: `AuditLog`
- **Purpose**: Tracks administrative and content modification activities.
- **Data Stored**: Action (`create`, `update`, `publish`, `delete`), Entity Type (`blog`, `user`, `comment`), Entity ID, Initiated By User ID, IP address, User Agent, JSON Changes object.

### 23. `ForumPost`
- **Model Name**: `ForumPost`
- **Purpose**: Discussion threads in the student community forum.
- **Data Stored**: Title, Content, Category (loan, visa, universities, GRE, etc.), Tags array, Author ID, Likes count, Views count, Pinned flag, Mentor-only visibility flag.

### 24. `ForumComment`
- **Model Name**: `ForumComment`
- **Purpose**: Threaded comments on community forum posts.
- **Data Stored**: `postId`, Author ID, Content text, Likes count, `parentId` for nested reply chains.

---

## 👥 Module 6: Mentorship & Community Platform

### 25. `Mentor`
- **Model Name**: `Mentor`
- **Purpose**: Profiles of senior international students and alumni mentors.
- **Data Stored**: 
  - Personal: Name, Email, Phone, Bio, LinkedIn URL, Profile Image.
  - Academic & Loan: University, Degree, Country, Category, Loan Bank, Loan Amount, Interest Rate.
  - Status & Stats: Rating score, Students Mentored counter, `isActive`, `isApproved`, Rejection Reason.

### 26. `MentorBooking`
- **Model Name**: `MentorBooking`
- **Purpose**: Requests by students to schedule 1-on-1 sessions with mentors.
- **Data Stored**: 
  - Foreign Key: `mentorId`.
  - Student Details: Name, Email, Phone, Preferred Date, Preferred Time, Message text.
  - Booking Status: `pending`, `confirmed`, `cancelled`, `completed`.

### 27. `CommunityEvent`
- **Model Name**: `CommunityEvent`
- **Purpose**: Group events, webinars, Q&A sessions, and workshops.
- **Data Stored**: Title, Description, Type (`webinar`, `qa`, `networking`, `workshop`), Date, Time, Duration (mins), Speaker Name/Title, Max Attendees, Attendees Count, `isFree` flag, Recording URL, Category.

### 28. `EventRegistration`
- **Model Name**: `EventRegistration`
- **Purpose**: Student registrations for upcoming community webinars/events.
- **Data Stored**: `eventId`, Student Name, Student Email, Student Phone.

### 29. `SuccessStory`
- **Model Name**: `SuccessStory`
- **Purpose**: Real student testimonials and case studies.
- **Data Stored**: Student Name, Email, Target University, Country, Degree, Loan Amount, Bank, Interest Rate, Story text, Tips, Image URL, Approval/Featured flags.

### 30. `CommunityResource`
- **Model Name**: `CommunityResource`
- **Purpose**: Library of downloadable resources (checklists, guides, templates, videos).
- **Data Stored**: Title, Description, Resource Type, Category, File URL, Download URL, Thumbnail URL, Download counter, Featured flag.

---

## 📚 Module 7: Reference Catalogs & Directory Data

### 31. `LoanType`
- **Model Name**: `LoanType`
- **Purpose**: Master catalog of loan types offered.
- **Data Stored**: Name (e.g. Education Loan), Category (Secured/Unsecured), Description, Features array, Eligibility rules, Document list array, Min/Max interest rates, Loan amount limits, Processing time.

### 32. `University`
- **Model Name**: `University`
- **Purpose**: Global database of abroad universities.
- **Data Stored**: University Name, Country, City, State, National Ranking, World Ranking, Type (Public/Private), Popular courses array, Average tuition fees, Acceptance rate, Logo/Image URLs.

### 33. `UniversityInquiry`
- **Model Name**: `UniversityInquiry`
- **Purpose**: Fast-track admission or callback inquiries submitted for specific universities.
- **Data Stored**: User ID (optional), Student Name, Email, Mobile, University Name, Inquiry Type (`callback`, `fasttrack`), Status.

### 34. `Bank`
- **Model Name**: `Bank`
- **Purpose**: Master directory of financial institutions and NBFC partner lenders.
- **Data Stored**: Bank Name, Short Name, Country, Type (Public/Private/NBFC), Loan types offered, Min/Max interest rates, Max loan amount, Collateral limits, Processing fee details, Logo URL.

### 35. `BankPriority`
- **Model Name**: `BankPriority`
- **Purpose**: Display priority configuration for ordering bank listings.
- **Data Stored**: Priority Rank integer, Bank Name, Status (`Active`).

### 36. `Country`
- **Model Name**: `Country`
- **Purpose**: Destination country database for international students.
- **Data Stored**: Country Name, Code (e.g. US, UK), Region, Tuition fees range, Living cost range, Visa type/processing times, Work permit rules, Currency, Flag URL.

### 37. `Scholarship`
- **Model Name**: `Scholarship`
- **Purpose**: Global scholarship directory.
- **Data Stored**: Scholarship Name, Provider, Target Country, Eligible origin countries array, Amount, Type (`Merit-based`, `Need-based`), Eligibility description, Deadline, Website URL, `isActive` flag.

### 38. `Course`
- **Model Name**: `Course`
- **Purpose**: Catalog of academic degree disciplines.
- **Data Stored**: Course Name, Degree Level (`Undergraduate`, `Masters`, `PhD`), Field, Duration, Description, Average tuition fees, Career prospects, Average starting salary.

---

## 🎯 Module 8: Onboarding Pipeline & User Preferences

### 39. `OnboardingApplication`
- **Model Name**: `OnboardingApplication`
- **Purpose**: Lead capture records generated by chatbot onboarding flows.
- **Data Stored**: 
  - Linked User ID, Lead Email, Name, Phone.
  - Requirement details (Goal, Destination, Target University, Intake).
  - Profile details (Degree, GPA, Work Exp, Test scores).
  - Financial readiness (Budget, Pincode, Loan amount needed).
  - Service Tracking: Status (`pending`, `contacted`, `processing`, `closed`), Assigned Agent/Admin, Service Notes.

### 40. `CohortApplication`
- **Model Name**: `CohortApplication`
- **Purpose**: Applications for structured student groups/intake cohorts.
- **Data Stored**: Applicant Name, Email, Phone, Target Intake, Destination, Target University, Gap Year flag, Message, Status (`pending`, `shortlisted`, `accepted`), Reviewed By user.

### 41. `UserStudyPreference`
- **Model Name**: `UserStudyPreference`
- **Purpose**: Sub-profile for user study goals.
- **Data Stored**: Linked `userId`, Goal, Study Destination, Course Name, Target University, Intake Season, Admit Status.

### 42. `UserAcademicProfile`
- **Model Name**: `UserAcademicProfile`
- **Purpose**: Sub-profile for user academic records.
- **Data Stored**: Linked `userId`, Bachelor's Degree, GPA, Work Experience, Entrance Test (GRE/GMAT) & Score, English Test (IELTS/TOEFL) & Score.

### 43. `UserFinancialProfile`
- **Model Name**: `UserFinancialProfile`
- **Purpose**: Sub-profile for user financial specifications.
- **Data Stored**: Linked `userId`, Budget, Pincode, Desired Loan Amount.

---

## 📬 Module 9: Campaign & Email Marketing Automation

### 44. `EmailCampaign` (`Campaign`)
- **Model Name**: `Campaign`
- **Purpose**: Master campaign record for mass email delivery and newsletter workflows.
- **Data Stored**: Campaign Title, Subject, Body Template, Status (`draft`, `queued`, `sending`, `completed`), Scheduled Time, Priority, Tone, Audience segment, Total count, Sent count, Failed count, Open count, Click count.

### 45. `CampaignRecipient`
- **Model Name**: `CampaignRecipient`
- **Purpose**: Individual email target instance within a campaign.
- **Data Stored**: Campaign ID, Recipient Email, Recipient Name, Dynamic JSON variables payload, Status (`pending`, `queued`, `sent`, `failed`, `opened`, `clicked`), Error message, Timestamps.

### 46. `CampaignTemplate`
- **Model Name**: `CampaignTemplate`
- **Purpose**: Reusable campaign email templates.
- **Data Stored**: Template Name, Subject line, Body HTML/Text template, Template type (`newsletter`, `promotion`, etc.), Tone.

### 47. `CampaignQueue`
- **Model Name**: `CampaignQueue`
- **Purpose**: Processing queue for background email generation and dispatching.
- **Data Stored**: Campaign ID, Recipient ID, Status (`pending`, `queued`, `generating`, `sending`, `sent`, `failed`), Attempts counter, Last Error, Scheduled timestamp.

### 48. `EmailQueue`
- **Model Name**: `EmailQueue`
- **Purpose**: Low-level queue for Nodemailer/SMTP dispatch.
- **Data Stored**: Campaign ID, Recipient ID, Target Email, Processing Status, Attempt counter, Last error log, Scheduled timestamp.

### 49. `EmailLogs` / `EmailLog`
- **Model Name**: `EmailLogs` & `EmailLog`
- **Purpose**: Transport level log of sent emails and webhook events.
- **Data Stored**: Queue ID/Campaign ID, Recipient Email, Subject, Status (`sent`, `failed`, `bounced`, `opened`, `clicked`), Provider response string, Error message, Timestamps.

### 50. `CampaignAnalytics`
- **Model Name**: `CampaignAnalytics`
- **Purpose**: Aggregate performance analytics per campaign.
- **Data Stored**: Campaign ID, Total Sent, Total Opened, Total Clicked, Total Bounced, Total Failed, Total Unsubscribed, Total Spam reports, Conversion Rate %.

### 51. `AIEmail`
- **Model Name**: `AIEmail`
- **Purpose**: AI-generated email copy variations and spam score assessments.
- **Data Stored**: Campaign ID, Subject line, Preview text, Body copy, CTA text, Spam Score rating, AI Confidence Score.

### 52. `AutomationRule`
- **Model Name**: `AutomationRule`
- **Purpose**: Rules for event-triggered transactional emails.
- **Data Stored**: Rule Name, Trigger Event (e.g., "Application Submitted", "Loan Approved", "Visa Approved"), Template ID, Priority, Tone, `isActive` flag.

### 53. `CampaignAudience`
- **Model Name**: `CampaignAudience`
- **Purpose**: Saved user filters for campaign segmentation.
- **Data Stored**: Audience Name, Description, Structured filter JSON (Country, University, Loan Status, Intake).

### 54. `CampaignSchedule`
- **Model Name**: `CampaignSchedule`
- **Purpose**: Timed execution rules and recurring cron schedules for campaigns.
- **Data Stored**: Campaign ID, Scheduled At timestamp, Cron expression (5-field format), Schedule status (`pending`, `executed`, `cancelled`).

---

## 🎧 Module 10: Support Ticket Management System

### 55. `SupportTicket`
- **Model Name**: `SupportTicket`
- **Purpose**: Central record for support requests and helpdesk tickets.
- **Data Stored**: 
  - Ticket Identifier: Unique Ticket Number (e.g. `TKT-00001`).
  - Ticket Info: Subject, Description text, Category (Loan, OCR, EVV, Payment), Priority (`critical`, `high`, `medium`, `low`), Status (`open`, `in_progress`, `resolved`, `closed`).
  - Creator Details: Creator ID, Name, Email, Role (`user`, `agent`, `staff`, `bank`, `admin`).
  - Assignment: Assigned Agent ID/Name, Assigned Team ID/Name, Department.
  - Linked Context: Linked Loan Application ID/Number, Student ID/Name, University.
  - SLA & Satisfaction: SLA Breached flag, Target Response Time, Target Resolve Time, First Response timestamp, Resolved timestamp, Satisfaction Score (1-5), Satisfaction Note.

### 56. `SupportComment`
- **Model Name**: `SupportComment`
- **Purpose**: Timeline updates and internal notes on support tickets.
- **Data Stored**: Ticket ID, Author ID, Author Name, Author Role, Comment content text, Type (`public`, `internal_note`), `isInternal` flag.

### 57. `SupportAttachment`
- **Model Name**: `SupportAttachment`
- **Purpose**: Uploaded files attached to support tickets.
- **Data Stored**: Ticket ID, File Name, File Path, File Size, Mime Type, Uploaded By User ID & Name.

### 58. `SupportActivityLog`
- **Model Name**: `SupportActivityLog`
- **Purpose**: Immutable history of ticket state modifications.
- **Data Stored**: Ticket ID, Actor ID & Name, Action (`created`, `status_changed`, `priority_changed`, `assigned`, `resolved`), Old Value, New Value, Metadata JSON.

### 59. `SupportNotification`
- **Model Name**: `SupportNotification`
- **Purpose**: Notifications generated for user/agent ticket updates.
- **Data Stored**: User ID, Ticket ID, Title, Message text, Type, Read state (`isRead`), Read At timestamp.

### 60. `SupportWatcher`
- **Model Name**: `SupportWatcher`
- **Purpose**: Team members following updates on specific support tickets.
- **Data Stored**: `ticketId`, `userId`, `userName`.

### 61. `SupportCategory`
- **Model Name**: `SupportCategory`
- **Purpose**: Categories for sorting tickets.
- **Data Stored**: Category Name, Unique Slug, Description, Color tag, Default Team ID, `isActive` flag, Sort Order.

### 62. `SupportTeam`
- **Model Name**: `SupportTeam`
- **Purpose**: Internal department teams handling ticket queues.
- **Data Stored**: Team Name, Description, Group Email, Color identifier, `isActive` flag.

### 63. `SupportSLA`
- **Model Name**: `SupportSLA`
- **Purpose**: Response and resolution targets based on ticket priority.
- **Data Stored**: Priority level (`critical`, `high`, `medium`, `low`), Response Target (minutes), Resolution Target (minutes), `isActive` flag.

### 64. `KnowledgeBaseArticle`
- **Model Name**: `KnowledgeBaseArticle`
- **Purpose**: Self-service help articles and FAQs.
- **Data Stored**: Article Title, Unique Slug, Content text, Category, Tags array, Published status, Views counter, Author ID & Name.
