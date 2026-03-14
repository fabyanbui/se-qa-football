const express = require('express');
const router = express.Router();

const { checkTournamentStaff } = require('../utils/auth-helper');
const { checkNoTournament } = require('../utils/tournament-helper');

const uploadLogo = require('../utils/multer/upload-logo');
const uploadBanner = require('../utils/multer/upload-banner');

const controller = require('../controllers/home.c');

router.get('/', controller.getHome);

router.get('/about', controller.getAbout);

router.get('/create', checkTournamentStaff, checkNoTournament, controller.getCreate);
router.post('/create/info', checkTournamentStaff, checkNoTournament, controller.postCreate);
router.post('/create/logo', checkTournamentStaff, uploadLogo.single('logo'), controller.postCreateImg);
router.post('/create/banner', checkTournamentStaff, uploadBanner.single('banner'), controller.postCreateImg);

module.exports = router;
