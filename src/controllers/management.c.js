const TeamModel = require('../models/team.m');
const TournamentModel = require('../models/tournament.m');
const UserModel = require('../models/user.m');

module.exports = {

  // GET /management
  getTeamManagement: async function (req, res) {
    const user = (req.isAuthenticated() ? req.user : null);
    const ownTeams = user.isAdmin
      ? await TeamModel.getAllTeams()
      : await TeamModel.getTeamsByOwner(user.id);
    const activeTournaments = await TournamentModel.getAllActiveTournaments();
    res.render('management/teams', {
      title: "Quản lý đội bóng",
      useTransHeader: true,
      user: user,
      subNavigation: 0,
      teams: ownTeams || [],
      hasActiveTournament: activeTournaments.length > 0,
      activeTournaments: activeTournaments,
    });
  },

  // GET /management/tickets
  getTicketManagement: function (req, res) {
    const user = (req.isAuthenticated() ? req.user : null);
    res.render('management/tickets', {
      title: "Quản lý vé",
      useTransHeader: true,
      user: user,
      subNavigation: 1,
    });
  },

  // GET /management/accounts
  getAccountManagement: async function (req, res, next) {
    const user = (req.isAuthenticated() ? req.user : null);
    try {
      const allUsers = await UserModel.getAllUsers();
      const accounts = await Promise.all(
        allUsers
          .filter(account => !account.isAdmin)
          .map(async (account) => {
            const [ownedTournaments, managedTeams] = await Promise.all([
              TournamentModel.getTournamentsByOrganizer(account.id),
              TeamModel.getTeamsByOwner(account.id),
            ]);
            account.ownedTournaments = ownedTournaments || [];
            account.managedTeams = managedTeams || [];
            return account;
          })
      );

      res.render('management/accounts', {
        title: "Quản lý tài khoản",
        useTransHeader: true,
        user: user,
        subNavigation: 2,
        accounts: accounts,
      });
    } catch (err) {
      return next(err);
    }
  },

  // GET /management/tournaments
  getTournamentManagement: async function (req, res, next) {
    const user = (req.isAuthenticated() ? req.user : null);

    try {
      const tournaments = user.isAdmin
        ? await TournamentModel.getAllActiveTournaments()
        : await TournamentModel.getActiveTournamentsByOrganizer(user.id);

      res.render('management/tournaments', {
        title: "Quản lý giải đấu",
        useTransHeader: true,
        user: user,
        subNavigation: 3,
        tournaments: tournaments || [],
      });
    } catch (err) {
      return next(err);
    }
  },

};
