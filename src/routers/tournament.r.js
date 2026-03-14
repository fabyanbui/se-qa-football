const express = require('express');
const router = express.Router();

const controller = require('../controllers/tournament.c');
const uploadLogo = require('../utils/multer/upload-logo');
const uploadBanner = require('../utils/multer/upload-banner');

const { checkTournamentStaff } = require('../utils/auth-helper');

router.get('/', controller.getTournament);

router.get('/teams', controller.getTeams);
router.get('/teams/leaderboard', controller.getTeamsLeaderboard);

router.get('/matches', controller.getMatches);
router.get('/matches/:id', controller.getMatchById);

router.get('/statistics', controller.getStatistics);
router.get('/statistics/players', controller.getStatisticsPlayers);

// admin
router.get('/modifications', checkTournamentStaff, controller.getModifications);
router.get('/modifications/teams', checkTournamentStaff, controller.getTeamsModifications);
router.get('/modifications/matches', checkTournamentStaff, controller.getMatchesModifications);

router.post('/modifications/info', checkTournamentStaff, controller.postModificationsInfo);
router.post('/modifications/logo', checkTournamentStaff, uploadLogo.single('logo'), controller.posModificationsLogo);
router.post('/modifications/banner', checkTournamentStaff, uploadBanner.single('banner'), controller.postModificationsBanner);

router.put('/modifications/teams/:teamId/accept', checkTournamentStaff, controller.putModificationsTeamsAccept);
router.put('/modifications/teams/:teamId/reject', checkTournamentStaff, controller.putModificationsTeamsReject);

router.put('/modifications/matches', checkTournamentStaff, controller.putModificationsMatches);

router.get('/matches/:id/edit', checkTournamentStaff, controller.getMatchByIdEdit);
router.post('/matches/:id/edit/goals', checkTournamentStaff, controller.addNewGoal);
router.post('/matches/:id/edit/cards', checkTournamentStaff, controller.addNewCard);
router.get('/matches/:id/edit/players', checkTournamentStaff, controller.getMatchByIdEditPlayers);
router.get('/matches/:id/edit/tickets', checkTournamentStaff, controller.getMatchByIdEditTickets); // => Not implemente

module.exports = router;
