API Server

Scripts:
- npm run dev: Start the dev server with ts-node-dev
- npm run build: Compile TypeScript to dist
- npm start: Run compiled server

Endpoints:
- GET /health → { status: 'ok', uptime }
- POST /api/profile (header x-user-email) → upsert my profile
- GET /api/profile/me (header x-user-email)
- POST /api/projects (header x-user-email as client)
- GET /api/projects?q=&category=
- GET /api/projects/:id
- POST /api/projects/:id/proposals (header x-user-email as freelancer)
- GET /api/projects/:id/proposals
- POST /api/proposals/:id/accept
- POST /api/proposals/:id/reject
- POST /api/messages (header x-user-email)
- GET /api/messages?withUserId=&projectId=
- POST /api/upload (form-data: file)

Env (.env):
- PORT=4000
- MONGODB_URI=your_connection_string
- JWT_SECRET=your_secret
- STRIPE_SECRET_KEY=your_stripe_key
- CORS_ORIGIN=http://localhost:5173

