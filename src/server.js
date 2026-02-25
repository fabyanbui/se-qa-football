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



const http = require('http');
const httpServer = http.createServer(app);
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
