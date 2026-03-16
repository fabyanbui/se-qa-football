# Tech Stack

- Frontend: Server‑side rendered Handlebars (express-handlebars) + static assets (public/) —
HTML/CSS/vanilla JS.
- Backend: Node.js (JavaScript) with Express.js.
- Database: PostgreSQL accessed via node-postgres (pg) Pool (raw SQL, no ORM).
- Auth: Passport.js (passport-local) + bcrypt for password hashing; sessions via express-session
(in-memory by default).
- Templating: Handlebars (express-handlebars, express-handlebars-sections).
- File upload: multer.
- Scheduling/jobs: node-schedule.
- Dev/tools: npm (package.json), nodemon (dev), dotenv for env.
- Deployment: runs with npm start / node server.js (no Docker/CI config present).
