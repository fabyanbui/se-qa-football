require('dotenv').config();
const express = require('express');
const app = express();

const path = require('path');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

require('./middlewares/favicon.mw')(app);
require('./middlewares/hbs/hbs.mw')(app);

require('./middlewares/passport.mw')(app);

require('./middlewares/node-schedule.mw')();

require('./routers/index.r')(app);

const dbUsers = require('./utils/database/dbUsers');

const http = require('http');
const httpServer = http.createServer(app);
const port = process.env.PORT || 3000;

async function bootstrapAndStart() {
  await dbUsers.ensureSeedAdmin(
    process.env.ADMIN_SEED_EMAIL,
    process.env.ADMIN_SEED_PASSWORD
  );
  httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

bootstrapAndStart().catch((err) => {
  console.error('Server bootstrap failed:', err.message);
  process.exit(1);
});
