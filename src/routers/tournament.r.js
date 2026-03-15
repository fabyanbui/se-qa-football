const express = require('express');
const router = express.Router();

const controller = require('../controllers/tournament.c');
const uploadLogo = require('../utils/multer/upload-logo');
const uploadBanner = require('../utils/multer/upload-banner');

const { checkTournamentOwnership } = require('../utils/auth-helper');
const { checkTournament, checkTournamentContext, redirectToCurrentTournamentPath } = require('../utils/tournament-helper');

const tournamentContextPath = '/:tournamentId(\\d+)';

// legacy redirects
router.get('/', redirectToCurrentTournamentPath(''));
router.get('/teams', redirectToCurrentTournamentPath('/teams'));
router.get('/teams/leaderboard', redirectToCurrentTournamentPath('/teams/leaderboard'));
router.get('/matches', redirectToCurrentTournamentPath('/matches'));
router.get('/matches/:id', redirectToCurrentTournamentPath(req => `/matches/${req.params.id}`));
router.get('/statistics', redirectToCurrentTournamentPath('/statistics'));
router.get('/statistics/players', redirectToCurrentTournamentPath('/statistics/players'));
router.get('/modifications', redirectToCurrentTournamentPath('/modifications'));
router.get('/modifications/teams', redirectToCurrentTournamentPath('/modifications/teams'));
router.get('/modifications/matches', redirectToCurrentTournamentPath('/modifications/matches'));
router.get('/matches/:id/edit', redirectToCurrentTournamentPath(req => `/matches/${req.params.id}/edit`));
router.get('/matches/:id/edit/players', redirectToCurrentTournamentPath(req => `/matches/${req.params.id}/edit/players`));
router.get('/matches/:id/edit/tickets', redirectToCurrentTournamentPath(req => `/matches/${req.params.id}/edit/tickets`));

// legacy mutation routes (fallback to current active tournament)
router.post('/modifications/info', checkTournament, checkTournamentOwnership, controller.postModificationsInfo);
router.post('/modifications/logo', checkTournament, checkTournamentOwnership, uploadLogo.single('logo'), controller.posModificationsLogo);
router.post('/modifications/banner', checkTournament, checkTournamentOwnership, uploadBanner.single('banner'), controller.postModificationsBanner);
router.put('/modifications/teams/:teamId/accept', checkTournament, checkTournamentOwnership, controller.putModificationsTeamsAccept);
router.put('/modifications/teams/:teamId/reject', checkTournament, checkTournamentOwnership, controller.putModificationsTeamsReject);
router.put('/modifications/matches', checkTournament, checkTournamentOwnership, controller.putModificationsMatches);
router.post('/matches/:id/edit/goals', checkTournament, checkTournamentOwnership, controller.addNewGoal);
router.post('/matches/:id/edit/cards', checkTournament, checkTournamentOwnership, controller.addNewCard);

// explicit tournament context routes
router.get(`${tournamentContextPath}`, checkTournamentContext, controller.getTournament);

router.get(`${tournamentContextPath}/teams`, checkTournamentContext, controller.getTeams);
router.get(`${tournamentContextPath}/teams/leaderboard`, checkTournamentContext, controller.getTeamsLeaderboard);

router.get(`${tournamentContextPath}/matches`, checkTournamentContext, controller.getMatches);
router.get(`${tournamentContextPath}/matches/:id`, checkTournamentContext, controller.getMatchById);

router.get(`${tournamentContextPath}/statistics`, checkTournamentContext, controller.getStatistics);
router.get(`${tournamentContextPath}/statistics/players`, checkTournamentContext, controller.getStatisticsPlayers);

// admin
router.get(`${tournamentContextPath}/modifications`, checkTournamentContext, checkTournamentOwnership, controller.getModifications);
router.get(`${tournamentContextPath}/modifications/teams`, checkTournamentContext, checkTournamentOwnership, controller.getTeamsModifications);
router.get(`${tournamentContextPath}/modifications/matches`, checkTournamentContext, checkTournamentOwnership, controller.getMatchesModifications);

router.post(`${tournamentContextPath}/modifications/info`, checkTournamentContext, checkTournamentOwnership, controller.postModificationsInfo);
router.post(`${tournamentContextPath}/modifications/logo`, checkTournamentContext, checkTournamentOwnership, uploadLogo.single('logo'), controller.posModificationsLogo);
router.post(`${tournamentContextPath}/modifications/banner`, checkTournamentContext, checkTournamentOwnership, uploadBanner.single('banner'), controller.postModificationsBanner);

router.put(`${tournamentContextPath}/modifications/teams/:teamId/accept`, checkTournamentContext, checkTournamentOwnership, controller.putModificationsTeamsAccept);
router.put(`${tournamentContextPath}/modifications/teams/:teamId/reject`, checkTournamentContext, checkTournamentOwnership, controller.putModificationsTeamsReject);

router.put(`${tournamentContextPath}/modifications/matches`, checkTournamentContext, checkTournamentOwnership, controller.putModificationsMatches);

router.get(`${tournamentContextPath}/matches/:id/edit`, checkTournamentContext, checkTournamentOwnership, controller.getMatchByIdEdit);
router.post(`${tournamentContextPath}/matches/:id/edit/goals`, checkTournamentContext, checkTournamentOwnership, controller.addNewGoal);
router.post(`${tournamentContextPath}/matches/:id/edit/cards`, checkTournamentContext, checkTournamentOwnership, controller.addNewCard);
router.get(`${tournamentContextPath}/matches/:id/edit/players`, checkTournamentContext, checkTournamentOwnership, controller.getMatchByIdEditPlayers);
router.get(`${tournamentContextPath}/matches/:id/edit/tickets`, checkTournamentContext, checkTournamentOwnership, controller.getMatchByIdEditTickets); // => Not implemente

module.exports = router;
