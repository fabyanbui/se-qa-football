const express = require('express');
const router = express.Router();

const controller = require('../controllers/management.c');

const { checkAuthenticated, checkAdmin, checkTournamentStaff } = require('../utils/auth-helper');

router.get('/', checkAuthenticated, controller.getTeamManagement);

router.get('/tickets', checkAdmin, controller.getTicketManagement);
router.get('/accounts', checkTournamentStaff, controller.getAccountManagement);
router.put('/accounts/:userId/role', checkTournamentStaff, controller.putAccountRole);


module.exports = router;
