const express = require('express');
const router = express.Router();

const controller = require('../controllers/management.c');

const { checkAuthenticated, checkAdmin, checkTournamentStaff, checkTeamStaff } = require('../utils/auth-helper');

router.get('/', checkAuthenticated, checkTeamStaff, controller.getTeamManagement);

router.get('/tickets', checkAdmin, controller.getTicketManagement);
router.get('/accounts', checkAdmin, controller.getAccountManagement);
router.get('/tournaments', checkTournamentStaff, controller.getTournamentManagement);


module.exports = router;
