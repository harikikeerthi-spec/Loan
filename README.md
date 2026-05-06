# VidhyaLoan Management System

![VidhyaLoan Banner](https://img.shields.io/badge/VidhyaLoan-Admin%20System-blueviolet?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-11+-E0234E?style=for-the-badge&logo=nestjs)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)

A professional-grade, full-stack platform for managing loan applications, agent referrals, and corporate communications. Built with a modern tech stack focusing on performance, scalability, and premium user experience.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.x or higher
- **Database**: Supabase account and project
- **Messaging**: Twilio account for WhatsApp integration
- **Email**: SMTP server or service for notifications

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Loan
   ```

2. **Install Dependencies**
   ```bash
   # Install root and workspace dependencies
   npm install
   cd frontend && npm install
   cd ../server && npm install
   cd ..
   ```

3. **Environment Configuration**
   - Copy `server/.env.example` to `server/.env` and fill in your Supabase, Twilio, and SMTP credentials.
   - Configure `frontend/.env.local` for API and Supabase connectivity.

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   *Access the frontend at `http://localhost:3000` and the backend at `http://localhost:3001`.*

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI/UX**: React 19, Framer Motion (Animations)
- **Styling**: Tailwind CSS 4, Glassmorphism design
- **Charts**: Chart.js & React-Chartjs-2
- **Real-time**: Socket.io-client

### Backend
- **Framework**: NestJS 11
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Socket.io & WebSockets
- **Communication**: Twilio (WhatsApp), Nodemailer (Email)
- **Security**: JWT Authentication, Role-Based Access Control (RBAC)

---

## ✨ Key Modules

### 👑 Admin & Staff Dashboards
- **Application Tracking**: Real-time monitoring of loan applications across different banks and statuses.
- **User Management**: Comprehensive tools for managing students, agents, and staff members.
- **Blog CMS**: Full-featured content management system with tags, categories, and publication workflows.
- **Analytics**: Deep insights into application trends, bank performance, and user engagement.

### 💬 Multi-Party Chat System
- **Omnichannel Support**: Integrated WhatsApp, Email, and in-app chat.
- **Collaborative Rooms**: Support for conversations involving customers, staff, and bank partners.
- **Role-based Filtering**: Bank partners only see conversations relevant to their institution.

### 👥 Agent & Partner Portal
- **Referral Management**: Track lead status and conversion metrics for agents.
- **Bank Integration**: Dedicated interfaces for partner banks to manage their assigned applications.

---

## 📂 Project Structure

```text
Loan/
├── frontend/           # Next.js 16 Frontend
│   ├── app/            # App Router & Page components
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context providers (Auth, Theme)
│   └── public/         # Static assets & icons
├── server/             # NestJS 11 Backend
│   ├── src/            # Core business logic
│   │   ├── auth/       # Authentication & Security
│   │   ├── chat/       # Multi-party chat & WhatsApp logic
│   │   ├── community/  # Blog & Community features
│   │   └── reference/  # Master data (Banks, Countries, etc.)
│   └── scripts/        # Database migration & seed scripts
└── docs/               # System documentation & guides
```

---

## 🔧 Maintenance & Documentation

The system includes several built-in tools for maintenance:
- **Admin CLI**: `node setup-admin.js` for quick administrative account management.
- **Data Auditing**: Scripts in `scratch/` for verifying database integrity and schema consistency.
- **Detailed Guides**:
  - [Getting Started Guide](file:///c:/Projects/Sun%20Glade/Loan/GETTING_STARTED.md)
  - [Admin Dashboard Reference](file:///c:/Projects/Sun%20Glade/Loan/ADMIN_DASHBOARD_GUIDE.md)
  - [Multi-party Chat Quickstart](file:///c:/Projects/Sun%20Glade/Loan/MULTIPARTY_CHAT_QUICKSTART.md)

---

## 📄 License
This project is UNLICENSED.

---
*Built with ❤️ for the VidhyaLoan Platform.*
