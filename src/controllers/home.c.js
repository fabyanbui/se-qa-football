const TournamentModel = require("../models/tournament.m");
const TeamModel = require("../models/team.m");
const dbPlayers = require("../utils/database/dbPlayers");

module.exports = {

  // GET /
  getHome: async function (req, res) {
    const user = (req.isAuthenticated() ? req.user : null);
    res.render('home', {
      title: "Trang chủ",
      useTransHeader: true,
      user: user,
      nOfTournaments: await TournamentModel.count(),
      nOfTeams: await TeamModel.countAllTeams(),
      nOfPlayers: await dbPlayers.countAllPlayers(),
    });
  },

  // GET /about
  getAbout: function (req, res) {
    const user = (req.isAuthenticated() ? req.user : null);
    res.render('about', {
      title: "Giới thiệu",
      useTransHeader: false,
      user: user,
    });
  },

  // GET /create
  getCreate: function (req, res) {
    const user = (req.isAuthenticated() ? req.user : null);
    if (req.session) {
      req.session.createdTournamentId = null;
    }
    res.render('tournament/create', {
      title: "Tạo giải đấu",
      useTransHeader: true,
      user: user,
    });
  },

  // POST /create/info
  postCreate: async function (req, res) {
    const user = (req.isAuthenticated() ? req.user : null);
    const organizerId = Number.parseInt(user?.id, 10);
    if (!Number.isInteger(organizerId)) {
      return res.status(403).send({
        status: "error",
        message: "Không xác định được người tổ chức giải đấu.",
      });
    }

    const tournament = { ...req.body, organizerId };
    const createdTournament = await TournamentModel.create(tournament);
    if (!createdTournament) {
      return res.status(400).send({
        status: "error",
        message: "Tạo giải đấu thất bại!",
      });
    }
    if (req.session) {
      req.session.createdTournamentId = createdTournament.id;
    }

    res.send({
      status: "success",
      message: "Tạo giải đấu thành công!",
      tournamentId: createdTournament.id,
    });
  },

  // POST /create/logo and /create/banner : after upload logo and banner
  postCreateImg: async function (req, res) {
    res.send({
      status: "success",
      message: "Tạo giải đấu thành công!",
    });
  },

};
