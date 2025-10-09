FreelanceHub

Overview
FreelanceHub is a comprehensive freelance service marketplace connecting clients with skilled freelancers. Built with modern web technologies, it features a professional React frontend and robust Node.js backend with MongoDB Atlas integration.

What this is (student capstone project)
- Built incrementally over 7 weeks following agile development practices
- Professional-grade marketplace design inspired by Upwork and Fiverr
- Complete full-stack implementation with modern UI/UX
- Uses dev-only header (`x-user-email`) for authentication during development

Current Status: **Week 5 Complete** (71% finished)
- ✅ All core features implemented and functional
- ✅ Professional marketplace design with responsive layout
- ✅ Advanced search, notifications, and admin functionality
- ✅ Stripe payment integration and time tracking

Project Timeline (7 weeks, 30h/week)
- Week 1: Project setup, auth foundation, health endpoint, docs
- Week 2: Profiles, project posting, search, basic proposals
- Week 3: Proposal mgmt, messaging, file upload, project dashboard
- Week 4: Time tracking, payments (Stripe), reviews, admin dashboard
- Week 5: Notifications, advanced search, testing, UI polish
- Week 6: Performance, final testing, docs, deployment prep
- Week 7: Final polish, UAT, go-live, presentation

Features Implemented
- 🚀 **User Management**: Registration, profiles, authentication
- 📋 **Project Management**: Create, search, filter projects with advanced criteria
- 💼 **Proposal System**: Submit, review, accept/reject proposals
- 💬 **Messaging**: Real-time communication between users
- ⏱️ **Time Tracking**: Built-in timer for freelancers
- 💳 **Payments**: Secure Stripe integration for transactions
- ⭐ **Reviews**: Rating and feedback system
- 🔔 **Notifications**: Smart notification system with real-time updates
- 🔍 **Advanced Search**: Filter by category, budget, skills, location
- 👨‍💼 **Admin Dashboard**: Complete user and project management
- 📱 **Responsive Design**: Mobile-first, professional marketplace UI

Local Development
1) Server (API)
   - cd server
   - Create `.env` (see below)
   - npm run dev
   - Health check: http://localhost:4000/health

2) Client (React + Vite)
   - cd client
   - Create `.env.local` (see below)
   - npm run dev
   - Open: http://localhost:5173

Environment Variables
Server `.env` (create at `server/.env`)
- PORT=4000
- NODE_ENV=development
- MONGODB_URI=your_mongodb_connection
- JWT_SECRET=your_long_random_string
- SENDGRID_API_KEY=... (optional)
- STRIPE_SECRET_KEY=... (optional)
- STRIPE_WEBHOOK_SECRET=... (optional)
- CORS_ORIGIN=http://localhost:5173

Client `.env.local`
- VITE_API_BASE_URL=http://localhost:4000
- VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx (optional)

Repository Structure
```
Capstone/
├─ client/            # Existing React + Vite app (already present)
├─ server/            # Express + TypeScript API
│  ├─ src/
│  │  └─ index.ts
│  ├─ package.json
│  └─ tsconfig.json
├─ docs/
│  ├─ wireframes.md
│  ├─ data-flow-diagrams.md
│  ├─ database-schema.md
│  └─ requirements-links.md
└─ README.md
```

API Quick Start
- GET /health → Returns `{ status: 'ok', uptime }`
- POST /api/profile (header `x-user-email`) → upsert profile
- POST /api/projects (header `x-user-email` as client) → create project
- GET /api/projects → list/search projects
- POST /api/projects/:id/proposals (header `x-user-email` as freelancer) → submit proposal
- POST /api/proposals/:id/accept → accept proposal
- POST /api/messages (header `x-user-email`) → send message

Week 4 Features
- POST /api/time/start → start timer
- POST /api/time/stop → stop timer  
- GET /api/time?projectId=X → get time entries
- POST /api/reviews → submit review
- GET /api/reviews?projectId=X → get reviews
- POST /api/payments/intent → create Stripe payment intent
- GET /api/admin/users → admin user list
- GET /api/admin/projects → admin project list
- POST /api/admin/users/:id/suspend → suspend user

Week 5 Features (COMPLETED)
- GET /api/notifications → get user notifications
- PATCH /api/notifications/:id/read → mark notification as read
- PATCH /api/notifications/read-all → mark all notifications as read
- GET /api/notifications/unread-count → get unread notification count
- Enhanced /api/projects with advanced filtering (category, budget, skills, pagination)

User Interface
- 🎨 **Professional Design**: Upwork/Fiverr-inspired marketplace layout
- 📱 **Fully Responsive**: Mobile-first design with CSS Grid and Flexbox
- ⚡ **Modern UX**: Loading states, error handling, smooth animations
- 🎯 **Intuitive Navigation**: Clear information architecture
- 🌟 **Interactive Elements**: Hover effects, transitions, and micro-interactions

Project Status
- **Completion**: 25/25 Must Have user stories (100%)
- **Features**: 15+ major features implemented
- **Code Quality**: ESLint, Prettier, TypeScript throughout
- **Documentation**: Complete wireframes, data flows, database schemas
- **Testing**: Usability tested with 5 participants

Docs
- See `docs/` for wireframes, data flows (with error handling), and database schemas
- Usability test report completed with participant feedback

Notes
- Do not commit `.env` files or `server/uploads/` (see `.gitignore`)
- Authentication currently uses `x-user-email` header for development
- Ready for production deployment with JWT implementation


