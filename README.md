FreelanceHub

Overview
FreelanceHub is a freelance service marketplace connecting clients with freelancers. This repo contains a React client (already set up on your machine) and an Express + TypeScript API in `server/`.

Project Timeline (7 weeks, 30h/week)
- Week 1: Project setup, auth foundation, health endpoint, docs
- Week 2: Profiles, project posting, search, basic proposals
- Week 3: Proposal mgmt, messaging, file upload, project dashboard
- Week 4: Time tracking, payments (Stripe), reviews, admin dashboard
- Week 5: Notifications, advanced search, testing, UI polish
- Week 6: Performance, final testing, docs, deployment prep
- Week 7: Final polish, UAT, go-live, presentation

Local Development
1) Server (API)
   - cd server
   - Create `.env` (see below)
   - npm run dev
   - Health check: http://localhost:4000/health

2) Client (Vite React)
   - Use your existing client app
   - Set `VITE_API_BASE_URL=http://localhost:4000` in client `.env.local`
   - Start client dev server

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

Docs
- See `docs/` for wireframes, data flows (with error handling), and database schema.


