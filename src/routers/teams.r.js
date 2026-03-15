const express = require('express');
const router = express.Router();

const controller = require('../controllers/teams.c');
const uploadLogo = require('../utils/multer/upload-team-logo');
const uploadAvatar = require('../utils/multer/upload-player-avatar');

const { checkAuthenticated, checkTeamStaff, checkOwnTeam } = require('../utils/auth-helper');

router.get('/', controller.getTeams);
router.get('/search', controller.getSearchTeams);

router.get('/my', checkAuthenticated, checkTeamStaff, controller.getMyTeams);

router.get('/create', checkAuthenticated, checkTeamStaff, controller.getCreateTeam);
router.post('/create-info', checkAuthenticated, checkTeamStaff, controller.postCreateTeam);
router.post('/:teamId/enroll-current-tournament', checkAuthenticated, checkTeamStaff, checkOwnTeam, controller.postEnrollCurrentTournament);
router.post('/:teamId/enroll-tournament', checkAuthenticated, checkTeamStaff, checkOwnTeam, controller.postEnrollCurrentTournament);
router.post('/:teamId/update-logo', checkAuthenticated, checkTeamStaff, checkOwnTeam, uploadLogo.single('logo'), controller.postUpdateLogo);

router.get('/:teamId', controller.getTeam);

router.get('/:teamId/members', controller.getTeamMembers);

router.get('/:teamId/edit', checkAuthenticated, checkTeamStaff, checkOwnTeam, controller.getEditTeam);
router.post('/:teamId/edit', checkAuthenticated, checkTeamStaff, checkOwnTeam, uploadLogo.single('logo'), controller.postEditTeam);

router.get('/:teamId/edit/members', checkAuthenticated, checkTeamStaff, checkOwnTeam, controller.getEditTeamMembers);
router.delete('/:teamId/edit/members/:playerId', checkAuthenticated, checkTeamStaff, checkOwnTeam, controller.deleteTeamMember);
router.post('/:teamId/edit/members', checkAuthenticated, checkTeamStaff, checkOwnTeam, controller.postEditTeamMembers);
router.post('/:teamId/edit/members/:playerId/avatar', checkAuthenticated, checkTeamStaff, checkOwnTeam, uploadAvatar.single('avatar'), controller.postUpdatePlayerAvatar);

router.delete('/:teamId/delete', checkAuthenticated, checkTeamStaff, checkOwnTeam, controller.deleteTeam);

router.get('/:teamId/statistics', controller.getTeamStatistics); // Not implemented yet

module.exports = router;
