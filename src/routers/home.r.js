const express = require('express');
const router = express.Router();

const { checkTournamentStaff, checkTournamentOwnership } = require('../utils/auth-helper');
const { checkCreatedTournament } = require('../utils/tournament-helper');

const uploadLogo = require('../utils/multer/upload-logo');
const uploadBanner = require('../utils/multer/upload-banner');

const controller = require('../controllers/home.c');

router.get('/', controller.getHome);

router.get('/about', controller.getAbout);

router.get('/create', checkTournamentStaff, controller.getCreate);
router.post('/create/info', checkTournamentStaff, controller.postCreate);
router.post('/create/logo', checkTournamentStaff, checkCreatedTournament, checkTournamentOwnership, uploadLogo.single('logo'), controller.postCreateImg);
router.post('/create/banner', checkTournamentStaff, checkCreatedTournament, checkTournamentOwnership, uploadBanner.single('banner'), controller.postCreateImg);

module.exports = router;
