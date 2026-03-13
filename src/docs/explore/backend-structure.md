  # Backend Structure
  
  routers/

   - index.r.js
   - auth.r.js
   - home.r.js
   - management.r.js
   - profile.r.js
   - teams.r.js
   - tournament.r.js

  controllers/

   - auth.c.js
   - home.c.js
   - management.c.js
   - profile.c.js
   - teams.c.js
   - tournament.c.js

  models/

   - user.m.js
   - tournament.m.js
   - team.m.js
   - match.m.js
   - player.m.js

  middlewares/

   - passport.mw.js
   - favicon.mw.js
   - node-schedule.mw.js
   - hbs/ (Handlebars setup middleware)

  utils/

   - auth-helper.js
   - tournament-helper.js
   - multer/ (upload config)
   - database/ (db-config.js and per-entity db* modules; contains dbUsers, dbTeams, dbPlayers, dbTournaments, dbMatches, dbFormats)

  resources/

   - initialize.sql

  server.js (app entrypoint)
